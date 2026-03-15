import { Router, type IRouter } from "express";
import { db, screenerTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/sector/strength", async (req, res) => {
  try {
    const week = parseInt((req.query.week as string) || "26", 10) === 52 ? 52 : 26;
    const stocks = await db.select().from(screenerTable);

    const bySector = new Map<string, { sum: number; count: number }>();
    for (const s of stocks) {
      if (!s.sector) continue;
      const mom = week === 52 ? s.week52PC : s.week26PC;
      if (mom === null) continue;
      const entry = bySector.get(s.sector) ?? { sum: 0, count: 0 };
      entry.sum += mom;
      entry.count++;
      bySector.set(s.sector, entry);
    }

    const results = Array.from(bySector.entries())
      .filter(([, { count }]) => count > 0)
      .map(([sector, { sum, count }]) => ({
        sector,
        avgMomentum: Math.round((sum / count) * 100) / 100,
        count,
      }))
      .sort((a, b) => b.avgMomentum - a.avgMomentum)
      .map((item, index) => ({ ...item, rank: index + 1 }));

    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
