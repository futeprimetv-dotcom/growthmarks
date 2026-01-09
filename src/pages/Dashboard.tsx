import { StatCard } from "@/components/dashboard/StatCard";
import { UrgentDemandsList } from "@/components/dashboard/UrgentDemandsList";
import { TodayDeadlinesList } from "@/components/dashboard/TodayDeadlinesList";
import { WeeklyDemandsChart } from "@/components/dashboard/WeeklyDemandsChart";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { Users, Kanban, AlertTriangle, DollarSign, CheckCircle } from "lucide-react";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserRole } from "@/hooks/useUserRole";
import { Navigate } from "react-router-dom";

export default function Dashboard() {
  const { canViewDashboard, loading: roleLoading } = useUserRole();
  const { data: stats, isLoading } = useDashboardStats();

  if (roleLoading || isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
      </div>
    );
  }

  if (!canViewDashboard) {
    return <Navigate to="/producao" replace />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral do sistema</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Clientes Ativos"
          value={stats?.activeClients || 0}
          icon={Users}
        />
        <StatCard
          title="Demandas em Andamento"
          value={stats?.inProgressDemands || 0}
          icon={Kanban}
        />
        <StatCard
          title="Demandas Urgentes"
          value={stats?.urgentDemandsCount || 0}
          icon={AlertTriangle}
          variant="destructive"
        />
        <StatCard
          title="Faturamento Mensal"
          value={`R$ ${(stats?.totalRevenue || 0).toLocaleString('pt-BR')}`}
          icon={DollarSign}
          variant="success"
        />
        <StatCard
          title="Receita Líquida"
          value={`R$ ${(stats?.netRevenue || 0).toLocaleString('pt-BR')}`}
          icon={CheckCircle}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WeeklyDemandsChart />
        <RevenueChart />
      </div>

      {/* Quick Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UrgentDemandsList />
        <TodayDeadlinesList />
      </div>
    </div>
  );
}