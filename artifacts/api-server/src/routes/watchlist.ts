import { Router, type IRouter } from "express";
import { db, watchlistTable, screenerTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { computeScores } from "../lib/scoring.js";

const router: IRouter = Router();

router.get("/watchlist", async (req, res) => {
  try {
    const watchlist = await db.select().from(watchlistTable);
    const codes = watchlist.map((w) => w.code);

    if (codes.length === 0) {
      return res.json([]);
    }

    const allStocks = await db.select().from(screenerTable);
    const scoresMap = computeScores(allStocks);

    const result = watchlist.map((w) => {
      const stock = allStocks.find((s) => s.code === w.code);
      const scores = scoresMap.get(w.code);
      return {
        code: w.code,
        name: stock?.name ?? null,
        sector: stock?.sector ?? null,
        per: stock?.per ?? null,
        roe: stock?.roe ?? null,
        der: stock?.der ?? null,
        week26PC: stock?.week26PC ?? null,
        compositeScore: scores?.compositeScore ?? null,
        addedAt: w.addedAt.toISOString(),
      };
    });

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/watchlist/:code", async (req, res) => {
  try {
    const code = req.params.code?.toUpperCase();
    const [row] = await db
      .insert(watchlistTable)
      .values({ code })
      .onConflictDoNothing()
      .returning();

    const stocks = await db.select().from(screenerTable).where(eq(screenerTable.code, code)).limit(1);
    const stock = stocks[0] ?? null;

    res.json({
      code,
      name: stock?.name ?? null,
      sector: stock?.sector ?? null,
      per: stock?.per ?? null,
      roe: stock?.roe ?? null,
      der: stock?.der ?? null,
      week26PC: stock?.week26PC ?? null,
      compositeScore: null,
      addedAt: row?.addedAt.toISOString() ?? new Date().toISOString(),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/watchlist/:code", async (req, res) => {
  try {
    const code = req.params.code?.toUpperCase();
    await db.delete(watchlistTable).where(eq(watchlistTable.code, code));
    res.json({ success: true, message: `${code} removed from watchlist` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
