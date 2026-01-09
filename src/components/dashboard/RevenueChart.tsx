import { useRevenueChartData } from "@/hooks/useDashboardStats";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserRole } from "@/hooks/useUserRole";
import { Lock } from "lucide-react";

export function RevenueChart() {
  const { data: chartData, isLoading } = useRevenueChartData();
  const { canViewValues } = useUserRole();

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl border p-6">
        <Skeleton className="h-6 w-48 mb-4" />
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  // Don't show revenue chart to users without permission
  if (!canViewValues) {
    return (
      <div className="bg-card rounded-xl border p-6">
        <h3 className="text-lg font-semibold mb-4">Evolução de Faturamento</h3>
        <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground">
          <Lock className="h-12 w-12 mb-4" />
          <p>Você não tem permissão para visualizar dados financeiros</p>
        </div>
      </div>
    );
  }

  const hasData = chartData && chartData.some(d => d.valor > 0);

  return (
    <div className="bg-card rounded-xl border p-6">
      <h3 className="text-lg font-semibold mb-4">Evolução de Faturamento</h3>
      <div className="h-[300px]">
        {!hasData ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>Cadastre serviços e clientes para ver o gráfico</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
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
                formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Valor']}
              />
              <Line
                type="monotone"
                dataKey="valor"
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                dot={{ fill: "hsl(var(--primary))", strokeWidth: 2 }}
                activeDot={{ r: 6, fill: "hsl(var(--primary))" }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
