import { useState } from "react";
import { useGetWatchlist } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatNum, formatPct } from "@/lib/format";
import { StockDetailModal } from "@/components/StockDetailModal";
import { WatchlistButton } from "@/components/WatchlistButton";
import { Star, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Watchlist() {
  const { data, isLoading } = useGetWatchlist();
  const [selectedStock, setSelectedStock] = useState<string | null>(null);

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-500">
      <div className="mb-6">
        <h1 className="text-3xl font-display font-bold text-white flex items-center gap-3">
          <Star className="w-8 h-8 text-yellow-500 fill-yellow-500 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]" />
          My Watchlist
        </h1>
        <p className="text-muted-foreground mt-2">Tracked stocks with their latest fundamental snapshots.</p>
      </div>

      <div className="flex-1 flex flex-col min-w-0 bg-card/60 backdrop-blur-xl border border-white/5 rounded-2xl shadow-2xl overflow-hidden relative">
        {isLoading && (
          <div className="absolute inset-0 z-50 bg-background/50 backdrop-blur-sm flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500" />
          </div>
        )}
        
        <div className="overflow-x-auto flex-1 custom-scrollbar">
          <Table className="w-full border-collapse">
            <TableHeader className="bg-black/40 sticky top-0 z-20 backdrop-blur-xl border-b border-white/10 shadow-sm">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="w-[80px] font-semibold text-white/70">Code</TableHead>
                <TableHead className="min-w-[150px] font-semibold text-white/70">Name</TableHead>
                <TableHead className="font-semibold text-white/70">Sector</TableHead>
                <TableHead className="text-right font-semibold text-white/70">PER</TableHead>
                <TableHead className="text-right font-semibold text-white/70">ROE</TableHead>
                <TableHead className="text-right font-semibold text-white/70">DER</TableHead>
                <TableHead className="text-right font-semibold text-white/70">Mom 26W</TableHead>
                <TableHead className="text-center font-semibold text-white/70">Score</TableHead>
                <TableHead className="w-[60px] text-center"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="bg-transparent">
              {data?.map(stock => (
                <TableRow 
                  key={stock.code} 
                  onClick={() => setSelectedStock(stock.code)} 
                  className="cursor-pointer border-b border-white/5 hover:bg-white/[0.03] transition-colors group"
                >
                  <TableCell className="font-mono font-bold text-white group-hover:text-yellow-500 transition-colors">{stock.code}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-muted-foreground group-hover:text-white transition-colors" title={stock.name || ""}>{stock.name || "-"}</TableCell>
                  <TableCell>
                    <span className="text-[11px] px-2 py-1 bg-black/40 border border-white/5 rounded-md text-muted-foreground whitespace-nowrap">
                      {stock.sector || "-"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono text-muted-foreground">{formatNum(stock.per)}</TableCell>
                  <TableCell className="text-right font-mono font-medium">
                    <span className={stock.roe && stock.roe > 0 ? "text-green-500" : stock.roe && stock.roe < 0 ? "text-red-500" : "text-muted-foreground"}>
                      {formatPct(stock.roe)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono text-muted-foreground">{formatNum(stock.der)}</TableCell>
                  <TableCell className="text-right font-mono font-medium">
                    <span className={stock.week26PC && stock.week26PC > 0 ? "text-green-500" : stock.week26PC && stock.week26PC < 0 ? "text-red-500" : "text-muted-foreground"}>
                      {formatPct(stock.week26PC)}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-mono border shadow-inner",
                        stock.compositeScore && stock.compositeScore >= 75 ? "bg-green-500/20 text-green-400 border-green-500/30" : 
                        stock.compositeScore && stock.compositeScore >= 50 ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" : 
                        "bg-red-500/20 text-red-400 border-red-500/30"
                      )}>
                        {stock.compositeScore || "-"}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <WatchlistButton code={stock.code} />
                  </TableCell>
                </TableRow>
              ))}
              {data?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="h-64 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center">
                      <Star className="w-12 h-12 mb-4 opacity-10" />
                      <p className="text-lg font-display">Your watchlist is empty.</p>
                      <p className="text-sm mt-1 opacity-60">Go to the screener and click the star icon to save stocks here.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <StockDetailModal code={selectedStock} onClose={() => setSelectedStock(null)} />
    </div>
  );
}
