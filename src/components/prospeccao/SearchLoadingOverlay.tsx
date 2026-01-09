import { useState, useEffect } from "react";
import { Loader2, Search, Building2, MapPin, Globe, CheckCircle, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

interface Props {
  isVisible: boolean;
  filters: {
    segments?: string[];
    states?: string[];
    cities?: string[];
    companySizes?: string[];
    hasWebsite?: boolean;
    hasPhone?: boolean;
    hasEmail?: boolean;
  };
  onCancel?: () => void;
  onMinimize?: () => void;
}

const searchSteps = [
  { icon: Search, label: "Buscando empresas na web...", duration: 3000 },
  { icon: Building2, label: "Consultando bases de dados...", duration: 4000 },
  { icon: MapPin, label: "Filtrando por localização...", duration: 2000 },
  { icon: Globe, label: "Verificando dados de contato...", duration: 3000 },
  { icon: CheckCircle, label: "Finalizando busca...", duration: 2000 },
];

export function SearchLoadingOverlay({ isVisible, filters, onCancel, onMinimize }: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (!isVisible) {
      setCurrentStep(0);
      setProgress(0);
      setElapsedTime(0);
      return;
    }

    // Progress animation
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) return 95; // Cap at 95% until complete
        return prev + Math.random() * 3;
      });
    }, 200);

    // Step animation
    const stepInterval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= searchSteps.length - 1) return prev;
        return prev + 1;
      });
    }, 3000);

    // Elapsed time
    const timeInterval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(stepInterval);
      clearInterval(timeInterval);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  const CurrentIcon = searchSteps[currentStep]?.icon || Search;
  const currentLabel = searchSteps[currentStep]?.label || "Processando...";

  // Build filter description
  const filterParts: string[] = [];
  if (filters.segments?.length) {
    filterParts.push(filters.segments.length === 1 
      ? filters.segments[0] 
      : `${filters.segments.length} segmentos`
    );
  }
  if (filters.cities?.length) {
    filterParts.push(filters.cities.length === 1 
      ? filters.cities[0] 
      : `${filters.cities.length} cidades`
    );
  }
  if (filters.states?.length) {
    filterParts.push(filters.states.join(", "));
  }
  if (filters.companySizes?.length) {
    filterParts.push(filters.companySizes.join(", "));
  }

  const filterDescription = filterParts.length > 0 
    ? filterParts.join(" • ") 
    : "Todos os filtros";

  const estimatedTime = "10-30 segundos";

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-card border rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="relative mx-auto w-16 h-16">
            <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
            <div className="relative bg-primary rounded-full w-16 h-16 flex items-center justify-center">
              <CurrentIcon className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <h2 className="text-xl font-bold">Buscando Empresas</h2>
          <p className="text-sm text-muted-foreground">{filterDescription}</p>
        </div>

        {/* Progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progresso</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Current Step */}
        <div className="bg-muted/50 rounded-lg p-4 flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-primary shrink-0" />
          <span className="text-sm font-medium">{currentLabel}</span>
        </div>

        {/* Steps Indicator */}
        <div className="flex justify-center gap-2">
          {searchSteps.map((_, index) => (
            <div
              key={index}
              className={`h-2 w-2 rounded-full transition-colors duration-300 ${
                index <= currentStep ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>

        {/* Time Info */}
        <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-4">
          <span>Tempo decorrido: {elapsedTime}s</span>
          <span>Estimado: {estimatedTime}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button 
            variant="secondary" 
            onClick={onMinimize}
            className="flex-1"
          >
            Continuar em segundo plano
          </Button>
          <Button 
            variant="outline" 
            onClick={onCancel}
            className="flex-1"
          >
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
        </div>

        {/* Tips */}
        <p className="text-xs text-center text-muted-foreground">
          💡 Dica: Quanto mais específicos os filtros, mais assertivos serão os resultados
        </p>
      </div>
    </div>
  );
}
