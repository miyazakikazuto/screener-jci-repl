import type { Screener } from "@workspace/db";

function percentRank(values: number[], target: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  const below = sorted.filter((v) => v < target).length;
  return (below / (sorted.length - 1 || 1)) * 100;
}

function percentRankDesc(values: number[], target: number): number {
  return 100 - percentRank(values, target);
}

export interface ScoredStock {
  code: string;
  valueScore: number | null;
  qualityScore: number | null;
  momentumScore: number | null;
  compositeScore: number | null;
}

export function computeScores(
  stocks: Screener[],
  opts: { vw?: number; qw?: number; mw?: number; momentumWeek?: number } = {}
): Map<string, ScoredStock> {
  const { vw = 1, qw = 1, mw = 1, momentumWeek = 26 } = opts;
  const totalWeight = vw + qw + mw || 3;

  const perVals = stocks.map((s) => s.per).filter((v): v is number => v !== null && isFinite(v));
  const pbvVals = stocks.map((s) => s.pbv).filter((v): v is number => v !== null && isFinite(v));
  const roeVals = stocks.map((s) => s.roe).filter((v): v is number => v !== null && isFinite(v));
  const roaVals = stocks.map((s) => s.roa).filter((v): v is number => v !== null && isFinite(v));
  const npmVals = stocks.map((s) => s.npm).filter((v): v is number => v !== null && isFinite(v));
  const derVals = stocks.map((s) => s.der).filter((v): v is number => v !== null && isFinite(v));
  const momVals = stocks
    .map((s) => (momentumWeek === 52 ? s.week52PC : s.week26PC))
    .filter((v): v is number => v !== null && isFinite(v));

  const result = new Map<string, ScoredStock>();

  for (const stock of stocks) {
    const valueParts: number[] = [];
    if (stock.per !== null && isFinite(stock.per) && perVals.length > 1)
      valueParts.push(percentRankDesc(perVals, stock.per));
    if (stock.pbv !== null && isFinite(stock.pbv) && pbvVals.length > 1)
      valueParts.push(percentRankDesc(pbvVals, stock.pbv));
    const valueScore = valueParts.length > 0 ? valueParts.reduce((a, b) => a + b, 0) / valueParts.length : null;

    const qualityParts: number[] = [];
    if (stock.roe !== null && isFinite(stock.roe) && roeVals.length > 1)
      qualityParts.push(percentRank(roeVals, stock.roe));
    if (stock.roa !== null && isFinite(stock.roa) && roaVals.length > 1)
      qualityParts.push(percentRank(roaVals, stock.roa));
    if (stock.npm !== null && isFinite(stock.npm) && npmVals.length > 1)
      qualityParts.push(percentRank(npmVals, stock.npm));
    if (stock.der !== null && isFinite(stock.der) && derVals.length > 1)
      qualityParts.push(percentRankDesc(derVals, stock.der));
    const qualityScore = qualityParts.length > 0 ? qualityParts.reduce((a, b) => a + b, 0) / qualityParts.length : null;

    const mom = momentumWeek === 52 ? stock.week52PC : stock.week26PC;
    const momentumScore = mom !== null && isFinite(mom) && momVals.length > 1
      ? percentRank(momVals, mom)
      : null;

    let compositeScore: number | null = null;
    if (valueScore !== null || qualityScore !== null || momentumScore !== null) {
      let weighted = 0;
      let usedWeight = 0;
      if (valueScore !== null) { weighted += valueScore * vw; usedWeight += vw; }
      if (qualityScore !== null) { weighted += qualityScore * qw; usedWeight += qw; }
      if (momentumScore !== null) { weighted += momentumScore * mw; usedWeight += mw; }
      compositeScore = usedWeight > 0 ? (weighted / usedWeight) : null;
    }

    result.set(stock.code, {
      code: stock.code,
      valueScore: valueScore !== null ? Math.round(valueScore * 10) / 10 : null,
      qualityScore: qualityScore !== null ? Math.round(qualityScore * 10) / 10 : null,
      momentumScore: momentumScore !== null ? Math.round(momentumScore * 10) / 10 : null,
      compositeScore: compositeScore !== null ? Math.round(compositeScore * 10) / 10 : null,
    });
  }

  return result;
}
