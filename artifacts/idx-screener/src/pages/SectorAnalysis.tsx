import { useState } from "react";
import { useGetScreenerRsi, useGetSectorStrength } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Legend, ComposedChart, Line, Area
} from "recharts";
import { formatNum, formatPct } from "@/lib/format";
import { BarChart2, TrendingUp, TrendingDown, Activity, DollarSign, Layers, Percent } from "lucide-react";
import { cn } from "@/lib/utils";

const SECTOR_COLORS: Record<string, string> = {
  "Financials": "#3b82f6",
  "Consumer Non-Cyclicals": "#10b981",
  "Basic Materials": "#f59e0b",
  "Energy": "#ef4444",
  "Properties & Real Estate": "#8b5cf6",
  "Healthcare": "#06b6d4",
  "Consumer Cyclicals": "#f97316",
  "Industrials": "#6b7280",
  "Telecommunications": "#ec4899",
  "Technology": "#84cc16",
};

function getSectorColor(sector: string) {
  return SECTOR_COLORS[sector] ?? "#6b7280";
}

function getMomentumColor(val: number | null) {
  if (val === null) return "text-muted-foreground";
  return val > 10 ? "text-green-400" : val > 0 ? "text-green-600" : val > -10 ? "text-red-400" : "text-red-600";
}

function getMomBg(val: number | null) {
  if (val === null) return "bg-muted/30";
  if (val > 20) return "bg-green-500/20";
  if (val > 10) return "bg-green-500/10";
  if (val > 0) return "bg-green-500/5";
  if (val > -10) return "bg-red-500/5";
  if (val > -20) return "bg-red-500/10";
  return "bg-red-500/20";
}

const formatMcap = (v: number) => {
  if (v >= 1e15) return `${(v / 1e15).toFixed(1)}Q`;
  if (v >= 1e12) return `${(v / 1e12).toFixed(1)}T`;
  if (v >= 1e9) return `${(v / 1e9).toFixed(0)}B`;
  return `${(v / 1e6).toFixed(0)}M`;
};

