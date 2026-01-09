import { useState, useMemo } from "react";
import { useDemands, useUpdateDemand, Demand, DemandStatus } from "@/hooks/useDemands";
import { useClients } from "@/hooks/useClients";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { DemandFormDialog } from "@/components/demandas/DemandFormDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Filter, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useUserRole } from "@/hooks/useUserRole";

// Adapter to convert DB demand to Kanban format
type KanbanDemand = {
  id: string;
  title: string;
  clientId: string;
  responsibleId: string;
  deadline: string;
  priority: 'green' | 'yellow' | 'red';
  status: 'entrada' | 'planejamento' | 'producao' | 'revisao' | 'entregue';
  description: string;
  createdAt: string;
  clientName?: string;
  responsibleName?: string;
};

const statusMap: Record<string, KanbanDemand['status']> = {
  backlog: 'entrada',
  todo: 'planejamento',
  in_progress: 'producao',
  review: 'revisao',
  done: 'entregue',
  cancelled: 'entregue',
};

const reverseStatusMap: Record<string, DemandStatus> = {
  entrada: 'backlog',
  planejamento: 'todo',
  producao: 'in_progress',
  revisao: 'review',
  entregue: 'done',
};

const priorityMap: Record<string, KanbanDemand['priority']> = {
  low: 'green',
  medium: 'yellow',
  high: 'red',
  urgent: 'red',
};

type DeadlineFilter = 'all' | 'overdue' | 'today' | 'week';

export default function Producao() {
  const [formOpen, setFormOpen] = useState(false);
  const [editingDemand, setEditingDemand] = useState<Demand | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [responsibleFilter, setResponsibleFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [deadlineFilter, setDeadlineFilter] = useState<DeadlineFilter>("all");
  
  const { data: demands, isLoading } = useDemands();
  const { data: clients } = useClients();
  const { data: teamMembers } = useTeamMembers();
  const updateDemand = useUpdateDemand();
  const { canViewValues } = useUserRole();

  // Filter demands
  const filteredDemands = useMemo(() => {
    if (!demands) return [];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekFromNow = new Date(today);
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    
    return demands.filter(d => {
      // Exclude archived and done/cancelled for kanban view
      if ((d as any).is_archived) return false;
      if (d.status === 'done' || d.status === 'cancelled') return false;
      
      // Search filter
      if (searchTerm && !d.title.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Client filter
      if (clientFilter !== "all" && d.client_id !== clientFilter) {
        return false;
      }
      
      // Responsible filter
      if (responsibleFilter !== "all" && d.assigned_to !== responsibleFilter) {
        return false;
      }
      
      // Priority filter
      if (priorityFilter !== "all" && d.priority !== priorityFilter) {
        return false;
      }
      
      // Deadline filter
      if (deadlineFilter !== "all" && d.deadline) {
        const deadline = new Date(d.deadline);
        deadline.setHours(0, 0, 0, 0);
        
        if (deadlineFilter === "overdue" && deadline >= today) return false;
        if (deadlineFilter === "today" && deadline.getTime() !== today.getTime()) return false;
        if (deadlineFilter === "week" && (deadline < today || deadline > weekFromNow)) return false;
      } else if (deadlineFilter !== "all" && !d.deadline) {
        return false;
      }
      
      return true;
    });
  }, [demands, searchTerm, clientFilter, responsibleFilter, priorityFilter, deadlineFilter]);
  
  const kanbanDemands: KanbanDemand[] = filteredDemands.map(d => {
    const client = clients?.find(c => c.id === d.client_id);
    const responsible = teamMembers?.find(m => m.id === d.assigned_to);
    
    return {
      id: d.id,
      title: d.title,
      clientId: d.client_id,
      responsibleId: d.assigned_to || '',
      deadline: d.deadline || '',
      priority: priorityMap[d.priority] || 'yellow',
      status: statusMap[d.status] || 'entrada',
      description: d.description || '',
      createdAt: d.created_at,
      clientName: client?.name,
      responsibleName: responsible?.name,
    };
  });

  const handleDemandMove = async (demandId: string, newStatus: KanbanDemand['status']) => {
    const dbStatus = reverseStatusMap[newStatus];
    if (dbStatus) {
      await updateDemand.mutateAsync({ id: demandId, status: dbStatus });
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setClientFilter("all");
    setResponsibleFilter("all");
    setPriorityFilter("all");
    setDeadlineFilter("all");
  };

  const hasActiveFilters = searchTerm || clientFilter !== "all" || responsibleFilter !== "all" || priorityFilter !== "all" || deadlineFilter !== "all";

  const activeClients = clients?.filter(c => c.status === 'active' && !(c as any).is_archived) || [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-32" />
        <div className="grid grid-cols-5 gap-4">
          {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-96" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-full">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Produção</h1>
          <p className="text-muted-foreground">Esteira de demandas - arraste para mover entre colunas</p>
        </div>
        <Button onClick={() => { setEditingDemand(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Nova Demanda
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center p-4 bg-card border rounded-lg">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filtros:</span>
        </div>
        
        <div className="relative flex-1 min-w-[200px] max-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar demanda..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <Select value={clientFilter} onValueChange={setClientFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Cliente" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os clientes</SelectItem>
            {activeClients.map(client => (
              <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={responsibleFilter} onValueChange={setResponsibleFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Responsável" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {teamMembers?.map(member => (
              <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Prioridade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="urgent">🔴 Urgente</SelectItem>
            <SelectItem value="high">🟠 Alta</SelectItem>
            <SelectItem value="medium">🟡 Média</SelectItem>
            <SelectItem value="low">🟢 Baixa</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={deadlineFilter} onValueChange={(v) => setDeadlineFilter(v as DeadlineFilter)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Prazo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os prazos</SelectItem>
            <SelectItem value="overdue">⚠️ Atrasadas</SelectItem>
            <SelectItem value="today">📅 Para hoje</SelectItem>
            <SelectItem value="week">📆 Próximos 7 dias</SelectItem>
          </SelectContent>
        </Select>
        
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" /> Limpar
          </Button>
        )}
      </div>

      {/* Active filters summary */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Mostrando</span>
          <Badge variant="secondary">{filteredDemands.length}</Badge>
          <span className="text-muted-foreground">demandas</span>
          {clientFilter !== "all" && (
            <Badge variant="outline">
              {activeClients.find(c => c.id === clientFilter)?.name}
            </Badge>
          )}
          {responsibleFilter !== "all" && (
            <Badge variant="outline">
              {teamMembers?.find(m => m.id === responsibleFilter)?.name}
            </Badge>
          )}
        </div>
      )}

      <KanbanBoard 
        demands={kanbanDemands as any} 
        onDemandMove={handleDemandMove as any}
      />

      <DemandFormDialog open={formOpen} onOpenChange={setFormOpen} demand={editingDemand} />
    </div>
  );
}
