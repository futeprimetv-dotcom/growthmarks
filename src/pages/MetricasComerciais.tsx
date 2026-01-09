import { useState } from "react";
import { ComercialMetrics } from "@/components/comercial/ComercialMetrics";
import { SalesFunnel } from "@/components/comercial/SalesFunnel";
import { FunnelSelector } from "@/components/comercial/FunnelSelector";

export default function MetricasComerciais() {
  const [selectedFunnelId, setSelectedFunnelId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Métricas Comerciais</h1>
          <p className="text-muted-foreground">Análise de desempenho de vendas</p>
        </div>
        <FunnelSelector
          selectedFunnelId={selectedFunnelId}
          onSelectFunnel={setSelectedFunnelId}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ComercialMetrics funnelId={selectedFunnelId} />
        </div>
        <div>
          <SalesFunnel funnelId={selectedFunnelId} />
        </div>
      </div>
    </div>
  );
}
