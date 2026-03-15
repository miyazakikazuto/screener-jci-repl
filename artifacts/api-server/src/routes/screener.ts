import { Router, type IRouter } from "express";
import { db, screenerTable } from "@workspace/db";
import { and, gte, lte, like, eq, or, ilike, sql, asc, desc } from "drizzle-orm";
import { computeScores } from "../lib/scoring.js";
import { computeRsi } from "../lib/rsi.js";
import { ohlcTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/candidates", async (req, res) => {
  try {
    const {
      defaultFilter,
      derMax,
      excludeCorpAction,
      excludeNotation,
      excludeUma,
      limit: limitStr = "50",
      offset: offsetStr = "0",
      momentumMin,
      momentumWeek = "26",
      perMax,
      perMin,
      roeMin,
      search,
      sector,
      vw = "1",
      qw = "1",
      mw = "1",
      withSectorRank,
      sortBy,
      sortDir = "desc",
    } = req.query as Record<string, string | undefined>;

    const limit = Math.min(parseInt(limitStr, 10) || 50, 200);
    const offset = parseInt(offsetStr, 10) || 0;
    const week = parseInt(momentumWeek, 10) === 52 ? 52 : 26;

    let allStocks = await db.select().from(screenerTable);

    if (defaultFilter === "true") {
      allStocks = allStocks.filter(
        (s) =>
          !s.notation &&
          !s.corpAction &&
          !s.umaDate &&
          (s.per === null || s.per <= 25) &&
          (s.roe === null || s.roe >= 0) &&
          (s.der === null || s.der <= 2) &&
          (week === 52 ? (s.week52PC ?? 0) >= 0 : (s.week26PC ?? 0) >= 0)
      );
    } else {
      if (excludeNotation === "true") allStocks = allStocks.filter((s) => !s.notation);
      if (excludeCorpAction === "true") allStocks = allStocks.filter((s) => !s.corpAction);
      if (excludeUma === "true") allStocks = allStocks.filter((s) => !s.umaDate);
      if (derMax !== undefined) allStocks = allStocks.filter((s) => s.der === null || s.der <= parseFloat(derMax));
      if (perMax !== undefined) allStocks = allStocks.filter((s) => s.per === null || s.per <= parseFloat(perMax));
      if (perMin !== undefined) allStocks = allStocks.filter((s) => s.per === null || s.per >= parseFloat(perMin));
      if (roeMin !== undefined) allStocks = allStocks.filter((s) => s.roe === null || s.roe >= parseFloat(roeMin));
      if (momentumMin !== undefined) {
        const minMom = parseFloat(momentumMin);
        allStocks = allStocks.filter((s) => {
          const mom = week === 52 ? s.week52PC : s.week26PC;
          return mom === null || mom >= minMom;
        });
      }
    }

    if (sector) allStocks = allStocks.filter((s) => s.sector === sector);
    if (search) {
      const q = search.toLowerCase();
      allStocks = allStocks.filter(
        (s) =>
          s.code.toLowerCase().includes(q) ||
          (s.name?.toLowerCase().includes(q) ?? false) ||
          (s.sector?.toLowerCase().includes(q) ?? false)
      );
    }

    const scoresMap = computeScores(allStocks, {
      vw: parseFloat(vw || "1"),
      qw: parseFloat(qw || "1"),
      mw: parseFloat(mw || "1"),
      momentumWeek: week,
    });

    let scored = allStocks.map((s) => {
      const scores = scoresMap.get(s.code);
      return {
        ...s,
        valueScore: scores?.valueScore ?? null,
        qualityScore: scores?.qualityScore ?? null,
        momentumScore: scores?.momentumScore ?? null,
        compositeScore: scores?.compositeScore ?? null,
        hasNotation: !!s.notation,
        hasCorpAction: !!s.corpAction,
        hasUma: !!s.umaDate,
        sectorRank: null as number | null,
        sectorPercentile: null as number | null,
      };
    });

    if (withSectorRank === "true") {
      const bySector = new Map<string, typeof scored>();
      for (const s of scored) {
        const sec = s.sector ?? "Unknown";
        if (!bySector.has(sec)) bySector.set(sec, []);
        bySector.get(sec)!.push(s);
      }
      for (const [, group] of bySector) {
        const sorted = [...group].sort((a, b) => (b.compositeScore ?? 0) - (a.compositeScore ?? 0));
        sorted.forEach((s, i) => {
          const found = scored.find((x) => x.code === s.code);
          if (found) {
            found.sectorRank = i + 1;
            found.sectorPercentile = Math.round(((group.length - i) / group.length) * 100);
          }
        });
      }
    }

    const sortField = sortBy || "compositeScore";
    scored.sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[sortField] as number | null ?? -Infinity;
      const bVal = (b as Record<string, unknown>)[sortField] as number | null ?? -Infinity;
      return sortDir === "asc" ? (aVal < bVal ? -1 : 1) : (bVal < aVal ? -1 : 1);
    });

    const totalCount = scored.length;
    const data = scored.slice(offset, offset + limit);

    res.json({ totalCount, limit, offset, data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/screener/rsi", async (req, res) => {
  try {
    const period = parseInt((req.query.period as string) || "14", 10);
    const stocks = await db.select().from(screenerTable);
    const bySector = new Map<string, string[]>();
    for (const s of stocks) {
      if (!s.sector) continue;
      if (!bySector.has(s.sector)) bySector.set(s.sector, []);
      bySector.get(s.sector)!.push(s.code);
    }

    const results = [];
    for (const [sector, codes] of bySector) {
      const rsiValues: number[] = [];
      for (const code of codes.slice(0, 30)) {
        const rows = await db
          .select({ close: ohlcTable.close })
          .from(ohlcTable)
          .where(eq(ohlcTable.code, code))
          .orderBy(asc(ohlcTable.date))
          .limit(period + 30);
        const closes = rows.map((r) => r.close).filter((v): v is number => v !== null);
        const rsi = computeRsi(closes, period);
        if (rsi !== null) rsiValues.push(rsi);
      }
      const avgRsi = rsiValues.length > 0 ? rsiValues.reduce((a, b) => a + b, 0) / rsiValues.length : null;
      results.push({
        sector,
        rsi: avgRsi !== null ? Math.round(avgRsi * 10) / 10 : null,
        stockCount: codes.length,
        overbought: rsiValues.filter((v) => v >= 70).length,
        oversold: rsiValues.filter((v) => v <= 30).length,
        neutral: rsiValues.filter((v) => v > 30 && v < 70).length,
      });
    }

    results.sort((a, b) => (b.rsi ?? 0) - (a.rsi ?? 0));
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
