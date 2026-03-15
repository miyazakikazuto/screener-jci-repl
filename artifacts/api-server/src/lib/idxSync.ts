import { db, screenerTable, ohlcTable, syncStateTable } from "@workspace/db";
import { idxGet } from "./idxClient.js";
import { eq } from "drizzle-orm";

export let isSyncing = false;
export let lastSyncTime: Date | null = null;

interface ScreenerApiItem {
  stockCode?: string;
  companyName?: string | null;
  industry?: string | null;
  sector?: string | null;
  subSector?: string | null;
  subIndustry?: string | null;
  subIndustryCode?: string | null;
  indexCode?: string | null;
  marketCapital?: number | null;
  tRevenue?: number | null;
  npm?: number | null;
  per?: number | null;
  pbv?: number | null;
  roa?: number | null;
  roe?: number | null;
  der?: number | null;
  week4PC?: number | null;
  week13PC?: number | null;
  week26PC?: number | null;
  week52PC?: number | null;
  ytdpc?: number | null;
  mtdpc?: number | null;
  umaDate?: string | null;
  notation?: string | null;
  status?: string | null;
  corpAction?: string | null;
  corpActionDate?: string | null;
}

function toTitleCase(str: string | null | undefined): string | null {
  if (!str) return null;
  return str
    .toLowerCase()
    .replace(/(^|\s)\w/g, (c) => c.toUpperCase());
}

async function syncScreener(): Promise<number> {
  const url =
    "https://www.idx.co.id/support/stock-screener/api/v1/stock-screener/get";
  const res = await idxGet(url);
  if (!res.ok) {
    throw new Error(`IDX screener API returned ${res.status}`);
  }
  const data = (await res.json()) as { results?: ScreenerApiItem[] };
  const results = data.results ?? [];
  if (results.length === 0) return 0;

  for (const item of results) {
    const code = item.stockCode?.trim();
    if (!code) continue;

    const row = {
      code,
      name: item.companyName ? String(item.companyName) : null,
      industry: toTitleCase(item.industry as string | null),
      sector: toTitleCase(item.sector as string | null),
      subSector: toTitleCase(item.subSector as string | null),
      subIndustry: toTitleCase(item.subIndustry as string | null),
      subIndustryCode: item.subIndustryCode ? String(item.subIndustryCode) : null,
      indexCode: item.indexCode ? String(item.indexCode) : null,
      marketCapital: item.marketCapital ?? null,
      totalRevenue: item.tRevenue ?? null,
      npm: item.npm ?? null,
      per: item.per ?? null,
      pbv: item.pbv ?? null,
      roa: item.roa ?? null,
      roe: item.roe ?? null,
      der: item.der ?? null,
      week4PC: item.week4PC ?? null,
      week13PC: item.week13PC ?? null,
      week26PC: item.week26PC ?? null,
      week52PC: item.week52PC ?? null,
      ytdpc: item.ytdpc ?? null,
      mtdpc: item.mtdpc ?? null,
      umaDate: item.umaDate ?? null,
      notation: item.notation ?? null,
      status: item.status ?? null,
      corpAction: item.corpAction ?? null,
      corpActionDate: item.corpActionDate ?? null,
    };

    await db
      .insert(screenerTable)
      .values(row)
      .onConflictDoUpdate({
        target: screenerTable.code,
        set: {
          name: row.name,
          industry: row.industry,
          sector: row.sector,
          subSector: row.subSector,
          subIndustry: row.subIndustry,
          subIndustryCode: row.subIndustryCode,
          indexCode: row.indexCode,
          marketCapital: row.marketCapital,
          totalRevenue: row.totalRevenue,
          npm: row.npm,
          per: row.per,
          pbv: row.pbv,
          roa: row.roa,
          roe: row.roe,
          der: row.der,
          week4PC: row.week4PC,
          week13PC: row.week13PC,
          week26PC: row.week26PC,
          week52PC: row.week52PC,
          ytdpc: row.ytdpc,
          mtdpc: row.mtdpc,
          umaDate: row.umaDate,
          notation: row.notation,
          status: row.status,
          corpAction: row.corpAction,
          corpActionDate: row.corpActionDate,
          updatedAt: new Date(),
        },
      });
  }
  return results.length;
}

