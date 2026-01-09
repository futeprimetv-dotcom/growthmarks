import { Loader2, X, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useState, useEffect } from "react";

interface Props {
  isVisible: boolean;
  filters: {
    segments?: string[];
    states?: string[];
    cities?: string[];
  };
  onRestore: () => void;
  onCancel: () => void;
}

export function BackgroundSearchBanner({ isVisible, filters, onRestore, onCancel }: Props) {
  const [progress, setProgress] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (!isVisible) {
      setProgress(0);
      setElapsedTime(0);
      return;
    }

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) return 95;
        return prev + Math.random() * 2;
      });
    }, 500);

    const timeInterval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    return () => {
      clearInterval(progressInterval);
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

  return (
    <div className="bg-primary/10 border-b border-primary/20 px-4 py-2 flex items-center gap-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <span>Buscando em segundo plano:</span>
        <span className="text-muted-foreground">{filterSummary}</span>
      </div>

      <div className="flex-1 max-w-xs">
        <Progress value={progress} className="h-1.5" />
      </div>

      <span className="text-xs text-muted-foreground">{elapsedTime}s</span>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onRestore}
          className="h-7 px-2 text-xs"
        >
          <Maximize2 className="h-3 w-3 mr-1" />
          Expandir
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
