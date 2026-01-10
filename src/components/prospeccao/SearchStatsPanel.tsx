import { Clock, Database, Search, CheckCircle, XCircle, Zap, BarChart3, X, ChevronDown, ChevronUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export interface SearchDebugStats {
  totalCNPJsFound: number;
  cnpjsProcessed: number;
  cacheHits: number;
  skippedNoData: number;
  skippedInactive: number;
  skippedLocation: number;
  companiesReturned: number;
  apiErrors: { brasilapi: number; cnpjws: number };
  processingTimeMs: number;
}

interface SearchStatsPanelProps {
  stats: SearchDebugStats | null;
  isVisible: boolean;
  onClose?: () => void;
}

export function SearchStatsPanel({ stats, isVisible, onClose }: SearchStatsPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!isVisible || !stats) return null;

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    const seconds = (ms / 1000).toFixed(1);
    return `${seconds}s`;
  };

  const successRate = stats.cnpjsProcessed > 0 
    ? Math.round((stats.companiesReturned / stats.cnpjsProcessed) * 100) 
    : 0;

  const cacheRate = stats.cnpjsProcessed > 0
    ? Math.round((stats.cacheHits / stats.cnpjsProcessed) * 100)
    : 0;

  if (isCollapsed) {
    return (
      <Card className="p-2 bg-muted/30 border-dashed mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">Estatísticas da Busca</span>
            <Badge variant="secondary" className="text-xs">
              {stats.companiesReturned} retornados
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsCollapsed(false)}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
            {onClose && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-muted/30 border-dashed mb-4">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="h-4 w-4 text-primary" />
        <span className="font-medium text-sm">Estatísticas da Busca</span>
        <Badge variant="outline" className="ml-auto">
          <Clock className="h-3 w-3 mr-1" />
          {formatTime(stats.processingTimeMs)}
        </Badge>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => setIsCollapsed(true)}
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        {/* CNPJs Found */}
        <div className="flex items-center gap-2 p-2 rounded-md bg-background">
          <Search className="h-4 w-4 text-blue-500" />
          <div>
            <div className="text-muted-foreground">Encontrados</div>
            <div className="font-semibold">{stats.totalCNPJsFound.toLocaleString()}</div>
          </div>
        </div>

        {/* Processed */}
        <div className="flex items-center gap-2 p-2 rounded-md bg-background">
          <Database className="h-4 w-4 text-purple-500" />
          <div>
            <div className="text-muted-foreground">Processados</div>
            <div className="font-semibold">{stats.cnpjsProcessed}</div>
          </div>
        </div>

        {/* Cache Hits */}
        <div className="flex items-center gap-2 p-2 rounded-md bg-background">
          <Zap className="h-4 w-4 text-yellow-500" />
          <div>
            <div className="text-muted-foreground">Cache</div>
            <div className="font-semibold">
              {stats.cacheHits} 
              {cacheRate > 0 && <span className="text-muted-foreground ml-1">({cacheRate}%)</span>}
            </div>
          </div>
        </div>

        {/* Returned */}
        <div className="flex items-center gap-2 p-2 rounded-md bg-background">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <div>
            <div className="text-muted-foreground">Retornados</div>
            <div className="font-semibold text-green-600">{stats.companiesReturned}</div>
          </div>
        </div>
      </div>

      {/* Filtering breakdown */}
      <div className="mt-3 pt-3 border-t border-dashed">
        <div className="flex flex-wrap gap-2 text-xs">
          <Badge variant="secondary" className="font-normal">
            <XCircle className="h-3 w-3 mr-1 text-red-400" />
            Sem dados: {stats.skippedNoData}
          </Badge>
          <Badge variant="secondary" className="font-normal">
            <XCircle className="h-3 w-3 mr-1 text-orange-400" />
            Inativos: {stats.skippedInactive}
          </Badge>
          <Badge variant="secondary" className="font-normal">
            <XCircle className="h-3 w-3 mr-1 text-yellow-400" />
            Local errado: {stats.skippedLocation}
          </Badge>
          {(stats.apiErrors.brasilapi > 0 || stats.apiErrors.cnpjws > 0) && (
            <Badge variant="destructive" className="font-normal">
              Erros API: {stats.apiErrors.brasilapi + stats.apiErrors.cnpjws}
            </Badge>
          )}
        </div>
      </div>

      {/* Success rate bar */}
      <div className="mt-3">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>Taxa de sucesso</span>
          <span>{successRate}%</span>
        </div>
        <Progress value={successRate} className="h-1.5" />
      </div>
    </Card>
  );
}