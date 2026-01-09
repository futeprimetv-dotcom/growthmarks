import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLeadsWithPendingActions, useOverdueLeads } from "@/hooks/useLeadReminders";
import { useOverdueActivities } from "@/hooks/useLeadActivities";
import { Bell, AlertTriangle, ChevronDown, ChevronUp, Calendar, Clock } from "lucide-react";
import { useState } from "react";
import { format, isToday, isPast, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface LeadRemindersAlertProps {
  onLeadClick?: (leadId: string) => void;
}

export function LeadRemindersAlert({ onLeadClick }: LeadRemindersAlertProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const { data: pendingLeads } = useLeadsWithPendingActions();
  const { data: overdueLeads } = useOverdueLeads();
  const { data: overdueActivities } = useOverdueActivities();
  
  const todayLeads = pendingLeads?.filter(lead => 
    lead.next_action_date && isToday(parseISO(lead.next_action_date))
  ) || [];
  
  const overdueCount = (overdueLeads?.length || 0) + (overdueActivities?.length || 0);
  const todayCount = todayLeads.length;
  
  if (overdueCount === 0 && todayCount === 0) {
    return null;
  }

  return (
    <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
      <div className="flex items-start gap-3">
        <Bell className="h-5 w-5 text-amber-600 mt-0.5" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <AlertTitle className="text-amber-800 dark:text-amber-200 flex items-center gap-2">
              Lembretes de Follow-up
              {overdueCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {overdueCount} atrasado{overdueCount > 1 ? "s" : ""}
                </Badge>
              )}
              {todayCount > 0 && (
                <Badge className="bg-amber-500 text-white text-xs">
                  {todayCount} para hoje
                </Badge>
              )}
            </AlertTitle>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 w-6 p-0"
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
          
          {isExpanded && (
            <AlertDescription className="text-amber-700 dark:text-amber-300">
              <div className="space-y-3 mt-2">
                {/* Overdue leads */}
                {overdueLeads && overdueLeads.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold flex items-center gap-1 text-red-600">
                      <AlertTriangle className="h-3 w-3" />
                      Ações atrasadas:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {overdueLeads.slice(0, 5).map(lead => (
                        <Button
                          key={lead.id}
                          variant="outline"
                          size="sm"
                          className="h-auto py-1 px-2 text-xs border-red-200 hover:bg-red-50"
                          onClick={() => onLeadClick?.(lead.id)}
                        >
                          <Clock className="h-3 w-3 mr-1 text-red-500" />
                          {lead.name}
                          {lead.next_action && (
                            <span className="ml-1 text-muted-foreground">
                              - {lead.next_action}
                            </span>
                          )}
                        </Button>
                      ))}
                      {overdueLeads.length > 5 && (
                        <Badge variant="outline" className="text-xs">
                          +{overdueLeads.length - 5} mais
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Today's leads */}
                {todayLeads.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Para hoje:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {todayLeads.slice(0, 5).map(lead => (
                        <Button
                          key={lead.id}
                          variant="outline"
                          size="sm"
                          className="h-auto py-1 px-2 text-xs"
                          onClick={() => onLeadClick?.(lead.id)}
                        >
                          {lead.name}
                          {lead.next_action && (
                            <span className="ml-1 text-muted-foreground">
                              - {lead.next_action}
                            </span>
                          )}
                        </Button>
                      ))}
                      {todayLeads.length > 5 && (
                        <Badge variant="outline" className="text-xs">
                          +{todayLeads.length - 5} mais
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Overdue activities */}
                {overdueActivities && overdueActivities.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold flex items-center gap-1 text-red-600">
                      <AlertTriangle className="h-3 w-3" />
                      Atividades atrasadas:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {overdueActivities.slice(0, 5).map(activity => (
                        <Button
                          key={activity.id}
                          variant="outline"
                          size="sm"
                          className="h-auto py-1 px-2 text-xs border-red-200 hover:bg-red-50"
                          onClick={() => onLeadClick?.(activity.lead_id)}
                        >
                          <Clock className="h-3 w-3 mr-1 text-red-500" />
                          {activity.leads?.name} - {activity.title}
                        </Button>
                      ))}
                      {overdueActivities.length > 5 && (
                        <Badge variant="outline" className="text-xs">
                          +{overdueActivities.length - 5} mais
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </AlertDescription>
          )}
        </div>
      </div>
    </Alert>
  );
}
