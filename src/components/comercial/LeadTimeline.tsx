import { useMemo } from "react";
import { useLeadHistory } from "@/hooks/useLeadHistory";
import { useLeadActivities } from "@/hooks/useLeadActivities";
import { Lead } from "@/hooks/useLeads";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { 
  Phone, Mail, Video, MessageSquare, ArrowRight, 
  Users, Calendar, FileText, CheckSquare, Clock,
  TrendingUp, AlertCircle, Check
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface LeadTimelineProps {
  lead: Lead;
}

interface TimelineItem {
  id: string;
  type: "history" | "activity";
  date: Date;
  actionType: string;
  title: string;
  description?: string | null;
  channel?: string | null;
  createdBy?: string | null;
  isCompleted?: boolean;
}

const actionIcons: Record<string, React.ElementType> = {
  ligacao: Phone,
  whatsapp: MessageSquare,
  email: Mail,
  reuniao: Video,
  proposta: FileText,
  follow_up: ArrowRight,
  qualificacao: Users,
  tarefa: CheckSquare,
  outro: Calendar,
};

const actionColors: Record<string, string> = {
  ligacao: "bg-blue-100 text-blue-600 dark:bg-blue-900/30",
  whatsapp: "bg-green-100 text-green-600 dark:bg-green-900/30",
  email: "bg-purple-100 text-purple-600 dark:bg-purple-900/30",
  reuniao: "bg-orange-100 text-orange-600 dark:bg-orange-900/30",
  proposta: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30",
  follow_up: "bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30",
  qualificacao: "bg-pink-100 text-pink-600 dark:bg-pink-900/30",
  tarefa: "bg-amber-100 text-amber-600 dark:bg-amber-900/30",
  outro: "bg-gray-100 text-gray-600 dark:bg-gray-800/50",
};

const actionLabels: Record<string, string> = {
  ligacao: "Ligação",
  whatsapp: "WhatsApp",
  email: "Email",
  reuniao: "Reunião",
  proposta: "Proposta Enviada",
  follow_up: "Follow-up",
  qualificacao: "Qualificação",
  tarefa: "Tarefa",
  outro: "Outro",
};

export function LeadTimeline({ lead }: LeadTimelineProps) {
  const { data: history, isLoading: loadingHistory } = useLeadHistory(lead.id);
  const { data: activities, isLoading: loadingActivities } = useLeadActivities(lead.id);
  const { data: teamMembers } = useTeamMembers();
  
  const timelineItems = useMemo(() => {
    const items: TimelineItem[] = [];
    
    // Add history items
    history?.forEach(h => {
      items.push({
        id: `history-${h.id}`,
        type: "history",
        date: new Date(h.created_at),
        actionType: h.action_type,
        title: actionLabels[h.action_type] || h.action_type,
        description: h.description,
        channel: h.contact_channel,
        createdBy: h.created_by,
      });
    });
    
    // Add completed activities
    activities?.filter(a => a.completed_at).forEach(a => {
      items.push({
        id: `activity-${a.id}`,
        type: "activity",
        date: new Date(a.completed_at!),
        actionType: a.type,
        title: a.title,
        description: a.description,
        createdBy: a.created_by,
        isCompleted: true,
      });
    });
    
    // Sort by date descending
    return items.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [history, activities]);

  const getTeamMemberName = (userId: string | null) => {
    if (!userId) return "Sistema";
    const member = teamMembers?.find(m => m.user_id === userId);
    return member?.name || "Usuário";
  };

  const isLoading = loadingHistory || loadingActivities;

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (timelineItems.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Nenhuma atividade registrada</p>
        <p className="text-sm">O histórico aparecerá aqui</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {timelineItems.map((item, index) => {
        const Icon = actionIcons[item.actionType] || Calendar;
        const colorClass = actionColors[item.actionType] || actionColors.outro;
        
        return (
          <div key={item.id} className="relative pl-10">
            {/* Timeline line */}
            {index < timelineItems.length - 1 && (
              <div className="absolute left-4 top-10 bottom-0 w-px bg-border" />
            )}
            
            {/* Timeline dot/icon */}
            <div className={cn(
              "absolute left-0 top-1 w-8 h-8 rounded-full flex items-center justify-center",
              colorClass
            )}>
              <Icon className="h-4 w-4" />
            </div>
            
            <div className="p-3 border rounded-lg bg-card hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{item.title}</span>
                  {item.type === "activity" && (
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                      <Check className="h-3 w-3 mr-1" />
                      Concluída
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                  {format(item.date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </span>
              </div>
              
              {item.description && (
                <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
              )}
              
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {item.channel && (
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    {item.channel}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {getTeamMemberName(item.createdBy)}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
