import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  useLeadActivities, 
  useCreateLeadActivity, 
  useCompleteLeadActivity,
  useDeleteLeadActivity 
} from "@/hooks/useLeadActivities";
import { Lead } from "@/hooks/useLeads";
import { 
  Phone, Mail, Calendar, Plus, Video, 
  MessageSquare, CheckSquare, Trash2, Check, Clock
} from "lucide-react";
import { format, isPast, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface LeadActivitiesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead | null;
}

const activityTypes = [
  { value: "ligacao", label: "Ligação", icon: Phone },
  { value: "email", label: "Email", icon: Mail },
  { value: "reuniao", label: "Reunião", icon: Video },
  { value: "whatsapp", label: "WhatsApp", icon: MessageSquare },
  { value: "tarefa", label: "Tarefa", icon: CheckSquare },
];

export function LeadActivitiesDialog({ open, onOpenChange, lead }: LeadActivitiesDialogProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newActivity, setNewActivity] = useState({
    type: "tarefa",
    title: "",
    description: "",
    scheduled_at: "",
    reminder_at: "",
  });
  
  const { data: activities, isLoading } = useLeadActivities(lead?.id);
  const createActivity = useCreateLeadActivity();
  const completeActivity = useCompleteLeadActivity();
  const deleteActivity = useDeleteLeadActivity();

  const handleAddActivity = async () => {
    if (!lead?.id || !newActivity.title) return;
    
    await createActivity.mutateAsync({
      lead_id: lead.id,
      type: newActivity.type,
      title: newActivity.title,
      description: newActivity.description || null,
      scheduled_at: newActivity.scheduled_at ? new Date(newActivity.scheduled_at).toISOString() : null,
      reminder_at: newActivity.reminder_at ? new Date(newActivity.reminder_at).toISOString() : null,
    });
    
    setNewActivity({ type: "tarefa", title: "", description: "", scheduled_at: "", reminder_at: "" });
    setShowAddForm(false);
  };

  const handleComplete = async (activityId: string) => {
    if (!lead?.id) return;
    await completeActivity.mutateAsync({ id: activityId, leadId: lead.id });
  };

  const handleDelete = async (activityId: string) => {
    if (!lead?.id) return;
    await deleteActivity.mutateAsync({ id: activityId, leadId: lead.id });
  };

  const getActivityIcon = (type: string) => {
    const activity = activityTypes.find(a => a.value === type);
    return activity?.icon || CheckSquare;
  };

  const pendingActivities = activities?.filter(a => !a.completed_at) || [];
  const completedActivities = activities?.filter(a => a.completed_at) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5" />
            Atividades - {lead?.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Add new activity button/form */}
          {!showAddForm ? (
            <Button onClick={() => setShowAddForm(true)} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Nova Atividade
            </Button>
          ) : (
            <div className="p-4 border rounded-lg space-y-4 bg-secondary/30">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tipo *</Label>
                  <Select 
                    value={newActivity.type} 
                    onValueChange={(v) => setNewActivity({ ...newActivity, type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {activityTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <type.icon className="h-4 w-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Título *</Label>
                  <Input
                    value={newActivity.title}
                    onChange={(e) => setNewActivity({ ...newActivity, title: e.target.value })}
                    placeholder="Ex: Ligar para follow-up"
                  />
                </div>
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea
                  value={newActivity.description}
                  onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                  placeholder="Detalhes da atividade..."
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Data/Hora Agendada</Label>
                  <Input
                    type="datetime-local"
                    value={newActivity.scheduled_at}
                    onChange={(e) => setNewActivity({ ...newActivity, scheduled_at: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Lembrete</Label>
                  <Input
                    type="datetime-local"
                    value={newActivity.reminder_at}
                    onChange={(e) => setNewActivity({ ...newActivity, reminder_at: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleAddActivity} 
                  disabled={!newActivity.title || createActivity.isPending}
                >
                  Criar Atividade
                </Button>
              </div>
            </div>
          )}

          {/* Activities list */}
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Pending activities */}
              {pendingActivities.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-muted-foreground">Pendentes ({pendingActivities.length})</h4>
                  <div className="space-y-2">
                    {pendingActivities.map((activity) => {
                      const ActivityIcon = getActivityIcon(activity.type);
                      const isOverdue = activity.scheduled_at && isPast(parseISO(activity.scheduled_at));
                      
                      return (
                        <div 
                          key={activity.id} 
                          className={`p-3 border rounded-lg flex items-start gap-3 ${isOverdue ? 'border-red-200 bg-red-50 dark:bg-red-950/20' : 'bg-card'}`}
                        >
                          <div className={`p-2 rounded-full ${isOverdue ? 'bg-red-100' : 'bg-primary/10'}`}>
                            <ActivityIcon className={`h-4 w-4 ${isOverdue ? 'text-red-600' : 'text-primary'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{activity.title}</span>
                              {isOverdue && <Badge variant="destructive" className="text-xs">Atrasada</Badge>}
                            </div>
                            {activity.description && (
                              <p className="text-sm text-muted-foreground truncate">{activity.description}</p>
                            )}
                            {activity.scheduled_at && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                <Clock className="h-3 w-3" />
                                {format(parseISO(activity.scheduled_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => handleComplete(activity.id)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleDelete(activity.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {/* Completed activities */}
              {completedActivities.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-muted-foreground">Concluídas ({completedActivities.length})</h4>
                  <div className="space-y-2">
                    {completedActivities.slice(0, 5).map((activity) => {
                      const ActivityIcon = getActivityIcon(activity.type);
                      
                      return (
                        <div key={activity.id} className="p-3 border rounded-lg flex items-start gap-3 bg-card opacity-60">
                          <div className="p-2 rounded-full bg-green-100">
                            <ActivityIcon className="h-4 w-4 text-green-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="font-medium text-sm line-through">{activity.title}</span>
                            {activity.completed_at && (
                              <p className="text-xs text-muted-foreground">
                                Concluída em {format(parseISO(activity.completed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {pendingActivities.length === 0 && completedActivities.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma atividade registrada</p>
                  <p className="text-sm">Clique em "Nova Atividade" para adicionar</p>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