const TooltipStyle = {
  contentStyle: { backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px", fontSize: "12px" },
  cursor: { fill: "hsl(var(--muted)/0.3)" },
};

export default function SectorAnalysis() {
  const [activeSector, setActiveSector] = useState<string | null>(null);
  const { data: rsiData, isLoading: rsiLoading } = useGetScreenerRsi({ query: { keepPreviousData: true } });
  const { data: rawStrength, isLoading: strengthLoading } = useGetSectorStrength({ week: 26 }, { query: { keepPreviousData: true } });

  const strengthData = (rawStrength as any[]) ?? [];

  const sortedByMom = [...strengthData].sort((a, b) => (b.avgMomentum ?? -Infinity) - (a.avgMomentum ?? -Infinity));
  const sortedRsi = rsiData ? [...rsiData].sort((a, b) => (b.rsi ?? 0) - (a.rsi ?? 0)) : [];

  const bestSector = sortedByMom[0];
  const worstSector = sortedByMom[sortedByMom.length - 1];
  const totalStocks = strengthData.reduce((s, d) => s + (d.count ?? 0), 0);
  const totalMcap = strengthData.reduce((s, d) => s + (d.totalMcap ?? 0), 0);
  const marketBreadth = strengthData.reduce((s, d) => s + (d.positiveMom ?? 0), 0);
  const breadthPct = totalStocks > 0 ? Math.round((marketBreadth / totalStocks) * 100) : 0;

  const multiTimeframeData = strengthData.map(d => ({
    sector: d.sector?.split(" ")[0] ?? d.sector,
    fullSector: d.sector,
    "4W": d.avg4w,
    "13W": d.avg13w,
    "26W": d.avgMomentum,
    "52W": d.avg52w,
  }));

  const fundamentalsData = [...strengthData].sort((a, b) => (b.avgRoe ?? -Infinity) - (a.avgRoe ?? -Infinity));

  const radarData = fundamentalsData.map(d => ({
    sector: d.sector?.split(" ")[0] ?? d.sector,
    ROE: Math.min(Math.max(d.avgRoe ?? 0, 0), 40),
    ROA: Math.min(Math.max(d.avgRoa ?? 0, 0), 25),
    NPM: Math.min(Math.max(d.avgNpm ?? 0, 0), 35),
  }));

  const mcapData = [...strengthData]
    .sort((a, b) => (b.totalMcap ?? 0) - (a.totalMcap ?? 0))
    .map(d => ({ ...d, mcapLabel: formatMcap(d.totalMcap ?? 0) }));

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold text-white flex items-center gap-3">
          <BarChart2 className="w-8 h-8 text-primary" />
          Sector Analysis
        </h1>
        <p className="text-muted-foreground mt-2">Macro overview of momentum, fundamentals, and breadth across {strengthData.length} IDX sectors.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card/40 backdrop-blur-xl border-white/5 shadow-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-mono uppercase tracking-wider mb-3">
              <TrendingUp className="w-3.5 h-3.5 text-green-400" />Best Sector (26W)
            </div>
            <div className="text-lg font-bold text-white truncate">{bestSector?.sector ?? "—"}</div>
            <div className="text-2xl font-mono font-bold text-green-400 mt-1">
              {bestSector?.avgMomentum != null ? `+${formatNum(bestSector.avgMomentum)}%` : "—"}
            </div>
            <div className="text-xs text-muted-foreground mt-1">{bestSector?.count ?? 0} stocks</div>
          </CardContent>
        </Card>
        <Card className="bg-card/40 backdrop-blur-xl border-white/5 shadow-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-mono uppercase tracking-wider mb-3">
              <TrendingDown className="w-3.5 h-3.5 text-red-400" />Worst Sector (26W)
            </div>
            <div className="text-lg font-bold text-white truncate">{worstSector?.sector ?? "—"}</div>
            <div className="text-2xl font-mono font-bold text-red-400 mt-1">
              {worstSector?.avgMomentum != null ? `${formatNum(worstSector.avgMomentum)}%` : "—"}
            </div>
            <div className="text-xs text-muted-foreground mt-1">{worstSector?.count ?? 0} stocks</div>
          </CardContent>
        </Card>
        <Card className="bg-card/40 backdrop-blur-xl border-white/5 shadow-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-mono uppercase tracking-wider mb-3">
              <Percent className="w-3.5 h-3.5 text-primary" />Market Breadth
            </div>
            <div className="text-2xl font-mono font-bold text-white">{breadthPct}%</div>
            <div className="text-xs text-muted-foreground mt-1">{marketBreadth} of {totalStocks} stocks positive</div>
            <div className="mt-3 h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div className={cn("h-full rounded-full transition-all", breadthPct >= 50 ? "bg-green-500" : "bg-red-500")} style={{ width: `${breadthPct}%` }} />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/40 backdrop-blur-xl border-white/5 shadow-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-mono uppercase tracking-wider mb-3">
              <DollarSign className="w-3.5 h-3.5 text-yellow-400" />Total Market Cap
            </div>
            <div className="text-2xl font-mono font-bold text-white">{formatMcap(totalMcap)}</div>
            <div className="text-xs text-muted-foreground mt-1">{strengthData.length} sectors · {totalStocks} stocks</div>
          </CardContent>
        </Card>
      </div>

      {/* Sector Heatmap Cards */}
      <div>
        <h2 className="text-sm font-mono uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
          <Layers className="w-4 h-4" /> Sector Heatmap — 26W Momentum
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {sortedByMom.map(d => (
            <button
              key={d.sector}
              onClick={() => setActiveSector(activeSector === d.sector ? null : d.sector)}
              className={cn(
                "rounded-xl p-4 border text-left transition-all duration-200 cursor-pointer",
                getMomBg(d.avgMomentum),
                activeSector === d.sector ? "border-primary/50 ring-1 ring-primary/30" : "border-white/5 hover:border-white/15",
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-muted-foreground">#{d.rank}</span>
                <span className="text-[10px] font-mono text-muted-foreground">{d.count}s</span>
              </div>
              <div
                className="text-[11px] font-semibold text-white leading-tight mb-2"
                style={{ color: getSectorColor(d.sector) }}
              >
                {d.sector}
              </div>
              <div className={cn("text-xl font-mono font-bold", getMomentumColor(d.avgMomentum))}>
                {d.avgMomentum != null ? (d.avgMomentum >= 0 ? "+" : "") + formatNum(d.avgMomentum) + "%" : "—"}
              </div>
              <div className="mt-2 flex gap-1 text-[10px] text-muted-foreground">
                <span>B:{d.breadth?.toFixed(0) ?? "—"}%</span>
                <span className="text-white/10">|</span>
                <span>{d.avgRoe != null ? `ROE ${d.avgRoe.toFixed(0)}%` : "—"}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Multi-timeframe Momentum */}
        <Card className="bg-card/40 backdrop-blur-xl border-white/5 shadow-2xl">
          <CardHeader className="border-b border-white/5 bg-black/20">
            <CardTitle className="font-display flex items-center gap-2">
              Multi-Timeframe Momentum
            </CardTitle>
            <CardDescription>Average price change % across 4W, 13W, 26W and 52W per sector.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 h-[420px]">
            {strengthLoading
              ? <div className="h-full flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
              : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={multiTimeframeData} layout="vertical" margin={{ top: 0, right: 10, left: 100, bottom: 0 }} barGap={2}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical={true} stroke="hsl(var(--border))" strokeOpacity={0.3} />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} fontSize={10} />
                    <YAxis dataKey="sector" type="category" stroke="hsl(var(--muted-foreground))" fontSize={10} width={100} tickLine={false} axisLine={false} />
                    <Tooltip
                      {...TooltipStyle}
                      formatter={(val: number, name: string) => [`${val != null ? (val >= 0 ? "+" : "") + formatNum(val) : "—"}%`, name]}
                      labelFormatter={(label) => multiTimeframeData.find(d => d.sector === label)?.fullSector ?? label}
                    />
                    <ReferenceLine x={0} stroke="hsl(var(--border))" strokeWidth={1.5} />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                    <Bar dataKey="4W" name="4 Week" fill="#3b82f6" radius={[0, 2, 2, 0]} barSize={5} />
                    <Bar dataKey="13W" name="13 Week" fill="#8b5cf6" radius={[0, 2, 2, 0]} barSize={5} />
                    <Bar dataKey="26W" name="26 Week" fill="#10b981" radius={[0, 2, 2, 0]} barSize={5} />
                    <Bar dataKey="52W" name="52 Week" fill="#f59e0b" radius={[0, 2, 2, 0]} barSize={5} />
                  </BarChart>
                </ResponsiveContainer>
              )}
          </CardContent>
        </Card>

        {/* Sector RSI */}
        <Card className="bg-card/40 backdrop-blur-xl border-white/5 shadow-2xl">
          <CardHeader className="border-b border-white/5 bg-black/20">
            <CardTitle className="font-display flex items-center gap-2">
              Sector RSI
              <span className="text-xs font-mono px-2 py-0.5 bg-primary/20 text-primary rounded-md border border-primary/20">14-Day</span>
            </CardTitle>
            <CardDescription>Average RSI per sector. Below 30 = oversold, above 70 = overbought.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 h-[420px] relative">
            {rsiLoading && <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sortedRsi} layout="vertical" margin={{ top: 0, right: 20, left: 100, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical={true} stroke="hsl(var(--border))" strokeOpacity={0.3} />
                <XAxis type="number" domain={[0, 100]} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} fontSize={10} />
                <YAxis dataKey="sector" type="category" stroke="hsl(var(--muted-foreground))" fontSize={10} width={100} tickLine={false} axisLine={false} />
                <Tooltip
                  {...TooltipStyle}
                  formatter={(val: number) => [formatNum(val), "RSI"]}
                />
                <ReferenceLine x={30} stroke="hsl(var(--primary))" strokeDasharray="4 4" label={{ position: "insideTopRight", value: "30", fill: "hsl(var(--primary))", fontSize: 9 }} />
                <ReferenceLine x={70} stroke="hsl(var(--destructive))" strokeDasharray="4 4" label={{ position: "insideTopRight", value: "70", fill: "hsl(var(--destructive))", fontSize: 9 }} />
                <Bar dataKey="rsi" radius={[0, 4, 4, 0]} barSize={18}>
                  {sortedRsi.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={(entry.rsi ?? 0) > 70 ? "hsl(var(--destructive))" : (entry.rsi ?? 0) < 30 ? "hsl(var(--primary))" : getSectorColor(entry.sector ?? "")}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Market Cap by Sector */}
        <Card className="bg-card/40 backdrop-blur-xl border-white/5 shadow-2xl">
          <CardHeader className="border-b border-white/5 bg-black/20">
            <CardTitle className="font-display flex items-center gap-2">
              Market Cap Distribution
            </CardTitle>
            <CardDescription>Total market capitalization (IDR) per sector.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 h-[380px]">
            {strengthLoading
              ? <div className="h-full flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
              : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mcapData} layout="vertical" margin={{ top: 0, right: 60, left: 100, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical={true} stroke="hsl(var(--border))" strokeOpacity={0.3} />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} tickFormatter={v => formatMcap(v)} fontSize={10} />
                    <YAxis dataKey="sector" type="category" stroke="hsl(var(--muted-foreground))" fontSize={10} width={100} tickLine={false} axisLine={false} />
                    <Tooltip
                      {...TooltipStyle}
                      formatter={(val: number) => [formatMcap(val), "Market Cap"]}
                    />
                    <Bar dataKey="totalMcap" radius={[0, 4, 4, 0]} barSize={20} label={{ position: "right", formatter: (v: number) => formatMcap(v), fill: "hsl(var(--muted-foreground))", fontSize: 10 }}>
                      {mcapData.map((d, i) => (
                        <Cell key={i} fill={getSectorColor(d.sector)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
          </CardContent>
        </Card>

        {/* Breadth per Sector */}
        <Card className="bg-card/40 backdrop-blur-xl border-white/5 shadow-2xl">
          <CardHeader className="border-b border-white/5 bg-black/20">
            <CardTitle className="font-display flex items-center gap-2">
              Sector Breadth
              <span className="text-xs font-mono px-2 py-0.5 bg-green-500/20 text-green-400 rounded-md border border-green-500/20">% Stocks Up 26W</span>
            </CardTitle>
            <CardDescription>Percentage of stocks with positive 26-week momentum per sector.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 h-[380px]">
            {strengthLoading
              ? <div className="h-full flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
              : (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={[...strengthData].sort((a, b) => (b.breadth ?? 0) - (a.breadth ?? 0))} layout="vertical" margin={{ top: 0, right: 50, left: 100, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical={true} stroke="hsl(var(--border))" strokeOpacity={0.3} />
                    <XAxis type="number" domain={[0, 100]} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} fontSize={10} />
                    <YAxis dataKey="sector" type="category" stroke="hsl(var(--muted-foreground))" fontSize={10} width={100} tickLine={false} axisLine={false} />
                    <Tooltip
                      {...TooltipStyle}
                      formatter={(val: number, name: string) => [name === "breadth" ? `${val}%` : val, name === "breadth" ? "% Up" : name]}
                    />
                    <ReferenceLine x={50} stroke="hsl(var(--border))" strokeDasharray="4 4" />
                    <Bar dataKey="breadth" radius={[0, 4, 4, 0]} barSize={18} label={{ position: "right", formatter: (v: number) => `${v}%`, fill: "hsl(var(--muted-foreground))", fontSize: 10 }}>
                      {[...strengthData].sort((a, b) => (b.breadth ?? 0) - (a.breadth ?? 0)).map((d, i) => (
                        <Cell key={i} fill={(d.breadth ?? 0) >= 50 ? "hsl(142, 71%, 45%)" : "hsl(0, 72%, 51%)"} />
                      ))}
                    </Bar>
                  </ComposedChart>
                </ResponsiveContainer>
              )}
          </CardContent>
        </Card>
      </div>

      {/* Fundamentals Table */}
      <Card className="bg-card/40 backdrop-blur-xl border-white/5 shadow-2xl">
        <CardHeader className="border-b border-white/5 bg-black/20">
          <CardTitle className="font-display flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Sector Fundamentals
          </CardTitle>
          <CardDescription>Average valuation & profitability metrics per sector (median of all stocks in sector).</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {strengthLoading
            ? <div className="h-32 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
            : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5 text-xs font-mono text-muted-foreground uppercase tracking-wider">
                      <th className="text-left p-4 pl-6">Sector</th>
                      <th className="text-center p-4">Stocks</th>
                      <th className="text-right p-4">PER</th>
                      <th className="text-right p-4">PBV</th>
                      <th className="text-right p-4">ROE</th>
                      <th className="text-right p-4">ROA</th>
                      <th className="text-right p-4">NPM</th>
                      <th className="text-right p-4">DER</th>
                      <th className="text-right p-4">4W</th>
                      <th className="text-right p-4">26W</th>
                      <th className="text-right p-4 pr-6">Breadth</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fundamentalsData.map((d, i) => (
                      <tr
                        key={d.sector}
                        className={cn(
                          "border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer",
                          i % 2 === 0 ? "" : "bg-black/10",
                          activeSector === d.sector ? "bg-primary/5 border-l-2 border-l-primary" : "",
                        )}
                        onClick={() => setActiveSector(activeSector === d.sector ? null : d.sector)}
                      >
                        <td className="p-4 pl-6">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: getSectorColor(d.sector) }} />
                            <span className="font-medium text-foreground text-sm">{d.sector}</span>
                          </div>
                        </td>
                        <td className="text-center p-4 font-mono text-muted-foreground">{d.count}</td>
                        <td className="text-right p-4 font-mono">{d.avgPer != null ? formatNum(d.avgPer) : <span className="text-muted-foreground/40">—</span>}</td>
                        <td className="text-right p-4 font-mono">{d.avgPbv != null ? formatNum(d.avgPbv) : <span className="text-muted-foreground/40">—</span>}</td>
                        <td className={cn("text-right p-4 font-mono font-semibold", (d.avgRoe ?? 0) >= 15 ? "text-green-400" : (d.avgRoe ?? 0) >= 0 ? "text-foreground" : "text-red-400")}>
                          {d.avgRoe != null ? `${formatNum(d.avgRoe)}%` : <span className="text-muted-foreground/40">—</span>}
                        </td>
                        <td className={cn("text-right p-4 font-mono", (d.avgRoa ?? 0) >= 10 ? "text-green-400" : "text-foreground")}>
                          {d.avgRoa != null ? `${formatNum(d.avgRoa)}%` : <span className="text-muted-foreground/40">—</span>}
                        </td>
                        <td className="text-right p-4 font-mono text-muted-foreground">
                          {d.avgNpm != null ? `${formatNum(d.avgNpm)}%` : <span className="text-muted-foreground/40">—</span>}
                        </td>
                        <td className={cn("text-right p-4 font-mono", (d.avgDer ?? 0) > 3 ? "text-yellow-400" : "text-muted-foreground")}>
                          {d.avgDer != null ? formatNum(d.avgDer) : <span className="text-muted-foreground/40">—</span>}
                        </td>
                        <td className={cn("text-right p-4 font-mono", getMomentumColor(d.avg4w))}>
                          {d.avg4w != null ? (d.avg4w >= 0 ? "+" : "") + formatNum(d.avg4w) + "%" : <span className="text-muted-foreground/40">—</span>}
                        </td>
                        <td className={cn("text-right p-4 font-mono font-semibold", getMomentumColor(d.avgMomentum))}>
                          {d.avgMomentum != null ? (d.avgMomentum >= 0 ? "+" : "") + formatNum(d.avgMomentum) + "%" : <span className="text-muted-foreground/40">—</span>}
                        </td>
                        <td className="text-right p-4 pr-6 font-mono">
                          {d.breadth != null ? (
                            <div className="flex items-center gap-2 justify-end">
                              <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
                                <div
                                  className={cn("h-full rounded-full", (d.breadth ?? 0) >= 50 ? "bg-green-500" : "bg-red-500")}
                                  style={{ width: `${d.breadth}%` }}
                                />
                              </div>
                              <span className={cn("text-xs", (d.breadth ?? 0) >= 50 ? "text-green-400" : "text-red-400")}>{d.breadth}%</span>
                            </div>
                          ) : <span className="text-muted-foreground/40">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </CardContent>
      </Card>

      {/* RSI breadth detail */}
      <Card className="bg-card/40 backdrop-blur-xl border-white/5 shadow-2xl">
        <CardHeader className="border-b border-white/5 bg-black/20">
          <CardTitle className="font-display flex items-center gap-2">
            RSI Sentiment Breakdown
          </CardTitle>
          <CardDescription>Distribution of oversold / neutral / overbought stocks per sector.</CardDescription>
        </CardHeader>
        <CardContent className="p-4 h-[380px]">
          {rsiLoading
            ? <div className="h-full flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
            : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={sortedRsi}
                  layout="vertical"
                  margin={{ top: 0, right: 10, left: 100, bottom: 0 }}
                  barSize={18}
                  barGap={2}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical={true} stroke="hsl(var(--border))" strokeOpacity={0.3} />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} fontSize={10} />
                  <YAxis dataKey="sector" type="category" stroke="hsl(var(--muted-foreground))" fontSize={10} width={100} tickLine={false} axisLine={false} />
                  <Tooltip {...TooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                  <Bar dataKey="oversold" name="Oversold (RSI<30)" fill="hsl(var(--primary))" stackId="a" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="neutral" name="Neutral" fill="hsl(var(--muted-foreground)/0.5)" stackId="a" />
                  <Bar dataKey="overbought" name="Overbought (RSI>70)" fill="hsl(var(--destructive))" stackId="a" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
