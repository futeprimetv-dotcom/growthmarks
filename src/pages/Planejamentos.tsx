import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { usePlannings, useCreatePlanning, useUpdatePlanning, usePlanningContents, usePlanningCampaigns } from "@/hooks/usePlannings";
import { useClients } from "@/hooks/useClients";
import { PlanningView } from "@/components/planejamentos/PlanningView";
import { CalendarDays, Search, Eye, Link2, CheckCircle, Clock, FileEdit, Plus, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const statusConfig = {
  rascunho: { label: "Rascunho", variant: "outline" as const, icon: FileEdit },
  aguardando_aprovacao: { label: "Aguardando Aprovação", variant: "secondary" as const, icon: Clock },
  aprovado: { label: "Aprovado", variant: "default" as const, icon: CheckCircle },
  em_execucao: { label: "Em Execução", variant: "default" as const, icon: CheckCircle },
  concluido: { label: "Concluído", variant: "secondary" as const, icon: CheckCircle },
};

const monthNames = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export default function Planejamentos() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [selectedPlanningId, setSelectedPlanningId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [driveLinkDialogOpen, setDriveLinkDialogOpen] = useState(false);
  const [editingPlanningId, setEditingPlanningId] = useState<string | null>(null);
  const [driveLink, setDriveLink] = useState("");
  
  const [newPlanningData, setNewPlanningData] = useState({
    client_id: "",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    observations: "",
  });

  const { data: plannings = [], isLoading } = usePlannings();
  const { data: clients = [] } = useClients();
  const { data: contents = [] } = usePlanningContents(selectedPlanningId || undefined);
  const { data: campaigns = [] } = usePlanningCampaigns(selectedPlanningId || undefined);
  const createPlanning = useCreatePlanning();
  const updatePlanning = useUpdatePlanning();

  const activeClients = clients.filter(c => c.status === 'active' && !(c as any).is_archived);

  // Generate list of months from current month onwards
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  // Filter plannings
  const filteredPlannings = useMemo(() => {
    return plannings.filter(planning => {
      if ((planning as any).is_archived) return false;
      
      const client = clients.find(c => c.id === planning.client_id);
      const matchesSearch = !searchTerm || client?.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || planning.status === statusFilter;
      const matchesClient = clientFilter === "all" || planning.client_id === clientFilter;
      
      return matchesSearch && matchesStatus && matchesClient;
    });
  }, [plannings, clients, searchTerm, statusFilter, clientFilter]);

  // Group plannings by client
  const planningsByClient = useMemo(() => {
    const grouped: Record<string, typeof filteredPlannings> = {};
    
    filteredPlannings.forEach(planning => {
      if (!grouped[planning.client_id]) {
        grouped[planning.client_id] = [];
      }
      grouped[planning.client_id].push(planning);
    });
    
    return grouped;
  }, [filteredPlannings]);

  const handleViewPlanning = (planningId: string) => {
    setSelectedPlanningId(planningId);
    setDialogOpen(true);
  };

  const handleCopyLink = (planning: any) => {
    const url = `${window.location.origin}/planejamento/${planning.share_token}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copiado para a área de transferência!");
  };

  const handleCreatePlanning = async () => {
    if (!newPlanningData.client_id) {
      toast.error("Selecione um cliente");
      return;
    }
    
    await createPlanning.mutateAsync({
      client_id: newPlanningData.client_id,
      month: newPlanningData.month,
      year: newPlanningData.year,
      observations: newPlanningData.observations || null,
      objectives: [],
      status: 'rascunho',
    });
    
    setCreateDialogOpen(false);
    setNewPlanningData({
      client_id: "",
      month: currentMonth,
      year: currentYear,
      observations: "",
    });
  };

  const handleSaveDriveLink = async () => {
    if (!editingPlanningId) return;
    
    await updatePlanning.mutateAsync({
      id: editingPlanningId,
      drive_link: driveLink,
    } as any);
    
    setDriveLinkDialogOpen(false);
    setEditingPlanningId(null);
    setDriveLink("");
    toast.success("Link do Drive salvo!");
  };

  const openDriveLinkDialog = (planning: any) => {
    setEditingPlanningId(planning.id);
    setDriveLink(planning.drive_link || "");
    setDriveLinkDialogOpen(true);
  };

  const selectedPlanning = plannings.find(p => p.id === selectedPlanningId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-64" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Planejamentos</h1>
          <p className="text-muted-foreground">Planejamento mensal de conteúdo por cliente</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Planejamento
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={clientFilter} onValueChange={setClientFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Cliente" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os clientes</SelectItem>
            {activeClients.map(client => (
              <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="rascunho">Rascunho</SelectItem>
            <SelectItem value="aguardando_aprovacao">Aguardando Aprovação</SelectItem>
            <SelectItem value="aprovado">Aprovado</SelectItem>
            <SelectItem value="em_execucao">Em Execução</SelectItem>
            <SelectItem value="concluido">Concluído</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Plannings Grid */}
      {filteredPlannings.length === 0 ? (
        <Card className="p-8 text-center">
          <CalendarDays className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground mb-4">Nenhum planejamento encontrado</p>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Criar Planejamento
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlannings.map((planning) => {
            const client = clients.find(c => c.id === planning.client_id);
            const status = statusConfig[planning.status] || statusConfig.rascunho;
            const StatusIcon = status.icon;

            return (
              <Card key={planning.id} className="hover:border-primary/50 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{client?.name || 'Cliente'}</CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CalendarDays className="h-4 w-4" />
                        {monthNames[planning.month - 1]} {planning.year}
                      </div>
                    </div>
                    <Badge variant={status.variant} className="flex items-center gap-1">
                      <StatusIcon className="h-3 w-3" />
                      {status.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Drive Link */}
                  {(planning as any).drive_link ? (
                    <a 
                      href={(planning as any).drive_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Abrir pasta no Drive
                    </a>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => openDriveLinkDialog(planning)}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Adicionar link do Drive
                    </Button>
                  )}

                  {/* Objectives Preview */}
                  {planning.objectives && planning.objectives.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-sm text-muted-foreground">Objetivos:</span>
                      <ul className="text-sm space-y-1">
                        {planning.objectives.slice(0, 2).map((obj, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                            <span className="truncate">{obj}</span>
                          </li>
                        ))}
                        {planning.objectives.length > 2 && (
                          <li className="text-muted-foreground text-xs">
                            +{planning.objectives.length - 2} mais
                          </li>
                        )}
                      </ul>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="default" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleViewPlanning(planning.id)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Visualizar
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleCopyLink(planning)}
                    >
                      <Link2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Last Update */}
                  <p className="text-xs text-muted-foreground">
                    Atualizado em {new Date(planning.updated_at).toLocaleDateString('pt-BR')}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Planning Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Planejamento</DialogTitle>
          </DialogHeader>
          {selectedPlanning && (
            <PlanningView 
              planning={selectedPlanning as any}
              onCopyLink={() => handleCopyLink(selectedPlanning)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Create Planning Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Planejamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Cliente</Label>
              <Select 
                value={newPlanningData.client_id} 
                onValueChange={(v) => setNewPlanningData({ ...newPlanningData, client_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  {activeClients.map(client => (
                    <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Mês</Label>
                <Select 
                  value={newPlanningData.month.toString()} 
                  onValueChange={(v) => setNewPlanningData({ ...newPlanningData, month: parseInt(v) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {monthNames.map((name, idx) => (
                      <SelectItem key={idx} value={(idx + 1).toString()}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Ano</Label>
                <Select 
                  value={newPlanningData.year.toString()} 
                  onValueChange={(v) => setNewPlanningData({ ...newPlanningData, year: parseInt(v) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={currentYear.toString()}>{currentYear}</SelectItem>
                    <SelectItem value={(currentYear + 1).toString()}>{currentYear + 1}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Observações (opcional)</Label>
              <Textarea
                value={newPlanningData.observations}
                onChange={(e) => setNewPlanningData({ ...newPlanningData, observations: e.target.value })}
                placeholder="Notas sobre o planejamento..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreatePlanning} disabled={createPlanning.isPending}>
              Criar Planejamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Drive Link Dialog */}
      <Dialog open={driveLinkDialogOpen} onOpenChange={setDriveLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link do Google Drive</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>URL da pasta do Drive</Label>
              <Input
                value={driveLink}
                onChange={(e) => setDriveLink(e.target.value)}
                placeholder="https://drive.google.com/drive/folders/..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDriveLinkDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveDriveLink} disabled={updatePlanning.isPending}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
