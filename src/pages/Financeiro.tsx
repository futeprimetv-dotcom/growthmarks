import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ServicosTab } from "@/components/financeiro/ServicosTab";
import { ProdutosTab } from "@/components/financeiro/ProdutosTab";
import { DespesasTab } from "@/components/financeiro/DespesasTab";
import { FluxoCaixaTab } from "@/components/financeiro/FluxoCaixaTab";
import { ContasReceberTab } from "@/components/financeiro/ContasReceberTab";
import { ContasPagarTab } from "@/components/financeiro/ContasPagarTab";
import { FinanceiroDashboard } from "@/components/financeiro/FinanceiroDashboard";
import { PeriodSelector } from "@/components/financeiro/PeriodSelector";
import { useReceivables } from "@/hooks/useReceivables";
import { usePayables } from "@/hooks/usePayables";
import { 
  DollarSign, 
  Package, 
  Wallet, 
  PieChart, 
  TrendingUp, 
  TrendingDown,
  LayoutDashboard
} from "lucide-react";

export default function Financeiro() {
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());

  const { data: receivables = [] } = useReceivables(selectedMonth, selectedYear);
  const { data: payables = [] } = usePayables(selectedMonth, selectedYear);

  const handlePeriodChange = (month: number, year: number) => {
    setSelectedMonth(month);
    setSelectedYear(year);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Financeiro</h1>
          <p className="text-muted-foreground">Acompanhe receitas, despesas e fluxo de caixa</p>
        </div>
        <PeriodSelector 
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onPeriodChange={handlePeriodChange}
        />
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-7 lg:w-auto lg:inline-grid">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="receber" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">A Receber</span>
            <span className="sm:hidden">Receber</span>
          </TabsTrigger>
          <TabsTrigger value="pagar" className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4" />
            <span className="hidden sm:inline">A Pagar</span>
            <span className="sm:hidden">Pagar</span>
          </TabsTrigger>
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

        <TabsContent value="dashboard" className="mt-6">
          <FinanceiroDashboard 
            receivables={receivables}
            payables={payables}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
          />
        </TabsContent>

        <TabsContent value="receber" className="mt-6">
          <ContasReceberTab 
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
          />
        </TabsContent>

        <TabsContent value="pagar" className="mt-6">
          <ContasPagarTab 
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
          />
        </TabsContent>

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
