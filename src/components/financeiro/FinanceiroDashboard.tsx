import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/StatCard";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Wallet,
  AlertTriangle,
  CheckCircle2,
  Clock
} from "lucide-react";
import { Receivable } from "@/hooks/useReceivables";
import { Payable } from "@/hooks/usePayables";
import { differenceInDays } from "date-fns";

interface FinanceiroDashboardProps {
  receivables: Receivable[];
  payables: Payable[];
  selectedMonth: number;
  selectedYear: number;
}

export function FinanceiroDashboard({ 
  receivables, 
  payables,
  selectedMonth,
  selectedYear 
}: FinanceiroDashboardProps) {
  const metrics = useMemo(() => {
    const now = new Date();
    
    // Receivables metrics
    const totalReceivables = receivables.reduce((sum, r) => sum + r.value, 0);
    const paidReceivables = receivables.filter(r => r.status === "paid");
    const totalPaid = paidReceivables.reduce((sum, r) => sum + (r.paid_value || r.value), 0);
    const pendingReceivables = receivables.filter(r => r.status === "pending");
    const totalPending = pendingReceivables.reduce((sum, r) => sum + r.value, 0);
    const overdueReceivables = pendingReceivables.filter(r => new Date(r.due_date) < now);
    const totalOverdue = overdueReceivables.reduce((sum, r) => sum + r.value, 0);

    // Payables metrics
    const totalPayables = payables.reduce((sum, p) => sum + p.value, 0);
    const paidPayables = payables.filter(p => p.status === "paid");
    const totalPayablesPaid = paidPayables.reduce((sum, p) => sum + (p.paid_value || p.value), 0);
    const pendingPayables = payables.filter(p => p.status === "pending");
    const totalPayablesPending = pendingPayables.reduce((sum, p) => sum + p.value, 0);
    const overduePayables = pendingPayables.filter(p => new Date(p.due_date) < now);
    const totalPayablesOverdue = overduePayables.reduce((sum, p) => sum + p.value, 0);

    // Upcoming due (next 7 days)
    const upcomingReceivables = pendingReceivables.filter(r => {
      const daysUntilDue = differenceInDays(new Date(r.due_date), now);
      return daysUntilDue >= 0 && daysUntilDue <= 7;
    });
    const upcomingPayables = pendingPayables.filter(p => {
      const daysUntilDue = differenceInDays(new Date(p.due_date), now);
      return daysUntilDue >= 0 && daysUntilDue <= 7;
    });

    // Balance
    const expectedBalance = totalReceivables - totalPayables;
    const realizedBalance = totalPaid - totalPayablesPaid;

    return {
      totalReceivables,
      totalPaid,
      totalPending,
      totalOverdue,
      overdueReceivablesCount: overdueReceivables.length,
      totalPayables,
      totalPayablesPaid,
      totalPayablesPending,
      totalPayablesOverdue,
      overduePayablesCount: overduePayables.length,
      upcomingReceivablesCount: upcomingReceivables.length,
      upcomingPayablesCount: upcomingPayables.length,
      expectedBalance,
      realizedBalance,
    };
  }, [receivables, payables]);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="space-y-6">
      {/* Main KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="A Receber (Total)"
          value={formatCurrency(metrics.totalReceivables)}
          icon={TrendingUp}
          trend={`${receivables.length} lançamentos`}
          variant="success"
        />
        <StatCard
          title="A Pagar (Total)"
          value={formatCurrency(metrics.totalPayables)}
          icon={TrendingDown}
          trend={`${payables.length} lançamentos`}
          variant="destructive"
        />
        <StatCard
          title="Saldo Previsto"
          value={formatCurrency(metrics.expectedBalance)}
          icon={DollarSign}
          trend="Receitas - Despesas"
          variant={metrics.expectedBalance >= 0 ? "success" : "destructive"}
        />
        <StatCard
          title="Saldo Realizado"
          value={formatCurrency(metrics.realizedBalance)}
          icon={Wallet}
          trend="Pagos - Recebidos"
          variant={metrics.realizedBalance >= 0 ? "success" : "destructive"}
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Recebido</p>
              <p className="text-lg font-bold text-green-500">{formatCurrency(metrics.totalPaid)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">A Receber (Pendente)</p>
              <p className="text-lg font-bold text-blue-500">{formatCurrency(metrics.totalPending)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pago</p>
              <p className="text-lg font-bold text-orange-500">{formatCurrency(metrics.totalPayablesPaid)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">A Pagar (Pendente)</p>
              <p className="text-lg font-bold text-purple-500">{formatCurrency(metrics.totalPayablesPending)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Alerts */}
      {(metrics.overdueReceivablesCount > 0 || metrics.overduePayablesCount > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {metrics.overdueReceivablesCount > 0 && (
            <Card className="p-4 bg-destructive/10 border-destructive/30">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <div>
                  <p className="font-medium text-destructive">
                    {metrics.overdueReceivablesCount} conta(s) a receber vencida(s)
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Total: {formatCurrency(metrics.totalOverdue)}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {metrics.overduePayablesCount > 0 && (
            <Card className="p-4 bg-destructive/10 border-destructive/30">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <div>
                  <p className="font-medium text-destructive">
                    {metrics.overduePayablesCount} conta(s) a pagar vencida(s)
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Total: {formatCurrency(metrics.totalPayablesOverdue)}
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Upcoming Alerts */}
      {(metrics.upcomingReceivablesCount > 0 || metrics.upcomingPayablesCount > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {metrics.upcomingReceivablesCount > 0 && (
            <Card className="p-4 bg-blue-500/10 border-blue-500/30">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="font-medium text-blue-500">
                    {metrics.upcomingReceivablesCount} recebimento(s) nos próximos 7 dias
                  </p>
                </div>
              </div>
            </Card>
          )}

          {metrics.upcomingPayablesCount > 0 && (
            <Card className="p-4 bg-orange-500/10 border-orange-500/30">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="font-medium text-orange-500">
                    {metrics.upcomingPayablesCount} pagamento(s) nos próximos 7 dias
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
