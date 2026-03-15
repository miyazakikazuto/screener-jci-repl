import { Link, useLocation } from "wouter";
import { Activity, LayoutDashboard, Star, RefreshCw, BarChart2 } from "lucide-react";
import { useGetSyncStatus, useTriggerSync, getGetSyncStatusQueryKey } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const queryClient = useQueryClient();
  const { data: syncStatus, isFetching: isCheckingSync } = useGetSyncStatus({ 
    query: { refetchInterval: 10000 } 
  });
  
  const sync = useTriggerSync({
    mutation: {
      onSuccess: () => {
        toast({ title: "Sync Started", description: "IDX data sync has been initiated." });
        queryClient.invalidateQueries({ queryKey: getGetSyncStatusQueryKey() });
      },
      onError: () => {
        toast({ title: "Sync Failed", description: "Could not trigger sync.", variant: "destructive" });
      }
    }
  });

  const navItems = [
    { path: "/", label: "Screener", icon: LayoutDashboard },
    { path: "/sector", label: "Sector Analysis", icon: BarChart2 },
    { path: "/watchlist", label: "Watchlist", icon: Star },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card/40 flex flex-col backdrop-blur-xl relative z-20">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-blue-700 flex items-center justify-center shadow-lg shadow-primary/20">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-display font-bold text-xl tracking-tight leading-none text-foreground">IDX Screener</h1>
            <p className="text-[10px] uppercase tracking-widest text-primary font-bold mt-1">Pro Terminal</p>
          </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            return (
              <Link key={item.path} href={item.path} className="block">
                <div className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300",
                  isActive 
                    ? "bg-primary/10 text-primary font-semibold border border-primary/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]" 
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground border border-transparent"
                )}>
                  <Icon className={cn("w-5 h-5", isActive ? "text-primary" : "")} />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>
        
        <div className="p-6 border-t border-white/5">
          <div className="bg-black/40 rounded-xl p-4 border border-white/5 shadow-inner">
            <p className="text-xs font-mono text-muted-foreground mb-2 flex items-center gap-2">
              <span className={cn("w-2 h-2 rounded-full", syncStatus?.syncing ? "bg-yellow-500 animate-pulse" : "bg-green-500")} />
              DATA STATUS
            </p>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">
                {syncStatus?.syncing ? "Syncing..." : `${syncStatus?.stockCount || 0} Stocks`}
              </span>
              <button 
                onClick={() => sync.mutate()} 
                disabled={syncStatus?.syncing || sync.isPending}
                className="p-2 hover:bg-primary/20 hover:text-primary rounded-lg transition-colors disabled:opacity-50"
                title="Force Sync Now"
              >
                <RefreshCw className={cn("w-4 h-4", (syncStatus?.syncing || sync.isPending) && "animate-spin")} />
              </button>
            </div>
            {syncStatus?.lastSync && (
              <p className="text-[10px] text-muted-foreground mt-2 font-mono opacity-60">
                Last: {new Date(syncStatus.lastSync).toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative bg-background">
        {/* Subtle ambient light */}
        <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-primary/5 via-primary/[0.02] to-transparent pointer-events-none" />
        <div className="flex-1 overflow-y-auto p-6 lg:p-8 relative z-10">
          {children}
        </div>
      </main>
    </div>
  );
}
