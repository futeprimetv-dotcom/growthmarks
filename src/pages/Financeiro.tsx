import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ServicosTab } from "@/components/financeiro/ServicosTab";
import { ProdutosTab } from "@/components/financeiro/ProdutosTab";
import { DespesasTab } from "@/components/financeiro/DespesasTab";
import { FluxoCaixaTab } from "@/components/financeiro/FluxoCaixaTab";
import { DollarSign, Package, Wallet, PieChart } from "lucide-react";

export default function Financeiro() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Financeiro</h1>
        <p className="text-muted-foreground">Acompanhe receitas, despesas e fluxo de caixa</p>
      </div>

      <Tabs defaultValue="fluxo" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="fluxo" className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            <span className="hidden sm:inline">Fluxo de Caixa</span>
            <span className="sm:hidden">Fluxo</span>
          </TabsTrigger>
          <TabsTrigger value="servicos" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">Serviços</span>
            <span className="sm:hidden">Serv.</span>
          </TabsTrigger>
          <TabsTrigger value="produtos" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Produtos</span>
            <span className="sm:hidden">Prod.</span>
          </TabsTrigger>
          <TabsTrigger value="despesas" className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            <span className="hidden sm:inline">Despesas</span>
            <span className="sm:hidden">Desp.</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="fluxo" className="mt-6">
          <FluxoCaixaTab />
        </TabsContent>

        <TabsContent value="servicos" className="mt-6">
          <ServicosTab />
        </TabsContent>

        <TabsContent value="produtos" className="mt-6">
          <ProdutosTab />
        </TabsContent>

        <TabsContent value="despesas" className="mt-6">
          <DespesasTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
