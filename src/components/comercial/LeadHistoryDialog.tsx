import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useLeadHistory, useCreateLeadHistory } from "@/hooks/useLeadHistory";
import { Lead } from "@/hooks/useLeads";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { 
  MessageSquare, Phone, Mail, Calendar, Plus, 
  Video, FileText, Users, ArrowRight 
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

interface LeadHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead | null;
}

const actionTypes = [
  { value: "ligacao", label: "Ligação", icon: Phone },
  { value: "whatsapp", label: "WhatsApp", icon: MessageSquare },
  { value: "email", label: "Email", icon: Mail },
  { value: "reuniao", label: "Reunião", icon: Video },
  { value: "proposta", label: "Proposta Enviada", icon: FileText },
  { value: "follow_up", label: "Follow-up", icon: ArrowRight },
  { value: "qualificacao", label: "Qualificação", icon: Users },
  { value: "outro", label: "Outro", icon: Calendar },
];

const contactChannels = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "ligacao", label: "Ligação" },
  { value: "email", label: "Email" },
  { value: "instagram", label: "Instagram" },
  { value: "presencial", label: "Presencial" },
];

export function LeadHistoryDialog({ open, onOpenChange, lead }: LeadHistoryDialogProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEntry, setNewEntry] = useState({
    action_type: "",
    description: "",
    contact_channel: "",
  });
  
  const { data: history, isLoading } = useLeadHistory(lead?.id);
  const { data: teamMembers } = useTeamMembers();
  const createHistory = useCreateLeadHistory();

  const handleAddEntry = async () => {
    if (!lead?.id || !newEntry.action_type) return;
    
    await createHistory.mutateAsync({
      lead_id: lead.id,
      action_type: newEntry.action_type,
      description: newEntry.description || undefined,
      contact_channel: newEntry.contact_channel || undefined,
    });
    
    setNewEntry({ action_type: "", description: "", contact_channel: "" });
    setShowAddForm(false);
  };

  const getActionIcon = (type: string) => {
    const action = actionTypes.find(a => a.value === type);
    return action?.icon || MessageSquare;
  };

  const getTeamMemberName = (userId: string | null) => {
    if (!userId) return "Sistema";
    const member = teamMembers?.find(m => m.user_id === userId);
    return member?.name || "Usuário";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Histórico - {lead?.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Add new entry button/form */}
          {!showAddForm ? (
            <Button onClick={() => setShowAddForm(true)} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Registrar Interação
            </Button>
          ) : (
            <div className="p-4 border rounded-lg space-y-4 bg-secondary/30">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tipo de Ação *</Label>
                  <Select 
                    value={newEntry.action_type} 
                    onValueChange={(v) => setNewEntry({ ...newEntry, action_type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {actionTypes.map((type) => (
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
                  <Label>Canal de Contato</Label>
                  <Select 
                    value={newEntry.contact_channel} 
                    onValueChange={(v) => setNewEntry({ ...newEntry, contact_channel: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {contactChannels.map((channel) => (
                        <SelectItem key={channel.value} value={channel.value}>
                          {channel.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea
                  value={newEntry.description}
                  onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
                  placeholder="Detalhes da interação..."
                  rows={3}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleAddEntry} 
                  disabled={!newEntry.action_type || createHistory.isPending}
                >
                  Registrar
                </Button>
              </div>
            </div>
          )}

          {/* History timeline */}
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : history && history.length > 0 ? (
            <div className="space-y-4">
              {history.map((entry, index) => {
                const ActionIcon = getActionIcon(entry.action_type);
                const actionLabel = actionTypes.find(a => a.value === entry.action_type)?.label || entry.action_type;
                
                return (
                  <div key={entry.id} className="relative pl-8">
                    {/* Timeline line */}
                    {index < history.length - 1 && (
                      <div className="absolute left-3 top-8 bottom-0 w-px bg-border" />
                    )}
                    
                    {/* Timeline dot */}
                    <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <ActionIcon className="h-3 w-3 text-primary" />
                    </div>
                    
                    <div className="p-3 border rounded-lg bg-card">
                      <div className="flex items-start justify-between mb-1">
                        <span className="font-medium text-sm">{actionLabel}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(entry.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                      {entry.description && (
                        <p className="text-sm text-muted-foreground">{entry.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        {entry.contact_channel && (
                          <span>Canal: {contactChannels.find(c => c.value === entry.contact_channel)?.label || entry.contact_channel}</span>
                        )}
                        <span>Por: {getTeamMemberName(entry.created_by)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma interação registrada</p>
              <p className="text-sm">Clique em "Registrar Interação" para adicionar</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
