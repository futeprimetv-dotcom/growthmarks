import { X, Loader2, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useCNPJPull } from "@/contexts/CNPJPullContext";
import { useNavigate } from "react-router-dom";

export function CNPJPullBanner() {
  const { activeSearch, isSearching, progress, cancelSearch } = useCNPJPull();
  const navigate = useNavigate();

  // Only show when search is in background and still running or just completed
  if (!activeSearch?.isBackground) return null;
  if (progress.status === "idle" || progress.status === "cancelled") return null;

  const progressPercent = progress.totalFound > 0
    ? Math.round((progress.processed / progress.totalFound) * 100)
    : 0;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 bg-card border rounded-lg shadow-lg p-4 animate-in slide-in-from-bottom-5">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {isSearching ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm font-medium">Buscando CNPJs...</span>
            </>
          ) : (
            <>
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Busca concluída!</span>
            </>
          )}
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={cancelSearch}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {isSearching && (
        <>
          <Progress value={progressPercent} className="h-1.5 mb-2" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{progress.processed}/{progress.totalFound} processados</span>
            <span className="text-green-600">{progress.activeCount} ativos</span>
          </div>
        </>
      )}

      {progress.status === "completed" && (
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm text-green-600 font-medium">
            {progress.activeCount} CNPJs ativos encontrados
          </span>
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() => navigate("/prospeccao")}
          >
            <ExternalLink className="h-3 w-3" />
            Ver
          </Button>
        </div>
      )}
    </div>
  );
}
