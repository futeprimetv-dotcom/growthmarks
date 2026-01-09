import { useState } from "react";
import { LeadsList } from "@/components/comercial/LeadsList";
import { LeadRemindersAlert } from "@/components/comercial/LeadRemindersAlert";
import { FunnelSelector } from "@/components/comercial/FunnelSelector";

export default function Leads() {
  const [selectedFunnelId, setSelectedFunnelId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Leads</h1>
          <p className="text-muted-foreground">Gerencie seus leads e oportunidades</p>
        </div>
        <FunnelSelector
          selectedFunnelId={selectedFunnelId}
          onSelectFunnel={setSelectedFunnelId}
        />
      </div>

      <LeadRemindersAlert />

      <LeadsList funnelId={selectedFunnelId} />
    </div>
  );
}
