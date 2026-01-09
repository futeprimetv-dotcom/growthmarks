import { useWeeklyDemandsData } from "@/hooks/useDashboardStats";
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
import { Skeleton } from "@/components/ui/skeleton";

export function WeeklyDemandsChart() {
  const { data: chartData, isLoading } = useWeeklyDemandsData();

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl border p-6">
        <Skeleton className="h-6 w-48 mb-4" />
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  const hasData = chartData && chartData.some(d => d.novas > 0 || d.concluidas > 0);

  return (
    <div className="bg-card rounded-xl border p-6">
      <h3 className="text-lg font-semibold mb-4">Demandas por Semana</h3>
      <div className="h-[300px]">
        {!hasData ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>Cadastre demandas para ver o gráfico</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="week" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Bar 
                dataKey="concluidas" 
                name="Concluídas"
                fill="hsl(var(--success))" 
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="novas" 
                name="Novas"
                fill="hsl(var(--primary))" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
