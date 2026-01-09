import { useState, useEffect } from "react";
import { Loader2, Search, Building2, MapPin, CheckCircle, X, Minimize2, ArrowRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { CompanySearchResult } from "@/hooks/useCompanySearch";

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
  companies: CompanySearchResult[];
  progress: {
    processed: number;
    total: number;
    found: number;
  };
  onCancel: () => void;
  onMinimize: () => void;
  onViewResults: () => void;
}

export function StreamingSearchOverlay({ 
  isVisible, 
  filters, 
  companies,
  progress,
  onCancel, 
  onMinimize,
  onViewResults 
}: Props) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [recentCompanies, setRecentCompanies] = useState<CompanySearchResult[]>([]);

  useEffect(() => {
    if (!isVisible) {
      setElapsedTime(0);
      setRecentCompanies([]);
      return;
    }

    const timeInterval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    return () => {
      clearInterval(timeInterval);
    };
  }, [isVisible]);

  // Track recent companies for animation
  useEffect(() => {
    if (companies.length > 0) {
      setRecentCompanies(companies.slice(-3).reverse());
    }
  }, [companies]);

  if (!isVisible) return null;

  const progressPercent = progress.total > 0 
    ? Math.round((progress.processed / progress.total) * 100) 
    : 0;

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

  const filterDescription = filterParts.length > 0 
    ? filterParts.join(" • ") 
    : "Todos os filtros";

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border rounded-2xl shadow-2xl w-full max-w-2xl space-y-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
                <div className="relative bg-primary rounded-full w-10 h-10 flex items-center justify-center">
                  <Search className="h-5 w-5 text-primary-foreground" />
                </div>
              </div>
              <div>
                <h2 className="text-lg font-bold">Buscando Empresas</h2>
                <p className="text-sm text-muted-foreground">{filterDescription}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-lg font-bold px-4 py-1">
                {companies.length}
              </Badge>
              <span className="text-sm text-muted-foreground">encontrada(s)</span>
            </div>
          </div>
        </div>

        {/* Progress Section */}
        <div className="px-6 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Processando CNPJs: {progress.processed} / {progress.total}
            </span>
            <span className="font-medium">{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Live Results Preview */}
        <div className="px-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Empresas encontradas em tempo real
            </h3>
            {companies.length > 0 && (
              <Button 
                variant="link" 
                size="sm" 
                onClick={onViewResults}
                className="text-primary"
              >
                Ver todas ({companies.length})
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>

          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {recentCompanies.length === 0 ? (
              <div className="bg-muted/30 rounded-lg p-4 flex items-center justify-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">
                  Aguardando primeiros resultados...
                </span>
              </div>
            ) : (
              recentCompanies.map((company, index) => (
                <Card 
                  key={company.id || company.cnpj}
                  className={cn(
                    "p-3 transition-all duration-500 border-l-4 border-l-primary",
                    index === 0 && "animate-in fade-in slide-in-from-top-2"
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">
                          {company.name || company.razao_social}
                        </span>
                        <Badge variant="outline" className="text-green-600 border-green-600 shrink-0">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Ativa
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {company.city}, {company.state}
                        </span>
                        {company.segment && (
                          <span className="truncate max-w-[200px]">
                            {company.segment}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>

          {companies.length > 3 && (
            <p className="text-xs text-center text-muted-foreground">
              + {companies.length - 3} mais empresas encontradas
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 space-y-4">
          {/* Time Info */}
          <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-4">
            <span>Tempo decorrido: {elapsedTime}s</span>
            <span className="flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Processando...
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {companies.length > 0 && (
              <Button 
                onClick={onViewResults}
                className="flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Ver {companies.length} Resultados
              </Button>
            )}
            <Button 
              variant="secondary" 
              onClick={onMinimize}
              className="flex-1"
            >
              <Minimize2 className="h-4 w-4 mr-2" />
              Segundo plano
            </Button>
            <Button 
              variant="outline" 
              onClick={onCancel}
              className={companies.length > 0 ? "" : "flex-1"}
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
          </div>

          {/* Tips */}
          <p className="text-xs text-center text-muted-foreground">
            💡 As empresas aparecem assim que são encontradas. Você pode ver os resultados a qualquer momento!
          </p>
        </div>
      </div>
    </div>
  );
}
