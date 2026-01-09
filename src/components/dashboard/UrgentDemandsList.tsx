import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useClients } from "@/hooks/useClients";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { PriorityBadge } from "@/components/ui/priority-badge";
import { Clock, User, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function UrgentDemandsList() {
  const { data: stats, isLoading: loadingStats } = useDashboardStats();
  const { data: clients } = useClients();
  const { data: teamMembers } = useTeamMembers();

  const getClientName = (clientId: string) => {
    return clients?.find(c => c.id === clientId)?.name || "Cliente não encontrado";
  };

  const getTeamMemberName = (memberId: string | null) => {
    if (!memberId) return "Não atribuído";
    return teamMembers?.find(m => m.id === memberId)?.name || "Não encontrado";
  };

  if (loadingStats) {
    return (
      <div className="bg-card rounded-xl border p-6">
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  const urgentDemands = stats?.urgentDemands || [];

  return (
    <div className="bg-card rounded-xl border p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
        Demandas Urgentes
      </h3>
      <div className="space-y-3">
        {urgentDemands.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <AlertCircle className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">Nenhuma demanda urgente</p>
          </div>
        ) : (
          urgentDemands.map((demand) => (
            <div
              key={demand.id}
              className="p-4 rounded-lg bg-destructive/5 border border-destructive/20 hover:bg-destructive/10 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{demand.title}</p>
                  <p className="text-sm text-muted-foreground">{getClientName(demand.client_id)}</p>
                </div>
                <PriorityBadge priority="urgent" />
              </div>
              <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {getTeamMemberName(demand.assigned_to)}
                </span>
                {demand.deadline && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(demand.deadline).toLocaleDateString('pt-BR')}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
