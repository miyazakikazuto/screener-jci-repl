import { Router, type IRouter } from "express";
import { db, screenerTable, ohlcTable } from "@workspace/db";
import { eq, gte, lte, and, asc } from "drizzle-orm";
import { computeScores } from "../lib/scoring.js";
import { syncStockOhlc } from "../lib/idxSync.js";

const router: IRouter = Router();

function parseDateInt(str: string): number | null {
  const d = parseInt(str.replace(/-/g, ""), 10);
  return isNaN(d) ? null : d;
}

function dateIntToStr(dateInt: number): string {
  const s = String(dateInt);
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
}

router.get("/stock/:code/detail", async (req, res) => {
  try {
    const code = req.params.code?.toUpperCase();
    const startStr = req.query.start as string;
    const endStr = req.query.end as string;

    if (!startStr || !endStr) {
      return res.status(400).json({ error: "start and end are required" });
    }

    const startInt = parseDateInt(startStr);
    const endInt = parseDateInt(endStr);
    if (!startInt || !endInt) {
      return res.status(400).json({ error: "Invalid date format" });
    }

    const rows = await db.select().from(screenerTable).where(eq(screenerTable.code, code)).limit(1);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Stock not found" });
    }
    const stock = rows[0]!;

    let ohlcRows = await db
      .select()
      .from(ohlcTable)
      .where(and(eq(ohlcTable.code, code), gte(ohlcTable.date, startInt), lte(ohlcTable.date, endInt)))
      .orderBy(asc(ohlcTable.date));

    if (ohlcRows.length === 0) {
      try {
        await syncStockOhlc(code, startInt, endInt);
        ohlcRows = await db
          .select()
          .from(ohlcTable)
          .where(and(eq(ohlcTable.code, code), gte(ohlcTable.date, startInt), lte(ohlcTable.date, endInt)))
          .orderBy(asc(ohlcTable.date));
      } catch {
      }
    }

    const allStocks = await db.select().from(screenerTable);
    const scoresMap = computeScores(allStocks);
    const scores = scoresMap.get(code);

    res.json({
      code: stock.code,
      name: stock.name,
      sector: stock.sector,
      industry: stock.industry,
      subSector: stock.subSector,
      marketCapital: stock.marketCapital,
      per: stock.per,
      pbv: stock.pbv,
      roe: stock.roe,
      roa: stock.roa,
      der: stock.der,
      npm: stock.npm,
      week4PC: stock.week4PC,
      week13PC: stock.week13PC,
      week26PC: stock.week26PC,
      week52PC: stock.week52PC,
      ytdpc: stock.ytdpc,
      valueScore: scores?.valueScore ?? null,
      qualityScore: scores?.qualityScore ?? null,
      momentumScore: scores?.momentumScore ?? null,
      compositeScore: scores?.compositeScore ?? null,
      hasNotation: !!stock.notation,
      hasCorpAction: !!stock.corpAction,
      hasUma: !!stock.umaDate,
      ohlc: ohlcRows.map((r) => ({
        date: dateIntToStr(r.date),
        open: r.open,
        high: r.high,
        low: r.low,
        close: r.close,
        volume: r.volume,
        value: r.value,
        bidVolume: r.bidVolume,
        offerVolume: r.offerVolume,
        foreignBuy: r.foreignBuy,
        foreignSell: r.foreignSell,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:code/bid-offer", async (req, res) => {
  try {
    const code = req.params.code?.toUpperCase();
    const startStr = req.query.start as string;
    const endStr = req.query.end as string;

    if (!startStr || !endStr) {
      return res.status(400).json({ error: "start and end are required" });
    }

    const startInt = parseDateInt(startStr);
    const endInt = parseDateInt(endStr);
    if (!startInt || !endInt) {
      return res.status(400).json({ error: "Invalid date format" });
    }

    const rows = await db
      .select({ date: ohlcTable.date, bidVolume: ohlcTable.bidVolume, offerVolume: ohlcTable.offerVolume })
      .from(ohlcTable)
      .where(and(eq(ohlcTable.code, code), gte(ohlcTable.date, startInt), lte(ohlcTable.date, endInt)))
      .orderBy(asc(ohlcTable.date));

    res.json(rows.map((r) => ({ date: dateIntToStr(r.date), bidVolume: r.bidVolume, offerVolume: r.offerVolume })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:code/foreign", async (req, res) => {
  try {
    const code = req.params.code?.toUpperCase();
    const startStr = req.query.start as string;
    const endStr = req.query.end as string;

    if (!startStr || !endStr) {
      return res.status(400).json({ error: "start and end are required" });
    }

    const startInt = parseDateInt(startStr);
    const endInt = parseDateInt(endStr);
    if (!startInt || !endInt) {
      return res.status(400).json({ error: "Invalid date format" });
    }

    const rows = await db
      .select({
        date: ohlcTable.date,
        foreignBuy: ohlcTable.foreignBuy,
        foreignSell: ohlcTable.foreignSell,
      })
      .from(ohlcTable)
      .where(and(eq(ohlcTable.code, code), gte(ohlcTable.date, startInt), lte(ohlcTable.date, endInt)))
      .orderBy(asc(ohlcTable.date));

    let totalBuy = 0;
    let totalSell = 0;
    const data = rows.map((r) => {
      const buy = r.foreignBuy ?? 0;
      const sell = r.foreignSell ?? 0;
      totalBuy += buy;
      totalSell += sell;
      return {
        date: dateIntToStr(r.date),
        buy: r.foreignBuy,
        sell: r.foreignSell,
        net: buy - sell,
      };
    });

    res.json({
      code,
      start: startStr,
      end: endStr,
      data,
      summary: {
        totalBuy,
        totalSell,
        totalNet: totalBuy - totalSell,
        dayCount: data.length,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
