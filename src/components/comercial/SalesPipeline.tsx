import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLeads, useUpdateLead, useDeleteLead } from "@/hooks/useLeads";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { DollarSign, Phone, Calendar, User, Flame, Snowflake, ThermometerSun, Plus, Edit2, Trash2, GripVertical, ArrowRightLeft } from "lucide-react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
} from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { LeadFormDialog } from "./LeadFormDialog";
import { LeadScoreBadge } from "./LeadScoreBadge";
import { WhatsAppButton } from "./WhatsAppButton";
import { MoveFunnelDialog } from "./MoveFunnelDialog";
import { Tables } from "@/integrations/supabase/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

type Lead = Tables<"leads">;

// Updated pipeline columns with new statuses
const pipelineColumns = [
  { id: 'lead_frio', title: 'Lead Frio', color: 'bg-blue-500/20 border-blue-500/50' },
  { id: 'em_contato', title: 'Em Contato', color: 'bg-cyan-500/20 border-cyan-500/50' },
  { id: 'em_qualificacao', title: 'Em Qualificação', color: 'bg-yellow-500/20 border-yellow-500/50' },
  { id: 'proposta_enviada', title: 'Proposta Enviada', color: 'bg-orange-500/20 border-orange-500/50' },
  { id: 'negociacao', title: 'Negociação', color: 'bg-purple-500/20 border-purple-500/50' },
  { id: 'fechamento', title: 'Fechamento ✓', color: 'bg-green-500/20 border-green-500/50' },
  { id: 'perdido', title: 'Perdido', color: 'bg-red-500/20 border-red-500/50' },
] as const;

const temperatureIcons = {
  cold: { icon: Snowflake, color: 'text-blue-400', label: 'Frio' },
  warm: { icon: ThermometerSun, color: 'text-yellow-400', label: 'Morno' },
  hot: { icon: Flame, color: 'text-red-400', label: 'Quente' },
};

interface LeadCardProps {
  lead: Lead;
  teamMembers: { id: string; name: string }[];
  onEdit: (lead: Lead) => void;
  onDelete: (lead: Lead) => void;
  onMoveFunnel: (lead: Lead) => void;
  isDragging?: boolean;
}

function LeadCard({ lead, teamMembers, onEdit, onDelete, onMoveFunnel, isDragging }: LeadCardProps) {
  const responsible = teamMembers.find(m => m.id === lead.responsible_id);
  const temp = lead.temperature as keyof typeof temperatureIcons;
  const TempIcon = temperatureIcons[temp]?.icon || Snowflake;
  const tempColor = temperatureIcons[temp]?.color || 'text-blue-400';
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: lead.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group"
    >
      <Card className="bg-card hover:border-primary/50 transition-colors">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div 
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 -ml-1 opacity-50 hover:opacity-100"
            >
              <GripVertical className="h-4 w-4" />
            </div>
            <div className="flex-1 ml-2">
              <p className="font-medium">{lead.name}</p>
              <p className="text-sm text-muted-foreground">{lead.company}</p>
            </div>
            <div className="flex items-center gap-2">
              <LeadScoreBadge lead={lead} size="sm" />
              <TempIcon className={`h-5 w-5 ${tempColor}`} />
            </div>
          </div>

          {lead.estimated_value && lead.estimated_value > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              <span className="font-medium text-foreground">
                R$ {lead.estimated_value.toLocaleString('pt-BR')}
              </span>
            </div>
          )}

          {lead.service_interest && (
            <Badge variant="outline" className="text-xs">
              {lead.service_interest}
            </Badge>
          )}

          {lead.next_action && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {lead.next_action}
            </div>
          )}

          <div className="flex items-center justify-between pt-1 border-t">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <User className="h-3 w-3" />
              {responsible?.name || 'Sem responsável'}
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <WhatsAppButton 
                phone={lead.whatsapp || lead.phone} 
                leadId={lead.id}
                leadName={lead.name}
                size="icon"
                className="h-6 w-6"
              />
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6"
                onClick={(e) => { e.stopPropagation(); onMoveFunnel(lead); }}
                title="Mover para outro funil"
              >
                <ArrowRightLeft className="h-3 w-3 text-primary" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6"
                onClick={(e) => { e.stopPropagation(); onEdit(lead); }}
              >
                <Edit2 className="h-3 w-3" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 text-destructive hover:text-destructive"
                onClick={(e) => { e.stopPropagation(); onDelete(lead); }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface PipelineColumnProps {
  column: typeof pipelineColumns[number];
  leads: Lead[];
  totalValue: number;
  teamMembers: { id: string; name: string }[];
  onEditLead: (lead: Lead) => void;
  onDeleteLead: (lead: Lead) => void;
  onMoveFunnelLead: (lead: Lead) => void;
}

function PipelineColumn({ column, leads, totalValue, teamMembers, onEditLead, onDeleteLead, onMoveFunnelLead }: PipelineColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div 
      ref={setNodeRef}
      className={`flex flex-col rounded-lg border-2 ${column.color} min-w-[280px] w-[280px] transition-all ${
        isOver ? 'ring-2 ring-primary scale-[1.02]' : ''
      }`}
    >
      <div className="p-3 border-b border-border/50">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">{column.title}</h3>
          <Badge variant="secondary">{leads.length}</Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          R$ {totalValue.toLocaleString('pt-BR')}
        </p>
      </div>
      <div className="flex-1 p-2 space-y-2 min-h-[400px] max-h-[600px] overflow-y-auto">
        {leads.map((lead) => (
          <LeadCard 
            key={lead.id} 
            lead={lead} 
            teamMembers={teamMembers}
            onEdit={onEditLead}
            onDelete={onDeleteLead}
            onMoveFunnel={onMoveFunnelLead}
          />
        ))}
        {leads.length === 0 && (
          <div className="h-20 flex items-center justify-center text-muted-foreground text-sm border-2 border-dashed rounded-lg">
            Arraste leads aqui
          </div>
        )}
      </div>
    </div>
  );
}

