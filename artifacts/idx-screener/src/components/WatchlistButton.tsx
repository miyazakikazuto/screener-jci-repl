import { Star } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useGetWatchlist, 
  useAddToWatchlist, 
  useRemoveFromWatchlist, 
  getGetWatchlistQueryKey 
} from "@workspace/api-client-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

export function WatchlistButton({ code, className }: { code: string, className?: string }) {
  const { data: watchlist } = useGetWatchlist();
  const add = useAddToWatchlist();
  const remove = useRemoveFromWatchlist();
  const queryClient = useQueryClient();
  
  const isWatchlisted = watchlist?.some(w => w.code === code);
  
  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      if (isWatchlisted) {
        await remove.mutateAsync({ code });
        toast({ title: "Removed from Watchlist", description: `${code} has been removed.` });
      } else {
        await add.mutateAsync({ code });
        toast({ title: "Added to Watchlist", description: `${code} has been saved.` });
      }
      queryClient.invalidateQueries({ queryKey: getGetWatchlistQueryKey() });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update watchlist.", variant: "destructive" });
    }
  };
  
  return (
    <button 
      onClick={toggle} 
      disabled={add.isPending || remove.isPending}
      className={cn(
        "p-2 hover:bg-white/10 rounded-full transition-all active:scale-95 disabled:opacity-50",
        className
      )}
    >
      <Star 
        className={cn(
          "w-5 h-5 transition-all", 
          isWatchlisted ? "fill-yellow-500 text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]" : "text-muted-foreground hover:text-foreground"
        )} 
      />
    </button>
  );
}
