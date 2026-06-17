import { db, screenerTable, ohlcTable, syncStateTable } from "@workspace/db";
import { eq, and, gte, lte, asc, sql } from "drizzle-orm";

export let isSyncing = false;
export let lastSyncTime: Date | null = null;

interface YahooChartResult {
  timestamp?: number[];
  indicators?: {
    quote?: Array<{
      open?: (number | null)[];
      high?: (number | null)[];
      low?: (number | null)[];
      close?: (number | null)[];
      volume?: (number | null)[];
    }>;
  };
  meta?: {
    regularMarketPrice?: number;
    previousClose?: number;
    currency?: string;
  };
}

function dateToInt(date: Date): number {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return parseInt(`${y}${m}${d}`, 10);
}

function isWeekend(date: Date): boolean {
  const day = date.getUTCDay();
  return day === 0 || day === 6;
}

function intToDate(dateInt: number): Date {
  const s = String(dateInt);
  return new Date(`${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}T00:00:00Z`);
}

async function fetchYahooOhlc(
  ticker: string,
  range = "1y"
): Promise<YahooChartResult | null> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}.JK?interval=1d&range=${range}`;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; IDXScreener/1.0)",
        Accept: "application/json",
      },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { chart?: { result?: YahooChartResult[]; error?: unknown } };
    return json.chart?.result?.[0] ?? null;
  } catch {
    return null;
  }
}

export async function syncStockOhlc(
  code: string,
  startDateInt: number,
  endDateInt: number
): Promise<void> {
  const result = await fetchYahooOhlc(code, "6mo");
  if (!result?.timestamp) return;

  const timestamps = result.timestamp;
  const quote = result.indicators?.quote?.[0];
  if (!quote) return;

  const startDate = intToDate(startDateInt);
  const endDate = intToDate(endDateInt);
  const rows: typeof ohlcTable.$inferInsert[] = [];

  for (let i = 0; i < timestamps.length; i++) {
    const d = new Date(timestamps[i]! * 1000);
    if (isWeekend(d)) continue;
    if (d < startDate || d > endDate) continue;

    const close = quote.close?.[i];
    if (close == null || isNaN(close)) continue;

    const open = quote.open?.[i] ?? close;
    const high = quote.high?.[i] ?? close;
    const low = quote.low?.[i] ?? close;
    const volume = quote.volume?.[i] ?? 0;

    rows.push({
      code,
      date: dateToInt(d),
      open: Math.round(open),
      high: Math.round(high),
      low: Math.round(low),
      close: Math.round(close),
      volume: Math.round(volume ?? 0),
      value: Math.round((volume ?? 0) * close),
      bidVolume: null,
      offerVolume: null,
      foreignBuy: null,
      foreignSell: null,
    });
  }

  if (rows.length === 0) return;

  const BATCH = 500;
  for (let i = 0; i < rows.length; i += BATCH) {
    await db.insert(ohlcTable).values(rows.slice(i, i + BATCH)).onConflictDoUpdate({
      target: [ohlcTable.code, ohlcTable.date],
      set: {
        open: sql`excluded.open`,
        high: sql`excluded.high`,
        low: sql`excluded.low`,
        close: sql`excluded.close`,
        volume: sql`excluded.volume`,
        value: sql`excluded.value`,
        updatedAt: new Date(),
      },
    });
  }
}

function calcPctChange(closes: { date: number; close: number }[], weeksAgo: number): number | null {
  if (closes.length < 2) return null;
  const today = closes[closes.length - 1]!;
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() - weeksAgo * 7);
  const targetInt = dateToInt(targetDate);

  let best = closes[0]!;
  for (const c of closes) {
    if (c.date <= targetInt && c.date > best.date) best = c;
    else if (best.date > targetInt) { best = closes[0]!; break; }
  }
  const base = closes.find(c => c.date <= targetInt) ?? closes[0]!;
  if (!base.close || base.close === 0) return null;
  return Math.round(((today.close - base.close) / base.close) * 1000) / 10;
}

function calcYtd(closes: { date: number; close: number }[]): number | null {
  if (closes.length < 2) return null;
  const today = closes[closes.length - 1]!;
  const year = Math.floor(today.date / 10000);
  const jan1Int = year * 10000 + 101;
  const base = [...closes].reverse().find(c => c.date < jan1Int);
  if (!base || !base.close) return null;
  return Math.round(((today.close - base.close) / base.close) * 1000) / 10;
}

function calcMtd(closes: { date: number; close: number }[]): number | null {
  if (closes.length < 2) return null;
  const today = closes[closes.length - 1]!;
  const yearMonth = Math.floor(today.date / 100);
  const firstOfMonth = yearMonth * 100 + 1;
  const base = [...closes].reverse().find(c => c.date < firstOfMonth);
  if (!base || !base.close) return null;
  return Math.round(((today.close - base.close) / base.close) * 1000) / 10;
}

export async function runFullSync(): Promise<void> {
  if (isSyncing) return;
  isSyncing = true;

  try {
    const stocks = await db.select({ code: screenerTable.code }).from(screenerTable);
    console.log(`[sync] Syncing ${stocks.length} stocks from Yahoo Finance...`);

    await db.insert(syncStateTable)
      .values({ id: "singleton", syncing: true, lastSync: lastSyncTime })
      .onConflictDoUpdate({ target: syncStateTable.id, set: { syncing: true } });

    let synced = 0;
    for (const { code } of stocks) {
      try {
        const result = await fetchYahooOhlc(code, "1y");
        if (!result?.timestamp) continue;

        const timestamps = result.timestamp;
        const quote = result.indicators?.quote?.[0];
        if (!quote) continue;

        const rows: typeof ohlcTable.$inferInsert[] = [];
        for (let i = 0; i < timestamps.length; i++) {
          const d = new Date(timestamps[i]! * 1000);
          if (isWeekend(d)) continue;
          const close = quote.close?.[i];
          if (close == null || isNaN(close)) continue;
          const open = quote.open?.[i] ?? close;
          const high = quote.high?.[i] ?? close;
          const low = quote.low?.[i] ?? close;
          const volume = quote.volume?.[i] ?? 0;
          rows.push({
            code,
            date: dateToInt(d),
            open: Math.round(open),
            high: Math.round(high),
            low: Math.round(low),
            close: Math.round(close),
            volume: Math.round(volume ?? 0),
            value: Math.round((volume ?? 0) * close),
            bidVolume: null,
            offerVolume: null,
            foreignBuy: null,
            foreignSell: null,
          });
        }

        if (rows.length === 0) continue;

        const BATCH = 500;
        for (let i = 0; i < rows.length; i += BATCH) {
          await db.insert(ohlcTable).values(rows.slice(i, i + BATCH)).onConflictDoUpdate({
            target: [ohlcTable.code, ohlcTable.date],
            set: {
              open: sql`excluded.open`,
              high: sql`excluded.high`,
              low: sql`excluded.low`,
              close: sql`excluded.close`,
              volume: sql`excluded.volume`,
              value: sql`excluded.value`,
              updatedAt: new Date(),
            },
          });
        }

        // Compute momentum metrics from stored OHLC
        const closes = rows
          .filter(r => r.close != null)
          .map(r => ({ date: r.date as number, close: r.close as number }))
          .sort((a, b) => a.date - b.date);

        const latestClose = closes[closes.length - 1]?.close ?? null;
        const week4PC = calcPctChange(closes, 4);
        const week13PC = calcPctChange(closes, 13);
        const week26PC = calcPctChange(closes, 26);
        const week52PC = calcPctChange(closes, 52);
        const ytdpc = calcYtd(closes);
        const mtdpc = calcMtd(closes);

        await db.update(screenerTable)
          .set({ week4PC, week13PC, week26PC, week52PC, ytdpc, mtdpc, updatedAt: new Date() })
          .where(eq(screenerTable.code, code));

        synced++;
        if (synced % 10 === 0) console.log(`[sync] ${synced}/${stocks.length} done`);

        // Small delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 200));
      } catch (err) {
        console.error(`[sync] Failed for ${code}:`, err);
      }
    }

    lastSyncTime = new Date();
    console.log(`[sync] Complete — ${synced}/${stocks.length} stocks updated`);

    await db.insert(syncStateTable)
      .values({ id: "singleton", syncing: false, lastSync: lastSyncTime })
      .onConflictDoUpdate({ target: syncStateTable.id, set: { syncing: false, lastSync: lastSyncTime } });

  } catch (err) {
    console.error("[sync] Error:", err);
    await db.insert(syncStateTable)
      .values({ id: "singleton", syncing: false, lastSync: lastSyncTime })
      .onConflictDoUpdate({ target: syncStateTable.id, set: { syncing: false } });
  } finally {
    isSyncing = false;
  }
}

export async function loadSyncState(): Promise<void> {
  try {
    const rows = await db.select().from(syncStateTable).limit(1);
    if (rows[0]) {
      lastSyncTime = rows[0].lastSync ?? null;
      // Reset syncing flag in case server crashed mid-sync
      if (rows[0].syncing) {
        await db.update(syncStateTable).set({ syncing: false }).where(eq(syncStateTable.id, "singleton"));
      }
    }
  } catch {
    // no state yet
  }
}

// Auto-sync: trigger once per day after 16:00 WIB (09:00 UTC)
export function startAutoSync(): void {
  const checkAndSync = async () => {
    const now = new Date();
    const utcHour = now.getUTCHours();
    const utcMinute = now.getUTCMinutes();
    // 09:00 UTC = 16:00 WIB (UTC+7)
    const isAfterClose = utcHour > 9 || (utcHour === 9 && utcMinute >= 0);

    const todayStr = now.toISOString().slice(0, 10);
    const lastSyncStr = lastSyncTime?.toISOString().slice(0, 10);
    const alreadySyncedToday = lastSyncStr === todayStr;
    const isWeekday = now.getUTCDay() >= 1 && now.getUTCDay() <= 5;

    if (isAfterClose && !alreadySyncedToday && isWeekday && !isSyncing) {
      console.log("[auto-sync] Market closed, triggering daily sync...");
      await runFullSync();
    }
  };

  // Check every 30 minutes
  setInterval(checkAndSync, 30 * 60 * 1000);
  // Also check on startup (delayed 10s)
  setTimeout(checkAndSync, 10_000);
}
