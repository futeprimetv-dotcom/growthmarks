import { Loader2, X, Maximize2, CheckCircle, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useBackgroundSearch } from "@/contexts/BackgroundSearchContext";

export function GlobalSearchBanner() {
  const navigate = useNavigate();
  const { activeSearch, isSearching, cancelSearch, clearSearch } = useBackgroundSearch();
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (!isSearching) {
      setElapsedTime(0);
      return;
    }

    const timeInterval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    return () => {
      clearInterval(timeInterval);
    };
  }, [isSearching]);

  // Don't show if no active search
  if (!activeSearch) return null;

  // Build filter summary
  const filterParts: string[] = [];
  if (activeSearch.filters.segments?.length) {
    filterParts.push(activeSearch.filters.segments[0]);
  }
  if (activeSearch.filters.cities?.length) {
    filterParts.push(activeSearch.filters.cities[0]);
  }
  if (activeSearch.filters.states?.length) {
    filterParts.push(activeSearch.filters.states[0]);
  }
  const filterSummary = filterParts.length > 0 ? filterParts.join(" • ") : "Buscando...";

  // Calculate real progress from context
  const progress = activeSearch.progress;
  const phase = (activeSearch as any).phase || "searching";
  const isSearchingPhase = phase === "searching";
  
  const progressPercent = progress.total > 0 
    ? Math.round((progress.processed / progress.total) * 100) 
    : 0;
    
  // Show different message based on phase
  const phaseMessage = isSearchingPhase 
    ? "Buscando na internet..." 
    : "Validando empresas...";

  const handleViewResults = () => {
    navigate("/prospeccao?showResults=true");
    clearSearch();
  };

  const handleCancel = () => {
    cancelSearch();
  };

  const handleDismiss = () => {
    clearSearch();
  };

  // Show completed state
  if (activeSearch.status === "completed") {
    return (
      <div className="bg-green-500/10 border-b border-green-500/20 px-4 py-2 flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span>Busca concluída:</span>
          <span className="text-muted-foreground">
            {activeSearch.total} empresa(s) encontrada(s)
          </span>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleViewResults}
            className="h-7 px-3 text-xs bg-green-500/20 hover:bg-green-500/30 text-green-700 dark:text-green-300"
          >
            Ver Resultados
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  }

  // Show error state
  if (activeSearch.status === "error") {
    return (
      <div className="bg-destructive/10 border-b border-destructive/20 px-4 py-2 flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <span>Erro na busca:</span>
          <span className="text-muted-foreground">
            {activeSearch.error || "Erro desconhecido"}
          </span>
        </div>

        <div className="flex-1" />

        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  // Show running state
  if (!isSearching) return null;

  return (
    <div className="bg-primary/10 border-b border-primary/20 px-4 py-2 flex items-center gap-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <span>{phaseMessage}</span>
        <span className="text-muted-foreground">{filterSummary}</span>
      </div>

      <div className="flex-1 max-w-xs flex items-center gap-2">
        <Progress value={progressPercent} className="h-1.5 flex-1" />
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {progress.processed}/{progress.total || "?"}
        </span>
      </div>

      {!isSearchingPhase && (
        <Badge variant="secondary" className="gap-1">
          <CheckCircle2 className="h-3 w-3" />
          {progress.found} encontrada(s)
        </Badge>
      )}

      {isSearchingPhase && progress.found > 0 && (
        <Badge variant="outline" className="gap-1">
          {progress.found} CNPJs
        </Badge>
      )}

      <span className="text-xs text-muted-foreground">{elapsedTime}s</span>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/prospeccao")}
          className="h-7 px-2 text-xs"
        >
          <Maximize2 className="h-3 w-3 mr-1" />
          Ver
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          className="h-7 px-2 text-xs text-destructive hover:text-destructive"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
