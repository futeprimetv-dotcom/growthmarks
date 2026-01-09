import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/StatCard";
import { ContractWithClient } from "@/hooks/useContracts";
import { DollarSign, FileText, AlertTriangle, CheckCircle2, Clock, XCircle, RefreshCw } from "lucide-react";
import { differenceInDays, addDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface ContractsDashboardProps {
  contracts: ContractWithClient[];
}

export function ContractsDashboard({ contracts }: ContractsDashboardProps) {
  const metrics = useMemo(() => {
    const activeContracts = contracts.filter(c => c.status === "active");
    const now = new Date();
    
    // Total value (monthly recurring)
    const totalMonthlyValue = activeContracts.reduce((sum, contract) => {
      const multipliers: Record<string, number> = {
        mensal: 1,
        trimestral: 1/3,
        semestral: 1/6,
        anual: 1/12,
        projeto: 0,
      };
      return sum + (contract.value * (multipliers[contract.type] || 0));
    }, 0);

    // Total annual value
    const totalAnnualValue = activeContracts.reduce((sum, contract) => {
      const multipliers: Record<string, number> = {
        mensal: 12,
        trimestral: 4,
        semestral: 2,
        anual: 1,
        projeto: 1,
      };
      return sum + (contract.value * (multipliers[contract.type] || 1));
    }, 0);

    // Pending renewals (ending in next 30 days)
    const pendingRenewals = activeContracts.filter(contract => {
      if (!contract.end_date) return false;
      const endDate = new Date(contract.end_date);
      const daysUntilEnd = differenceInDays(endDate, now);
      return daysUntilEnd >= 0 && daysUntilEnd <= 30;
    });

    // Expired contracts
    const expiredContracts = contracts.filter(contract => {
      if (!contract.end_date) return false;
      return new Date(contract.end_date) < now && contract.status === "active";
    });

    // Signed vs pending signature
    const signedContracts = contracts.filter(c => (c as any).signature_status === "signed");
    const pendingSignature = contracts.filter(c => (c as any).signature_status === "sent");

    // Status breakdown
    const statusCounts = {
      active: contracts.filter(c => c.status === "active").length,
      pending: contracts.filter(c => c.status === "pending").length,
      expired: contracts.filter(c => c.status === "expired").length,
      cancelled: contracts.filter(c => c.status === "cancelled").length,
    };

    // Type breakdown
    const typeCounts: Record<string, number> = {};
    contracts.forEach(contract => {
      typeCounts[contract.type] = (typeCounts[contract.type] || 0) + 1;
    });

    return {
      totalContracts: contracts.length,
      activeContracts: activeContracts.length,
      totalMonthlyValue,
      totalAnnualValue,
      pendingRenewals,
      expiredContracts,
      signedContracts: signedContracts.length,
      pendingSignature: pendingSignature.length,
      statusCounts,
      typeCounts,
    };
  }, [contracts]);

  const statusChartData = [
    { name: "Ativos", value: metrics.statusCounts.active, color: "hsl(var(--success))" },
    { name: "Pendentes", value: metrics.statusCounts.pending, color: "hsl(var(--warning))" },
    { name: "Expirados", value: metrics.statusCounts.expired, color: "hsl(var(--destructive))" },
    { name: "Cancelados", value: metrics.statusCounts.cancelled, color: "hsl(var(--muted))" },
  ].filter(item => item.value > 0);

  const typeChartData = Object.entries(metrics.typeCounts).map(([type, count]) => ({
    name: type.charAt(0).toUpperCase() + type.slice(1),
    quantidade: count,
  }));

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="space-y-6">
      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Receita Mensal (MRR)"
          value={formatCurrency(metrics.totalMonthlyValue)}
          icon={DollarSign}
          trend={`${metrics.activeContracts} contratos ativos`}
          variant="success"
        />
        <StatCard
          title="Receita Anual (ARR)"
          value={formatCurrency(metrics.totalAnnualValue)}
          icon={FileText}
          trend="Projeção anual"
        />
        <StatCard
          title="Renovações Pendentes"
          value={metrics.pendingRenewals.length}
          icon={RefreshCw}
          trend="Próximos 30 dias"
          variant={metrics.pendingRenewals.length > 0 ? "destructive" : "default"}
        />
        <StatCard
          title="Contratos Vencidos"
          value={metrics.expiredContracts.length}
          icon={AlertTriangle}
          trend="Requerem atenção"
          variant={metrics.expiredContracts.length > 0 ? "destructive" : "default"}
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Contratos Assinados</p>
              <p className="text-2xl font-bold">{metrics.signedContracts}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Clock className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Aguardando Assinatura</p>
              <p className="text-2xl font-bold">{metrics.pendingSignature}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total de Contratos</p>
              <p className="text-2xl font-bold">{metrics.totalContracts}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Contratos por Status</h3>
          {statusChartData.length > 0 ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              Nenhum contrato para exibir
            </div>
          )}
        </Card>

        {/* Type Distribution */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Contratos por Tipo</h3>
          {typeChartData.length > 0 ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={typeChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="quantidade" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              Nenhum contrato para exibir
            </div>
          )}
        </Card>
      </div>

      {/* Pending Renewals List */}
      {metrics.pendingRenewals.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Renovações Pendentes (Próximos 30 dias)
          </h3>
          <div className="space-y-3">
            {metrics.pendingRenewals.map(contract => {
              const endDate = new Date(contract.end_date!);
              const daysLeft = differenceInDays(endDate, new Date());
              
              return (
                <div
                  key={contract.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-destructive/5 border border-destructive/20"
                >
                  <div>
                    <p className="font-medium">{contract.client?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Vence em {format(endDate, "dd 'de' MMMM", { locale: ptBR })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-destructive">
                      {daysLeft === 0 ? "Vence hoje!" : `${daysLeft} dias`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(contract.value)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
