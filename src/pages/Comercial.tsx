import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SalesPipeline } from "@/components/comercial/SalesPipeline";
import { LeadsList } from "@/components/comercial/LeadsList";
import { ComercialMetrics } from "@/components/comercial/ComercialMetrics";
import { LeadRemindersAlert } from "@/components/comercial/LeadRemindersAlert";
import { SalesFunnel } from "@/components/comercial/SalesFunnel";
import { FunnelSelector } from "@/components/comercial/FunnelSelector";
import { Target, List, BarChart3 } from "lucide-react";

export default function Comercial() {
  const [activeTab, setActiveTab] = useState("pipeline");
  const [selectedFunnelId, setSelectedFunnelId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Comercial</h1>
          <p className="text-muted-foreground">CRM e prospecção de clientes</p>
        </div>
        <FunnelSelector
          selectedFunnelId={selectedFunnelId}
          onSelectFunnel={setSelectedFunnelId}
        />
      </div>

      <LeadRemindersAlert />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="pipeline" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Pipeline
          </TabsTrigger>
          <TabsTrigger value="leads" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Leads
          </TabsTrigger>
          <TabsTrigger value="metricas" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Métricas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline" className="space-y-6">
          <SalesPipeline funnelId={selectedFunnelId} />
        </TabsContent>

        <TabsContent value="leads" className="space-y-6">
          <LeadsList funnelId={selectedFunnelId} />
        </TabsContent>

        <TabsContent value="metricas" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ComercialMetrics funnelId={selectedFunnelId} />
            </div>
            <div>
              <SalesFunnel funnelId={selectedFunnelId} />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
