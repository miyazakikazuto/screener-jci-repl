import { useState } from "react";
import { useGetCandidates, useGetGeneral, GetCandidatesSortDir } from "@workspace/api-client-react";
import { useDebounce } from "@/hooks/use-debounce";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, SlidersHorizontal, ChevronUp, ChevronDown, Star } from "lucide-react";
import { formatNum, formatPct } from "@/lib/format";
import { StockDetailModal } from "@/components/StockDetailModal";
import { WatchlistButton } from "@/components/WatchlistButton";
import { cn } from "@/lib/utils";

export default function Screener() {
  const [page, setPage] = useState(0);
  const limit = 50;
  
  const [selectedStock, setSelectedStock] = useState<string | null>(null);
  
  const [sort, setSort] = useState<{by: string, dir: GetCandidatesSortDir}>({
    by: "compositeScore", 
    dir: "desc"
  });

  const [filters, setFilters] = useState({
    search: "",
    sector: "All",
    defaultFilter: true,
    excludeNotation: true,
    excludeCorpAction: false,
    excludeUma: false,
    perMax: 50,
    roeMin: 0,
    derMax: 5,
    momentumMin: 0,
    momentumWeek: 26,
  });

  const debouncedFilters = useDebounce(filters, 500);

  const { data, isLoading } = useGetCandidates({
    limit,
    offset: page * limit,
    search: debouncedFilters.search || undefined,
    sector: debouncedFilters.sector === "All" ? undefined : debouncedFilters.sector,
    defaultFilter: debouncedFilters.defaultFilter,
    excludeNotation: debouncedFilters.excludeNotation,
    excludeCorpAction: debouncedFilters.excludeCorpAction,
    excludeUma: debouncedFilters.excludeUma,
    perMax: debouncedFilters.perMax,
    roeMin: debouncedFilters.roeMin,
    derMax: debouncedFilters.derMax,
    momentumMin: debouncedFilters.momentumMin,
    momentumWeek: debouncedFilters.momentumWeek,
    sortBy: sort.by,
    sortDir: sort.dir
  }, { query: { keepPreviousData: true } });

  const { data: general } = useGetGeneral();

  const handleSort = (column: string) => {
    setSort(prev => ({
      by: column,
      dir: prev.by === column && prev.dir === "desc" ? "asc" : "desc"
    }));
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sort.by !== column) return null;
    return sort.dir === "desc" ? <ChevronDown className="w-3 h-3 inline ml-1 text-primary" /> : <ChevronUp className="w-3 h-3 inline ml-1 text-primary" />;
  };

  return (
    <div className="flex h-full flex-col xl:flex-row gap-6">
      {/* Filter Sidebar */}
      <div className="w-full xl:w-80 flex-shrink-0 bg-card rounded-2xl border border-white/5 shadow-xl p-6 space-y-8 overflow-y-auto custom-scrollbar">
        <div className="flex items-center gap-2 text-white pb-4 border-b border-white/5">
          <SlidersHorizontal className="w-5 h-5 text-primary" />
          <h2 className="font-display font-semibold text-lg">Filters</h2>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2 block">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Code or Name..." 
                value={filters.search} 
                onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                className="pl-9 bg-black/20 border-white/10 focus-visible:ring-primary h-10"
              />
            </div>
          </div>
          
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2 block">Sector</label>
            <Select value={filters.sector} onValueChange={v => setFilters(f => ({ ...f, sector: v, offset: 0 }))}>
              <SelectTrigger className="bg-black/20 border-white/10 h-10">
                <SelectValue placeholder="All Sectors" />
              </SelectTrigger>
              <SelectContent className="bg-card border-white/10">
                <SelectItem value="All">All Sectors</SelectItem>
                {general?.sectors.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="space-y-4 p-5 bg-black/20 rounded-xl border border-white/5">
          <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold block mb-3">Pre-sets & Exclusions</label>
          <div className="flex items-center gap-3">
            <Checkbox 
              id="default" 
              checked={filters.defaultFilter} 
              onCheckedChange={c => setFilters(f => ({ ...f, defaultFilter: !!c }))}
              className="border-white/20 data-[state=checked]:bg-primary"
            />
            <label htmlFor="default" className="text-sm font-medium cursor-pointer leading-none text-foreground">Apply Quality Baseline</label>
          </div>
          <div className="flex items-center gap-3">
            <Checkbox 
              id="nota" 
              checked={filters.excludeNotation} 
              onCheckedChange={c => setFilters(f => ({ ...f, excludeNotation: !!c }))}
              className="border-white/20 data-[state=checked]:bg-destructive data-[state=checked]:border-destructive"
            />
            <label htmlFor="nota" className="text-sm cursor-pointer leading-none text-muted-foreground">Exclude Notations</label>
          </div>
          <div className="flex items-center gap-3">
            <Checkbox 
              id="uma" 
              checked={filters.excludeUma} 
              onCheckedChange={c => setFilters(f => ({ ...f, excludeUma: !!c }))}
              className="border-white/20 data-[state=checked]:bg-destructive data-[state=checked]:border-destructive"
            />
            <label htmlFor="uma" className="text-sm cursor-pointer leading-none text-muted-foreground">Exclude UMA</label>
          </div>
        </div>
        
        <div className="space-y-6">
          <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold block">Metrics Thresholds</label>
          
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm text-foreground">Max PER</label>
              <span className="text-xs font-mono bg-black/40 px-2 py-0.5 rounded text-muted-foreground border border-white/5">{filters.perMax}x</span>
            </div>
            <input type="range" min="0" max="200" step="1" value={filters.perMax} onChange={e => setFilters(f => ({ ...f, perMax: Number(e.target.value) }))} className="w-full accent-primary h-1.5 bg-muted rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full cursor-pointer" />
          </div>
          
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm text-foreground">Min ROE</label>
              <span className="text-xs font-mono bg-black/40 px-2 py-0.5 rounded text-muted-foreground border border-white/5">{filters.roeMin}%</span>
            </div>
            <input type="range" min="-50" max="100" step="1" value={filters.roeMin} onChange={e => setFilters(f => ({ ...f, roeMin: Number(e.target.value) }))} className="w-full accent-primary h-1.5 bg-muted rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full cursor-pointer" />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm text-foreground">Max DER</label>
              <span className="text-xs font-mono bg-black/40 px-2 py-0.5 rounded text-muted-foreground border border-white/5">{filters.derMax}x</span>
            </div>
            <input type="range" min="0" max="10" step="0.1" value={filters.derMax} onChange={e => setFilters(f => ({ ...f, derMax: Number(e.target.value) }))} className="w-full accent-primary h-1.5 bg-muted rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full cursor-pointer" />
          </div>
        </div>
      </div>
      
      {/* Main Table Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-card/60 backdrop-blur-xl border border-white/5 rounded-2xl shadow-2xl overflow-hidden relative">
        {isLoading && (
          <div className="absolute inset-0 z-50 bg-background/50 backdrop-blur-sm flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          </div>
        )}
        
        <div className="overflow-x-auto flex-1 custom-scrollbar relative">
          <Table className="w-full border-collapse">
            <TableHeader className="bg-black/40 sticky top-0 z-20 backdrop-blur-xl border-b border-white/10 shadow-sm">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="w-[80px] font-semibold text-white/70">Code</TableHead>
                <TableHead className="min-w-[150px] font-semibold text-white/70">Name</TableHead>
                <TableHead className="font-semibold text-white/70">Sector</TableHead>
                <TableHead className="text-right cursor-pointer hover:text-white transition-colors select-none" onClick={() => handleSort('per')}>
                  PER <SortIcon column="per" />
                </TableHead>
                <TableHead className="text-right cursor-pointer hover:text-white transition-colors select-none" onClick={() => handleSort('pbv')}>
                  PBV <SortIcon column="pbv" />
                </TableHead>
                <TableHead className="text-right cursor-pointer hover:text-white transition-colors select-none" onClick={() => handleSort('roe')}>
                  ROE <SortIcon column="roe" />
                </TableHead>
                <TableHead className="text-right cursor-pointer hover:text-white transition-colors select-none" onClick={() => handleSort('week26PC')}>
                  Mom 26W <SortIcon column="week26PC" />
                </TableHead>
                <TableHead className="text-center cursor-pointer hover:text-white transition-colors select-none" onClick={() => handleSort('compositeScore')}>
                  Score <SortIcon column="compositeScore" />
                </TableHead>
                <TableHead className="w-[60px] text-center"><Star className="w-4 h-4 mx-auto text-white/50" /></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="bg-transparent">
              {data?.data.map(stock => (
                <TableRow 
                  key={stock.code} 
                  onClick={() => setSelectedStock(stock.code)} 
                  className="cursor-pointer border-b border-white/5 hover:bg-white/[0.03] transition-colors group"
                >
                  <TableCell className="font-mono font-bold text-white group-hover:text-primary transition-colors">{stock.code}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-muted-foreground group-hover:text-white transition-colors" title={stock.name || ""}>{stock.name}</TableCell>
                  <TableCell>
                    <span className="text-[11px] px-2 py-1 bg-black/40 border border-white/5 rounded-md text-muted-foreground whitespace-nowrap">
                      {stock.sector?.substring(0, 20)}{stock.sector && stock.sector.length > 20 ? '...' : ''}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono text-muted-foreground">{formatNum(stock.per)}</TableCell>
                  <TableCell className="text-right font-mono text-muted-foreground">{formatNum(stock.pbv)}</TableCell>
                  <TableCell className="text-right font-mono font-medium">
                    <span className={stock.roe && stock.roe > 0 ? "text-green-500 drop-shadow-[0_0_8px_rgba(34,197,94,0.3)]" : stock.roe && stock.roe < 0 ? "text-red-500" : "text-muted-foreground"}>
                      {formatPct(stock.roe)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono font-medium">
                    <span className={stock.week26PC && stock.week26PC > 0 ? "text-green-500 drop-shadow-[0_0_8px_rgba(34,197,94,0.3)]" : stock.week26PC && stock.week26PC < 0 ? "text-red-500" : "text-muted-foreground"}>
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
              {data?.data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="h-48 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center">
                      <Search className="w-8 h-8 mb-3 opacity-20" />
                      <p>No stocks match your strict criteria.</p>
                      <Button variant="link" className="mt-2 text-primary" onClick={() => setFilters(f => ({...f, search: "", sector: "All", defaultFilter: false, perMax: 200, roeMin: -50}))}>Reset Filters</Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination Footer */}
        <div className="p-4 border-t border-white/5 bg-black/40 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing <span className="text-white font-medium">{data?.data.length ? page * limit + 1 : 0}</span> to <span className="text-white font-medium">{Math.min((page + 1) * limit, data?.totalCount || 0)}</span> of <span className="text-white font-medium">{data?.totalCount || 0}</span>
          </p>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setPage(p => Math.max(0, p - 1))} 
              disabled={page === 0}
              className="bg-black/20 border-white/10 hover:bg-white/10 hover:text-white"
            >
              Previous
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setPage(p => p + 1)} 
              disabled={!data?.totalCount || (page + 1) * limit >= data.totalCount}
              className="bg-black/20 border-white/10 hover:bg-white/10 hover:text-white"
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      <StockDetailModal code={selectedStock} onClose={() => setSelectedStock(null)} />
    </div>
  );
}
