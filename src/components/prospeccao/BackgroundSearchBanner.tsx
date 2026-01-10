import { Loader2, X, Eye, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";

interface Props {
  isVisible: boolean;
  filters: {
    segments?: string[];
    states?: string[];
    cities?: string[];
  };
  progress: {
    processed: number;
    total: number;
    found: number;
  };
  onViewResults: () => void;
  onCancel: () => void;
}

export function BackgroundSearchBanner({ isVisible, filters, progress, onViewResults, onCancel }: Props) {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (!isVisible) {
      setElapsedTime(0);
      return;
    }

    const timeInterval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    return () => {
      clearInterval(timeInterval);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  // Build filter summary
  const filterParts: string[] = [];
  if (filters.segments?.length) {
    filterParts.push(filters.segments[0]);
  }
  if (filters.cities?.length) {
    filterParts.push(filters.cities[0]);
  }
  if (filters.states?.length) {
    filterParts.push(filters.states[0]);
  }
  const filterSummary = filterParts.length > 0 ? filterParts.join(" • ") : "Buscando...";
  
  const progressPercent = progress.total > 0 
    ? Math.round((progress.processed / progress.total) * 100) 
    : 0;

  return (
    <div className="bg-primary/10 border-b border-primary/20 px-4 py-2 flex items-center gap-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <span>Buscando:</span>
        <span className="text-muted-foreground">{filterSummary}</span>
      </div>

      <div className="flex-1 max-w-xs flex items-center gap-2">
        <Progress value={progressPercent} className="h-1.5 flex-1" />
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {progress.processed}/{progress.total}
        </span>
      </div>

      <Badge variant="secondary" className="gap-1">
        <CheckCircle2 className="h-3 w-3" />
        {progress.found} encontrada(s)
      </Badge>

      <span className="text-xs text-muted-foreground">{elapsedTime}s</span>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onViewResults}
          className="h-7 px-2 text-xs"
        >
          <Eye className="h-3 w-3 mr-1" />
          Ver Resultados
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="h-7 px-2 text-xs text-destructive hover:text-destructive"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
