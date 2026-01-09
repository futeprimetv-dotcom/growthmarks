import { useState } from "react";
import { SalesPipeline } from "@/components/comercial/SalesPipeline";
import { LeadRemindersAlert } from "@/components/comercial/LeadRemindersAlert";
import { FunnelSelector } from "@/components/comercial/FunnelSelector";

export default function CRM() {
  const [selectedFunnelId, setSelectedFunnelId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Pipeline de Vendas</h1>
          <p className="text-muted-foreground">Gerencie seu funil de vendas</p>
        </div>
        <FunnelSelector
          selectedFunnelId={selectedFunnelId}
          onSelectFunnel={setSelectedFunnelId}
        />
      </div>

      <LeadRemindersAlert />

      <SalesPipeline funnelId={selectedFunnelId} />
    </div>
  );
}