interface OhlcApiItem {
  Date?: string;
  OpenPrice?: number | null;
  HighPrice?: number | null;
  LowPrice?: number | null;
  ClosePrice?: number | null;
  Volume?: number | null;
  Value?: number | null;
  BidVolume?: number | null;
  OfferVolume?: number | null;
  ForeignBuy?: number | null;
  ForeignSell?: number | null;
}

export async function syncStockOhlc(
  code: string,
  startDateInt: number,
  endDateInt: number
): Promise<void> {
  const startStr = String(startDateInt);
  const endStr = String(endDateInt);
  const start = `${startStr.slice(0, 4)}-${startStr.slice(4, 6)}-${startStr.slice(6, 8)}`;
  const end = `${endStr.slice(0, 4)}-${endStr.slice(4, 6)}-${endStr.slice(6, 8)}`;

  const url = `https://www.idx.co.id/primary/StockData/GetChartStock?StockCode=${code}&Resolution=Daily&StartDate=${start}&EndDate=${end}`;
  const res = await idxGet(url);
  if (!res.ok) return;

  const data = (await res.json()) as { ChartData?: OhlcApiItem[] };
  const items = data.ChartData ?? [];

  for (const item of items) {
    if (!item.Date) continue;
    const dateStr = item.Date.replace(/-/g, "").slice(0, 8);
    const dateInt = parseInt(dateStr, 10);
    if (isNaN(dateInt)) continue;

    await db
      .insert(ohlcTable)
      .values({
        code,
        date: dateInt,
        open: item.OpenPrice ?? null,
        high: item.HighPrice ?? null,
        low: item.LowPrice ?? null,
        close: item.ClosePrice ?? null,
        volume: item.Volume ?? null,
        value: item.Value ?? null,
        bidVolume: item.BidVolume ?? null,
        offerVolume: item.OfferVolume ?? null,
        foreignBuy: item.ForeignBuy ?? null,
        foreignSell: item.ForeignSell ?? null,
      })
      .onConflictDoUpdate({
        target: [ohlcTable.code, ohlcTable.date],
        set: {
          open: item.OpenPrice ?? null,
          high: item.HighPrice ?? null,
          low: item.LowPrice ?? null,
          close: item.ClosePrice ?? null,
          volume: item.Volume ?? null,
          value: item.Value ?? null,
          bidVolume: item.BidVolume ?? null,
          offerVolume: item.OfferVolume ?? null,
          foreignBuy: item.ForeignBuy ?? null,
          foreignSell: item.ForeignSell ?? null,
          updatedAt: new Date(),
        },
      });
  }
}

export async function runFullSync(): Promise<void> {
  if (isSyncing) return;
  isSyncing = true;
  try {
    console.log("[sync] Starting screener sync...");
    const count = await syncScreener();
    console.log(`[sync] Synced ${count} stocks`);
    lastSyncTime = new Date();

    await db
      .insert(syncStateTable)
      .values({ id: "singleton", syncing: false, lastSync: lastSyncTime })
      .onConflictDoUpdate({
        target: syncStateTable.id,
        set: { syncing: false, lastSync: lastSyncTime },
      });
  } catch (err) {
    console.error("[sync] Error:", err);
  } finally {
    isSyncing = false;
  }
}

export async function loadSyncState(): Promise<void> {
  try {
    const rows = await db.select().from(syncStateTable).limit(1);
    if (rows[0]) {
      lastSyncTime = rows[0].lastSync ?? null;
    }
  } catch {
    // no state yet
  }
}
