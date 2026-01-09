import { useMemo } from "react";
import { useLeads } from "@/hooks/useLeads";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingDown, ArrowRight } from "lucide-react";

const funnelStages = [
  { key: "novo", label: "Novo", color: "bg-blue-500" },
  { key: "contato_inicial", label: "Contato Inicial", color: "bg-cyan-500" },
  { key: "reuniao_agendada", label: "Reunião Agendada", color: "bg-purple-500" },
  { key: "proposta_enviada", label: "Proposta Enviada", color: "bg-orange-500" },
  { key: "negociacao", label: "Negociação", color: "bg-amber-500" },
  { key: "fechamento", label: "Fechamento", color: "bg-green-500" },
];

export function SalesFunnel() {
  const { data: leads, isLoading } = useLeads();
  
  const funnelData = useMemo(() => {
    if (!leads) return [];
    
    const activeLeads = leads.filter(l => l.status !== "perdido" && !l.is_archived);
    
    return funnelStages.map((stage, index) => {
      const count = activeLeads.filter(l => l.status === stage.key).length;
      const value = activeLeads
        .filter(l => l.status === stage.key)
        .reduce((sum, l) => sum + (l.estimated_value || 0), 0);
      
      // Calculate conversion rate from previous stage
      let conversionRate = 100;
      if (index > 0) {
        const prevStageCount = activeLeads.filter(l => l.status === funnelStages[index - 1].key).length;
        conversionRate = prevStageCount > 0 ? Math.round((count / prevStageCount) * 100) : 0;
      }
      
      return {
        ...stage,
        count,
        value,
        conversionRate,
      };
    });
  }, [leads]);

  const totalLeads = funnelData.reduce((sum, stage) => sum + stage.count, 0);
  const maxCount = Math.max(...funnelData.map(s => s.count), 1);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5" />
            Funil de Vendas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingDown className="h-5 w-5" />
          Funil de Vendas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {funnelData.map((stage, index) => {
            const widthPercent = totalLeads > 0 ? Math.max((stage.count / maxCount) * 100, 10) : 10;
            
            return (
              <div key={stage.key} className="relative">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{stage.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">{stage.count}</span>
                        {index > 0 && stage.conversionRate < 100 && (
                          <span className="text-xs text-muted-foreground">
                            ({stage.conversionRate}%)
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="h-8 bg-secondary rounded-md overflow-hidden">
                      <div 
                        className={`h-full ${stage.color} transition-all duration-500 flex items-center justify-end pr-2`}
                        style={{ width: `${widthPercent}%` }}
                      >
                        {stage.value > 0 && (
                          <span className="text-xs text-white font-medium">
                            R$ {(stage.value / 1000).toFixed(0)}k
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Arrow between stages */}
                {index < funnelData.length - 1 && (
                  <div className="flex justify-center my-1">
                    <ArrowRight className="h-4 w-4 text-muted-foreground rotate-90" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {totalLeads === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <TrendingDown className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum lead no funil</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
