import { Router, type IRouter } from "express";
import { db, screenerTable } from "@workspace/db";
import { runFullSync, isSyncing, lastSyncTime, loadSyncState } from "../lib/idxSync.js";
import { asc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/general", async (req, res) => {
  try {
    const stocks = await db
      .select({ code: screenerTable.code, name: screenerTable.name, sector: screenerTable.sector, industry: screenerTable.industry, subSector: screenerTable.subSector })
      .from(screenerTable)
      .orderBy(asc(screenerTable.code));

    const sectors = [...new Set(stocks.map((s) => s.sector).filter(Boolean))].sort() as string[];
    const industries = [...new Set(stocks.map((s) => s.industry).filter(Boolean))].sort() as string[];
    const subSectors = [...new Set(stocks.map((s) => s.subSector).filter(Boolean))].sort() as string[];

    res.json({
      stockList: stocks.map((s) => ({ code: s.code, name: s.name })),
      sectors,
      industries,
      subSectors,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/sync", async (req, res) => {
  try {
    if (isSyncing) {
      return res.json({ success: false, message: "Sync already in progress" });
    }
    runFullSync().catch(console.error);
    res.json({ success: true, message: "Sync started" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/sync/status", async (req, res) => {
  try {
    const stocks = await db.select({ code: screenerTable.code }).from(screenerTable);
    // Next auto-sync: 16:00 WIB (09:00 UTC) on next weekday
    const now = new Date();
    const nextSync = new Date();
    nextSync.setUTCHours(9, 0, 0, 0);
    if (now >= nextSync || now.getUTCDay() === 0 || now.getUTCDay() === 6) {
      nextSync.setUTCDate(nextSync.getUTCDate() + 1);
      while (nextSync.getUTCDay() === 0 || nextSync.getUTCDay() === 6) {
        nextSync.setUTCDate(nextSync.getUTCDate() + 1);
      }
    }
    res.json({
      syncing: isSyncing,
      lastSync: lastSyncTime?.toISOString() ?? null,
      nextSync: nextSync.toISOString(),
      stockCount: stocks.length,
      source: "Yahoo Finance (.JK)",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
