import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useGetStockDetail } from "@workspace/api-client-react";
import { format, subMonths } from "date-fns";
import { formatIDR, formatNum, formatPct, parseIdxDate } from "@/lib/format";
import { WatchlistButton } from "./WatchlistButton";
import { cn } from "@/lib/utils";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell
} from "recharts";

function ScoreBadge({ score, className }: { score?: number | null, className?: string }) {
  if (score == null) return <Badge variant="outline" className={className}>-</Badge>;
  let color = "bg-red-500/10 text-red-500 border-red-500/20";
  if (score >= 75) color = "bg-green-500/10 text-green-500 border-green-500/20";
  else if (score >= 50) color = "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
  
  return (
    <Badge className={cn("font-mono font-bold text-sm border shadow-sm", color, className)}>
      {score}
    </Badge>
  );
}

function MetricCard({ title, value, suffix = "", colorize = false, inverseColor = false }: any) {
  const isPositive = inverseColor ? value < 0 : value > 0;
  const isNegative = inverseColor ? value > 0 : value < 0;
  const colorClass = colorize ? (isPositive ? "text-green-500" : isNegative ? "text-red-500" : "") : "";
  
  return (
    <div className="bg-black/20 border border-white/5 rounded-xl p-4 shadow-inner">
      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{title}</p>
      <p className={cn("text-2xl font-mono font-medium", colorClass)}>
        {value != null ? `${formatNum(value)}${suffix}` : "-"}
      </p>
    </div>
  );
}

function ScoreGauge({ title, score }: { title: string, score?: number | null }) {
  const pct = score || 0;
  let color = "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]";
  if (pct >= 75) color = "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]";
  else if (pct >= 50) color = "bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]";
  
  return (
    <div className="bg-black/20 border border-white/5 rounded-xl p-5">
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <span className="font-mono text-xl font-bold">{pct}</span>
      </div>
      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-1000 ease-out", color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function StockDetailModal({ code, onClose }: { code: string | null; onClose: () => void }) {
  const end = format(new Date(), "yyyyMMdd");
  const start = format(subMonths(new Date(), 6), "yyyyMMdd");
  
  const { data, isLoading } = useGetStockDetail(code || "", { start, end }, { 
    query: { enabled: !!code, retry: false } 
  });
  
  return (
    <Dialog open={!!code} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0 overflow-hidden bg-card/95 backdrop-blur-3xl border-white/10 shadow-2xl shadow-black/80 sm:rounded-2xl">
        {isLoading || !data ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
            <p className="text-muted-foreground font-mono text-sm animate-pulse">Loading data for {code}...</p>
          </div>
        ) : (
          <>
            {/* Header Area */}
            <DialogHeader className="px-8 pt-8 pb-6 border-b border-white/5 bg-gradient-to-b from-white/5 to-transparent relative">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-4">
                    <DialogTitle className="text-4xl font-display font-bold tracking-tight text-white">{data.code}</DialogTitle>
                    <ScoreBadge score={data.compositeScore} className="px-3 py-1 text-base" />
                    <WatchlistButton code={data.code} className="bg-black/20 hover:bg-black/40 border border-white/5" />
                  </div>
                  <p className="text-muted-foreground mt-2 text-lg">{data.name}</p>
                  <div className="flex gap-2 mt-4">
                    <Badge variant="secondary" className="bg-black/30 hover:bg-black/30 border-white/5 font-medium">{data.sector}</Badge>
                    <Badge variant="secondary" className="bg-black/30 hover:bg-black/30 border-white/5 font-medium">{data.industry}</Badge>
                    {data.hasNotation && <Badge variant="destructive" className="font-medium">Notation</Badge>}
                    {data.hasUma && <Badge variant="destructive" className="font-medium bg-orange-500/20 text-orange-500 border-orange-500/20 hover:bg-orange-500/30">UMA</Badge>}
                  </div>
                </div>
                <div className="text-right bg-black/20 p-4 rounded-xl border border-white/5">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Market Cap</p>
                  <p className="text-2xl font-mono font-semibold text-white drop-shadow-md">{formatIDR(data.marketCapital)}</p>
                </div>
              </div>
            </DialogHeader>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="mb-8 bg-black/40 border border-white/5 p-1 h-12 rounded-lg">
                  <TabsTrigger value="overview" className="h-full px-6 rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium transition-all">Fundamental Overview</TabsTrigger>
                  <TabsTrigger value="technical" className="h-full px-6 rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium transition-all">Price & Technicals</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="space-y-8 mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <MetricCard title="P/E Ratio" value={data.per} suffix="x" />
                    <MetricCard title="P/B Ratio" value={data.pbv} suffix="x" />
                    <MetricCard title="ROE" value={data.roe} suffix="%" colorize />
                    <MetricCard title="ROA" value={data.roa} suffix="%" colorize />
                    <MetricCard title="DER" value={data.der} suffix="x" inverseColor colorize />
                    <MetricCard title="NPM" value={data.npm} suffix="%" colorize />
                    <MetricCard title="YTD Return" value={data.ytdpc} suffix="%" colorize />
                    <MetricCard title="1Y Return" value={data.week52PC} suffix="%" colorize />
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-display font-semibold mb-4 text-white">Composite Evaluation</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <ScoreGauge title="Value Score" score={data.valueScore} />
                      <ScoreGauge title="Quality Score" score={data.qualityScore} />
                      <ScoreGauge title="Momentum Score" score={data.momentumScore} />
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="technical" className="mt-0 h-[450px] animate-in fade-in slide-in-from-bottom-4 duration-500">
                   <div className="bg-black/20 border border-white/5 rounded-xl p-4 h-full relative">
                      <h3 className="text-sm font-medium absolute top-4 left-4 z-10 text-muted-foreground">6M Price History (Close)</h3>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data.ohlc} margin={{ top: 40, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.5} />
                          <XAxis 
                            dataKey="date" 
                            tickFormatter={(v) => parseIdxDate(v)} 
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            dy={10}
                            minTickGap={30}
                          />
                          <YAxis 
                            domain={['auto', 'auto']} 
                            tickFormatter={(v) => formatNum(v)}
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            dx={-10}
                          />
                          <Tooltip 
                            contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)' }}
                            labelFormatter={(v) => parseIdxDate(v as string)}
                            itemStyle={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-mono)' }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="close" 
                            name="Close Price"
                            stroke="hsl(var(--primary))" 
                            strokeWidth={3} 
                            fillOpacity={1} 
                            fill="url(#colorClose)" 
                            activeDot={{ r: 6, fill: 'hsl(var(--primary))', stroke: '#fff', strokeWidth: 2 }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                   </div>
                </TabsContent>
              </Tabs>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
