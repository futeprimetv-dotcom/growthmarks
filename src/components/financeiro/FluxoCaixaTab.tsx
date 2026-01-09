import { useServices } from "@/hooks/useServices";
import { useExpenses } from "@/hooks/useExpenses";
import { useClients } from "@/hooks/useClients";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Laptop,
  Users,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export function FluxoCaixaTab() {
  const { data: services, isLoading: loadingServices } = useServices();
  const { data: expenses, isLoading: loadingExpenses } = useExpenses();
  const { data: clients, isLoading: loadingClients } = useClients();

  const isLoading = loadingServices || loadingExpenses || loadingClients;

  // Calculate totals
  const serviceRevenue = services?.filter(s => s.status === 'active').reduce((sum, s) => sum + (s.monthly_value || 0), 0) || 0;
  const clientRevenue = clients?.filter(c => c.status === 'active').reduce((sum, c) => sum + (c.monthly_value || 0), 0) || 0;
  const totalRevenue = serviceRevenue + clientRevenue;

  const totalExpenses = expenses?.reduce((sum, e) => sum + (e.value || 0), 0) || 0;
  const operationalCosts = expenses?.filter(e => e.category === 'custo_operacional').reduce((sum, e) => sum + (e.value || 0), 0) || 0;
  const personnelCosts = expenses?.filter(e => e.category === 'despesa').reduce((sum, e) => sum + (e.value || 0), 0) || 0;

  const netRevenue = totalRevenue - totalExpenses;

  // Generate monthly comparison data (simplified - using current month values)
  const monthlyComparisonData = [
    { month: 'Jan', receitas: totalRevenue * 0.8, despesas: totalExpenses * 0.9, lucro: (totalRevenue * 0.8) - (totalExpenses * 0.9) },
    { month: 'Fev', receitas: totalRevenue * 0.85, despesas: totalExpenses * 0.95, lucro: (totalRevenue * 0.85) - (totalExpenses * 0.95) },
    { month: 'Mar', receitas: totalRevenue * 0.9, despesas: totalExpenses, lucro: (totalRevenue * 0.9) - totalExpenses },
    { month: 'Abr', receitas: totalRevenue * 0.95, despesas: totalExpenses, lucro: (totalRevenue * 0.95) - totalExpenses },
    { month: 'Mai', receitas: totalRevenue, despesas: totalExpenses, lucro: netRevenue },
    { month: 'Jun', receitas: totalRevenue, despesas: totalExpenses, lucro: netRevenue },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 bg-success/10 border-success/20">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-success/20">
              <TrendingUp className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Entradas</p>
              <p className="text-2xl font-bold text-success">
                R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-destructive/10 border-destructive/20">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-destructive/20">
              <TrendingDown className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Saídas</p>
              <p className="text-2xl font-bold text-destructive">
                R$ {totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-primary/10 border-primary/20">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-primary/20">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Receita Líquida</p>
              <p className={`text-2xl font-bold ${netRevenue >= 0 ? 'text-success' : 'text-destructive'}`}>
                R$ {netRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue & Expenses Breakdown */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Composição</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Entradas</p>
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-success/10">
                  <DollarSign className="h-5 w-5 text-success" />
                  <div className="flex-1">
                    <p className="font-medium">Serviços Recorrentes</p>
                  </div>
                  <p className="font-semibold text-success">
                    R$ {serviceRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-success/10">
                  <DollarSign className="h-5 w-5 text-success" />
                  <div className="flex-1">
                    <p className="font-medium">Mensalidades de Clientes</p>
                  </div>
                  <p className="font-semibold text-success">
                    R$ {clientRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">Saídas</p>
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-500/10">
                  <Laptop className="h-5 w-5 text-blue-400" />
                  <div className="flex-1">
                    <p className="font-medium">Custos Operacionais</p>
                  </div>
                  <p className="font-semibold text-blue-400">
                    R$ {operationalCosts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-500/10">
                  <Users className="h-5 w-5 text-purple-400" />
                  <div className="flex-1">
                    <p className="font-medium">Despesas (Pessoas)</p>
                  </div>
                  <p className="font-semibold text-purple-400">
                    R$ {personnelCosts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Summary */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Resumo Mensal</h3>
          {totalRevenue === 0 && totalExpenses === 0 ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground">
              <p>Cadastre serviços e despesas para ver o resumo</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-secondary/50">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-muted-foreground">Receita Bruta</span>
                  <span className="font-semibold text-success">
                    + R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-muted-foreground">Despesas</span>
                  <span className="font-semibold text-destructive">
                    - R$ {totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Lucro Líquido</span>
                    <span className={`text-xl font-bold ${netRevenue >= 0 ? 'text-success' : 'text-destructive'}`}>
                      R$ {netRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-primary/10">
                <p className="text-sm text-muted-foreground mb-1">Margem de Lucro</p>
                <p className="text-2xl font-bold text-primary">
                  {totalRevenue > 0 ? ((netRevenue / totalRevenue) * 100).toFixed(1) : 0}%
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Monthly Comparison Chart */}
      {(totalRevenue > 0 || totalExpenses > 0) && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Comparativo Mensal (Projeção)</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyComparisonData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="month" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number, name: string) => [
                    `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                    name === 'receitas' ? 'Receitas' : name === 'despesas' ? 'Despesas' : 'Lucro'
                  ]}
                />
                <Legend 
                  formatter={(value) => value === 'receitas' ? 'Receitas' : value === 'despesas' ? 'Despesas' : 'Lucro'}
                />
                <Bar dataKey="receitas" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="despesas" fill="hsl(0, 72%, 51%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="lucro" fill="hsl(22, 95%, 53%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}
    </div>
  );
}
