import { Router, type IRouter } from "express";
import { db, screenerTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/sector/strength", async (req, res) => {
  try {
    const week = parseInt((req.query.week as string) || "26", 10) === 52 ? 52 : 26;
    const stocks = await db.select().from(screenerTable);

    const bySector = new Map<string, {
      momSum: number; momCount: number;
      w4Sum: number; w4Count: number;
      w13Sum: number; w13Count: number;
      w52Sum: number; w52Count: number;
      perSum: number; perCount: number;
      pbvSum: number; pbvCount: number;
      roeSum: number; roeCount: number;
      roaSum: number; roaCount: number;
      npmSum: number; npmCount: number;
      derSum: number; derCount: number;
      mcapSum: number;
      totalStocks: number;
      positiveMom: number;
      negativeMom: number;
    }>();

    for (const s of stocks) {
      if (!s.sector) continue;
      if (!bySector.has(s.sector)) {
        bySector.set(s.sector, {
          momSum: 0, momCount: 0,
          w4Sum: 0, w4Count: 0,
          w13Sum: 0, w13Count: 0,
          w52Sum: 0, w52Count: 0,
          perSum: 0, perCount: 0,
          pbvSum: 0, pbvCount: 0,
          roeSum: 0, roeCount: 0,
          roaSum: 0, roaCount: 0,
          npmSum: 0, npmCount: 0,
          derSum: 0, derCount: 0,
          mcapSum: 0,
          totalStocks: 0,
          positiveMom: 0,
          negativeMom: 0,
        });
      }
      const e = bySector.get(s.sector)!;
      e.totalStocks++;

      const mom26 = s.week26PC;
      if (mom26 !== null) {
        e.momSum += mom26; e.momCount++;
        if (mom26 >= 0) e.positiveMom++; else e.negativeMom++;
      }
      if (s.week4PC !== null) { e.w4Sum += s.week4PC; e.w4Count++; }
      if (s.week13PC !== null) { e.w13Sum += s.week13PC; e.w13Count++; }
      if (s.week52PC !== null) { e.w52Sum += s.week52PC; e.w52Count++; }
      if (s.per !== null && s.per > 0) { e.perSum += s.per; e.perCount++; }
      if (s.pbv !== null && s.pbv > 0) { e.pbvSum += s.pbv; e.pbvCount++; }
      if (s.roe !== null) { e.roeSum += s.roe; e.roeCount++; }
      if (s.roa !== null) { e.roaSum += s.roa; e.roaCount++; }
      if (s.npm !== null) { e.npmSum += s.npm; e.npmCount++; }
      if (s.der !== null && s.der >= 0) { e.derSum += s.der; e.derCount++; }
      if (s.marketCapital !== null) e.mcapSum += s.marketCapital;
    }

    const round = (v: number, d = 2) => Math.round(v * Math.pow(10, d)) / Math.pow(10, d);

    const results = Array.from(bySector.entries())
      .filter(([, e]) => e.totalStocks > 0)
      .map(([sector, e]) => ({
        sector,
        count: e.totalStocks,
        avgMomentum: e.momCount > 0 ? round(e.momSum / e.momCount) : null,
        avg4w: e.w4Count > 0 ? round(e.w4Sum / e.w4Count) : null,
        avg13w: e.w13Count > 0 ? round(e.w13Sum / e.w13Count) : null,
        avg52w: e.w52Count > 0 ? round(e.w52Sum / e.w52Count) : null,
        avgPer: e.perCount > 0 ? round(e.perSum / e.perCount, 1) : null,
        avgPbv: e.pbvCount > 0 ? round(e.pbvSum / e.pbvCount, 2) : null,
        avgRoe: e.roeCount > 0 ? round(e.roeSum / e.roeCount, 1) : null,
        avgRoa: e.roaCount > 0 ? round(e.roaSum / e.roaCount, 1) : null,
        avgNpm: e.npmCount > 0 ? round(e.npmSum / e.npmCount, 1) : null,
        avgDer: e.derCount > 0 ? round(e.derSum / e.derCount, 2) : null,
        totalMcap: e.mcapSum,
        positiveMom: e.positiveMom,
        negativeMom: e.negativeMom,
        breadth: e.momCount > 0 ? round((e.positiveMom / e.momCount) * 100, 1) : null,
      }))
      .sort((a, b) => (b.avgMomentum ?? -Infinity) - (a.avgMomentum ?? -Infinity))
      .map((item, index) => ({ ...item, rank: index + 1 }));

    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
