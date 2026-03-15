import { useGetScreenerRsi, useGetSectorStrength } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, Cell } from "recharts";
import { formatNum } from "@/lib/format";
import { BarChart2, TrendingUp } from "lucide-react";

export default function SectorAnalysis() {
  const { data: rsiData, isLoading: rsiLoading } = useGetScreenerRsi({ query: { keepPreviousData: true } });
  const { data: strengthData, isLoading: strengthLoading } = useGetSectorStrength({ week: 26 }, { query: { keepPreviousData: true } });

  const sortedRsi = rsiData ? [...rsiData].sort((a, b) => (b.rsi || 0) - (a.rsi || 0)) : [];
  
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div>
        <h1 className="text-3xl font-display font-bold text-white flex items-center gap-3">
          <BarChart2 className="w-8 h-8 text-primary" />
          Sector Analysis
        </h1>
        <p className="text-muted-foreground mt-2">Macro overview of relative strength and momentum across IDX sectors.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* RSI Chart */}
        <Card className="bg-card/40 backdrop-blur-xl border-white/5 shadow-2xl">
          <CardHeader className="border-b border-white/5 bg-black/20">
            <CardTitle className="font-display flex items-center gap-2">
              Sector RSI 
              <span className="text-xs font-mono px-2 py-0.5 bg-primary/20 text-primary rounded-md border border-primary/20">14-Day</span>
            </CardTitle>
            <CardDescription>Relative Strength Index average per sector. Below 30 is oversold, above 70 is overbought.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 h-[500px] relative">
            {rsiLoading && <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sortedRsi} layout="vertical" margin={{ top: 0, right: 30, left: 60, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.5} />
                <XAxis type="number" domain={[0, 100]} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                <YAxis dataKey="sector" type="category" stroke="hsl(var(--muted-foreground))" fontSize={11} width={120} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: 'hsl(var(--muted)/0.5)' }} 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  formatter={(val: number) => [formatNum(val), 'RSI']}
                />
                <ReferenceLine x={30} stroke="hsl(var(--primary))" strokeDasharray="3 3" label={{ position: 'top', value: 'Oversold', fill: 'hsl(var(--primary))', fontSize: 10 }} />
                <ReferenceLine x={70} stroke="hsl(var(--destructive))" strokeDasharray="3 3" label={{ position: 'top', value: 'Overbought', fill: 'hsl(var(--destructive))', fontSize: 10 }} />
                <Bar dataKey="rsi" radius={[0, 4, 4, 0]} barSize={16}>
                  {sortedRsi.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={
                        (entry.rsi || 0) > 70 ? 'hsl(var(--destructive))' : 
                        (entry.rsi || 0) < 30 ? 'hsl(var(--primary))' : 
                        'hsl(var(--muted-foreground)/0.7)'
                      } 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Momentum Strength Chart */}
        <Card className="bg-card/40 backdrop-blur-xl border-white/5 shadow-2xl">
          <CardHeader className="border-b border-white/5 bg-black/20">
            <CardTitle className="font-display flex items-center gap-2">
              Momentum Strength
              <span className="text-xs font-mono px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-md border border-blue-500/20">26-Week</span>
            </CardTitle>
            <CardDescription>Average 26-week price change percentage per sector.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 h-[500px] relative">
            {strengthLoading && <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={strengthData} layout="vertical" margin={{ top: 0, right: 30, left: 60, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.5} />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                <YAxis dataKey="sector" type="category" stroke="hsl(var(--muted-foreground))" fontSize={11} width={120} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: 'hsl(var(--muted)/0.5)' }} 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  formatter={(val: number) => [`${formatNum(val)}%`, 'Momentum']}
                />
                <ReferenceLine x={0} stroke="hsl(var(--border))" />
                <Bar dataKey="avgMomentum" radius={[0, 4, 4, 0]} barSize={16}>
                  {strengthData?.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.avgMomentum >= 0 ? 'hsl(142, 71%, 45%)' : 'hsl(0, 72%, 51%)'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
