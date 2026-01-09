import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useClients } from "@/hooks/useClients";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { PriorityBadge } from "@/components/ui/priority-badge";
import { Calendar, User, CheckCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function TodayDeadlinesList() {
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

  const nearDeadlines = stats?.nearDeadlineDemands || [];

  return (
    <div className="bg-card rounded-xl border p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Calendar className="h-5 w-5 text-warning" />
        Prazo Vencendo
      </h3>
      <div className="space-y-3">
        {nearDeadlines.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <CheckCircle className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">Nenhuma demanda com prazo próximo</p>
          </div>
        ) : (
          nearDeadlines.slice(0, 5).map((demand) => (
            <div
              key={demand.id}
              className="p-4 rounded-lg bg-secondary/50 border hover:bg-secondary transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{demand.title}</p>
                  <p className="text-sm text-muted-foreground">{getClientName(demand.client_id)}</p>
                </div>
                <PriorityBadge priority={demand.priority} />
              </div>
              <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {getTeamMemberName(demand.assigned_to)}
                </span>
                {demand.deadline && (
                  <span className="flex items-center gap-1 text-warning">
                    <Calendar className="h-3 w-3" />
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