interface SalesPipelineProps {
  funnelId?: string | null;
}

export function SalesPipeline({ funnelId }: SalesPipelineProps) {
  const { data: leads = [], isLoading } = useLeads();
  const { data: teamMembers = [] } = useTeamMembers();
  const updateLead = useUpdateLead();
  const deleteLead = useDeleteLead();
  
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Lead | null>(null);
  const [moveFunnelOpen, setMoveFunnelOpen] = useState(false);
  const [leadToMove, setLeadToMove] = useState<Lead | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Filter out archived leads and filter by funnel
  const activeLeads = leads.filter((l: Lead & { is_archived?: boolean; funnel_id?: string }) => {
    if (l.is_archived) return false;
    if (funnelId && l.funnel_id !== funnelId) return false;
    return true;
  });

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeLeadId = active.id as string;
    const overId = over.id as string;

    // Check if dropped on a column
    const targetColumn = pipelineColumns.find(col => col.id === overId);
    if (targetColumn) {
      const lead = activeLeads.find(l => l.id === activeLeadId);
      if (lead && lead.status !== targetColumn.id) {
        updateLead.mutate({ 
          id: activeLeadId, 
          status: targetColumn.id as Lead["status"]
        });
        
        // If moved to "fechamento", suggest converting to client
        if (targetColumn.id === 'fechamento') {
          toast.success("Lead fechado! Deseja converter para cliente?", {
            action: {
              label: "Converter",
              onClick: () => {
                // TODO: Implement conversion
                toast.info("Conversão de lead para cliente em desenvolvimento");
              }
            }
          });
        }
      }
      return;
    }

    // Dropped on another lead - find that lead's column
    const targetLead = activeLeads.find(l => l.id === overId);
    if (targetLead) {
      const lead = activeLeads.find(l => l.id === activeLeadId);
      if (lead && lead.status !== targetLead.status) {
        updateLead.mutate({ 
          id: activeLeadId, 
          status: targetLead.status 
        });
      }
    }
  };

  const handleEditLead = (lead: Lead) => {
    setEditingLead(lead);
    setIsFormOpen(true);
  };

  const handleDeleteLead = (lead: Lead) => {
    setDeleteConfirm(lead);
  };

  const handleMoveFunnelLead = (lead: Lead) => {
    setLeadToMove(lead);
    setMoveFunnelOpen(true);
  };

  const confirmDelete = () => {
    if (deleteConfirm) {
      deleteLead.mutate({ id: deleteConfirm.id, name: deleteConfirm.name });
      setDeleteConfirm(null);
    }
  };

  const activeLead = activeId ? activeLeads.find(l => l.id === activeId) : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-muted-foreground">
          {activeLeads.length} leads no pipeline • Total: R$ {activeLeads.reduce((acc, l) => acc + (l.estimated_value || 0), 0).toLocaleString('pt-BR')}
        </div>
        <Button onClick={() => { setEditingLead(null); setIsFormOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Lead
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {pipelineColumns.map((column) => {
              const columnLeads = activeLeads.filter(l => l.status === column.id);
              const totalValue = columnLeads.reduce((acc, l) => acc + (l.estimated_value || 0), 0);
              
              return (
                <PipelineColumn
                  key={column.id}
                  column={column}
                  leads={columnLeads}
                  totalValue={totalValue}
                  teamMembers={teamMembers}
                  onEditLead={handleEditLead}
                  onDeleteLead={handleDeleteLead}
                  onMoveFunnelLead={handleMoveFunnelLead}
                />
              );
            })}
          </div>
        </div>

        <DragOverlay>
          {activeLead ? (
            <LeadCard 
              lead={activeLead} 
              teamMembers={teamMembers}
              onEdit={() => {}}
              onDelete={() => {}}
              onMoveFunnel={() => {}}
              isDragging 
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      <LeadFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        lead={editingLead}
        defaultFunnelId={funnelId}
      />

      <MoveFunnelDialog
        open={moveFunnelOpen}
        onOpenChange={setMoveFunnelOpen}
        lead={leadToMove}
      />

      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Lead</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o lead "{deleteConfirm?.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
