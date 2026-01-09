import { Target, CheckCircle2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { useICPSettings } from "@/hooks/useICPSettings";
import { DEFAULT_ICP, isICPCustomized } from "@/config/icp";

export function ICPIndicator() {
  const { data: icpConfig, isLoading, isError } = useICPSettings();

  if (isLoading) {
    return <Skeleton className="h-8 w-32" />;
  }

  if (isError) {
    return (
      <Badge variant="destructive" className="gap-1.5">
        <AlertCircle className="h-3.5 w-3.5" />
        Erro ao carregar ICP
      </Badge>
    );
  }

  // Check if ICP is customized (different from default)
  const isCustomized = isICPCustomized(icpConfig);

  const segmentCount = icpConfig?.targetSegments?.length || 0;
  const stateCount = icpConfig?.targetStates?.length || 0;
  const sizeCount = icpConfig?.preferredSizes?.length || 0;
  const minTicket = icpConfig?.minTicket || 0;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant={isCustomized ? "default" : "secondary"} 
            className="gap-1.5 cursor-help transition-colors"
          >
            {isCustomized ? (
              <CheckCircle2 className="h-3.5 w-3.5" />
            ) : (
              <Target className="h-3.5 w-3.5" />
            )}
            ICP {isCustomized ? "Personalizado" : "Padrão"}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-2 text-sm">
            <p className="font-medium flex items-center gap-1.5">
              <Target className="h-4 w-4 text-primary" />
              Perfil de Cliente Ideal Ativo
            </p>
            <div className="space-y-1 text-muted-foreground">
              <p>
                <span className="font-medium text-foreground">{segmentCount}</span> segmentos alvo
              </p>
              <p>
                <span className="font-medium text-foreground">{stateCount}</span> estados selecionados
              </p>
              <p>
                <span className="font-medium text-foreground">{sizeCount}</span> portes de empresa
              </p>
              <p>
                Ticket mínimo: <span className="font-medium text-foreground">R$ {minTicket.toLocaleString()}</span>
              </p>
            </div>
            {icpConfig?.targetSegments && icpConfig.targetSegments.length > 0 && (
              <div className="pt-1 border-t">
                <p className="text-xs text-muted-foreground">
                  Segmentos: {icpConfig.targetSegments.slice(0, 5).join(", ")}
                  {icpConfig.targetSegments.length > 5 && ` +${icpConfig.targetSegments.length - 5}`}
                </p>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
