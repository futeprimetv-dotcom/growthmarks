import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLeads, Lead, useDeleteLead, useDeleteLeadsBulk, useArchiveLeadsBulk } from "@/hooks/useLeads";
import { useProspects } from "@/hooks/useProspects";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { LeadFormDialog } from "./LeadFormDialog";
import { LeadHistoryDialog } from "./LeadHistoryDialog";
import { LeadImportDialog } from "./LeadImportDialog";
import { LeadExportButton } from "./LeadExportButton";
import { LeadConvertDialog } from "./LeadConvertDialog";
import { LeadActivitiesDialog } from "./LeadActivitiesDialog";
import { LeadScoreBadge } from "./LeadScoreBadge";
import { WhatsAppButton } from "./WhatsAppButton";
import { MoveFunnelDialog } from "./MoveFunnelDialog";
import { PullLeadDialog } from "./PullLeadDialog";
import { 
  Search, Flame, Snowflake, ThermometerSun, Calendar, 
  Plus, Upload, History, Pencil, Trash2, UserPlus, CheckSquare, ArrowRightLeft, Database,
  Download, Archive, X
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useSalesFunnels } from "@/hooks/useSalesFunnels";
import { toast } from "@/hooks/use-toast";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  novo: { label: "Novo", variant: "outline" },
  contato_inicial: { label: "Contato Inicial", variant: "secondary" },
  em_qualificacao: { label: "Qualificação", variant: "secondary" },
  reuniao_agendada: { label: "Reunião", variant: "secondary" },
  proposta_enviada: { label: "Proposta", variant: "secondary" },
  negociacao: { label: "Negociação", variant: "default" },
  fechamento: { label: "Fechamento", variant: "default" },
  perdido: { label: "Perdido", variant: "destructive" },
  lead_frio: { label: "Lead Frio", variant: "outline" },
  em_contato: { label: "Em Contato", variant: "secondary" },
};

const originLabels: Record<string, string> = {
  instagram: "Instagram",
  whatsapp: "WhatsApp",
  indicacao: "Indicação",
  google: "Google",
  linkedin: "LinkedIn",
  site: "Site",
  trafego_pago: "Tráfego Pago",
  prospeccao_ativa: "Prospecção",
  outro: "Outro",
};

const temperatureIcons = {
  cold: { icon: Snowflake, color: 'text-blue-400' },
  warm: { icon: ThermometerSun, color: 'text-yellow-400' },
  hot: { icon: Flame, color: 'text-red-400' },
};

export function LeadsList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [originFilter, setOriginFilter] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [pullOpen, setPullOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [activitiesOpen, setActivitiesOpen] = useState(false);
  const [moveFunnelOpen, setMoveFunnelOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [leadToDelete, setLeadToDelete] = useState<{ id: string; name: string } | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [convertLead, setConvertLead] = useState<Lead | null>(null);
  const [leadToMove, setLeadToMove] = useState<Lead | null>(null);
  const { data: leads, isLoading } = useLeads();
  const { data: teamMembers } = useTeamMembers();
  const { data: funnels = [] } = useSalesFunnels();
  const { data: prospects = [] } = useProspects();
  const deleteLead = useDeleteLead();
  const deleteLeadsBulk = useDeleteLeadsBulk();
  const archiveLeadsBulk = useArchiveLeadsBulk();

  const availableProspectsCount = prospects.filter(p => p.data_revealed).length;

  const filteredLeads = useMemo(() => (leads || []).filter(lead => {
    if ((lead as any).is_archived) return false;
    const matchesSearch = 
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.company?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    const matchesOrigin = originFilter === "all" || lead.origin === originFilter;
    return matchesSearch && matchesStatus && matchesOrigin;
  }), [leads, searchTerm, statusFilter, originFilter]);

  // Selection handlers
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredLeads.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredLeads.map(l => l.id));
    }
  };

  const clearSelection = () => setSelectedIds([]);

  // Bulk actions
  const handleBulkExport = () => {
    const selectedLeads = filteredLeads.filter(l => selectedIds.includes(l.id));
    const headers = ["Nome", "Empresa", "Email", "Telefone", "Status", "Origem", "Valor Estimado", "Serviço"];
    const rows = selectedLeads.map(l => [
      l.name,
      l.company || "",
      l.email || "",
      l.phone || "",
      statusConfig[l.status]?.label || l.status,
      originLabels[l.origin || ""] || l.origin || "",
      (l.estimated_value || 0).toString(),
      l.service_interest || "",
    ]);
    
    const csv = [headers.join(","), ...rows.map(r => r.map(cell => `"${cell}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    
    toast({
      title: "Exportação concluída",
      description: `${selectedLeads.length} lead(s) exportados.`,
    });
  };

  const handleBulkArchive = async () => {
    await archiveLeadsBulk.mutateAsync(selectedIds);
    setSelectedIds([]);
  };

  const handleBulkDelete = async () => {
    await deleteLeadsBulk.mutateAsync(selectedIds);
    setSelectedIds([]);
    setBulkDeleteOpen(false);
  };

  const handleEdit = (lead: Lead) => {
    setEditingLead(lead);
    setFormOpen(true);
  };

  const handleHistory = (lead: Lead) => {
    setSelectedLead(lead);
    setHistoryOpen(true);
  };

  const handleActivities = (lead: Lead) => {
    setSelectedLead(lead);
    setActivitiesOpen(true);
  };

  const handleMoveFunnel = (lead: Lead) => {
    setLeadToMove(lead);
    setMoveFunnelOpen(true);
  };

  const getFunnelName = (funnelIdValue: string | null) => {
    if (!funnelIdValue) return null;
    return funnels.find(f => f.id === funnelIdValue);
  };

  const handleDelete = async () => {
    if (leadToDelete) {
      await deleteLead.mutateAsync(leadToDelete);
      setLeadToDelete(null);
    }
  };

  const getResponsibleName = (id: string | null) => {
    if (!id) return "-";
    return teamMembers?.find(m => m.id === id)?.name || "-";
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Lista de Leads</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setPullOpen(true)}>
              <Database className="h-4 w-4 mr-2" />
              Puxar Lead
              {availableProspectsCount > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                  {availableProspectsCount}
                </Badge>
              )}
            </Button>
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Importar
            </Button>
            <LeadExportButton />
            <Button onClick={() => { setEditingLead(null); setFormOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Lead
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {Object.entries(statusConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={originFilter} onValueChange={setOriginFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Origem" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas origens</SelectItem>
                {Object.entries(originLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Bulk Actions Bar */}
          {selectedIds.length > 0 && (
            <div className="flex items-center justify-between bg-muted/50 border rounded-lg px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">
                  {selectedIds.length} lead(s) selecionado(s)
                </span>
                <Button variant="ghost" size="sm" onClick={clearSelection}>
                  <X className="h-4 w-4 mr-1" />
                  Limpar
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleBulkExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
                <Button variant="outline" size="sm" onClick={handleBulkArchive} disabled={archiveLeadsBulk.isPending}>
                  <Archive className="h-4 w-4 mr-2" />
                  Arquivar
                </Button>
                <Button variant="destructive" size="sm" onClick={() => setBulkDeleteOpen(true)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </Button>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedIds.length === filteredLeads.length && filteredLeads.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Lead</TableHead>
                  <TableHead className="text-center">Score</TableHead>
                  <TableHead>Funil</TableHead>
                  <TableHead>Serviço</TableHead>
                  <TableHead>Valor Est.</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Próxima Ação</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead className="w-[160px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => {
                  const status = statusConfig[lead.status] || { label: lead.status, variant: "outline" as const };
                  const TempIcon = temperatureIcons[lead.temperature]?.icon || ThermometerSun;
                  const tempColor = temperatureIcons[lead.temperature]?.color || 'text-muted-foreground';
                  
                  return (
                    <TableRow key={lead.id} className={selectedIds.includes(lead.id) ? "bg-muted/30" : ""}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.includes(lead.id)}
                          onCheckedChange={() => toggleSelect(lead.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <TempIcon className={`h-4 w-4 ${tempColor}`} />
                          <div>
                            <p className="font-medium">{lead.name}</p>
                            <p className="text-sm text-muted-foreground">{lead.company || "-"}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <LeadScoreBadge lead={lead} size="sm" />
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const funnel = getFunnelName(lead.funnel_id);
                          return funnel ? (
                            <Badge 
                              variant="outline" 
                              style={{ 
                                borderColor: funnel.color || undefined,
                                color: funnel.color || undefined 
                              }}
                            >
                              {funnel.name}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        {lead.service_interest ? (
                          <Badge variant="outline">{lead.service_interest}</Badge>
                        ) : "-"}
                      </TableCell>
                      <TableCell className="font-medium">
                        R$ {(lead.estimated_value || 0).toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{originLabels[lead.origin || ''] || lead.origin || "-"}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>
                      <TableCell>
                        {lead.next_action ? (
                          <div className="space-y-1">
                            <p className="text-sm">{lead.next_action}</p>
                            {lead.next_action_date && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(lead.next_action_date).toLocaleDateString('pt-BR')}
                              </p>
                            )}
                          </div>
                        ) : "-"}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{getResponsibleName(lead.responsible_id)}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <WhatsAppButton 
                            phone={lead.whatsapp || lead.phone} 
                            leadId={lead.id}
                            leadName={lead.name}
                          />
                          <Button variant="ghost" size="icon" onClick={() => handleActivities(lead)} title="Atividades">
                            <CheckSquare className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleHistory(lead)} title="Histórico">
                            <History className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(lead)} title="Editar">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleMoveFunnel(lead)} 
                            title="Mover para outro funil"
                          >
                            <ArrowRightLeft className="h-4 w-4 text-primary" />
                          </Button>
                          {lead.status !== 'fechamento' && lead.status !== 'perdido' && !lead.converted_to_client_id && (
                            <Button variant="ghost" size="icon" onClick={() => setConvertLead(lead)} title="Converter para Cliente">
                              <UserPlus className="h-4 w-4 text-green-500" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => setLeadToDelete({ id: lead.id, name: lead.name })} title="Excluir">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {filteredLeads.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum lead encontrado
            </div>
          )}
        </CardContent>
      </Card>

      <LeadFormDialog 
        open={formOpen} 
        onOpenChange={setFormOpen} 
        lead={editingLead}
      />
      
      <LeadHistoryDialog 
        open={historyOpen} 
        onOpenChange={setHistoryOpen} 
        lead={selectedLead} 
      />
      
      <LeadImportDialog 
        open={importOpen} 
        onOpenChange={setImportOpen} 
      />

      <PullLeadDialog
        open={pullOpen}
        onOpenChange={setPullOpen}
      />

      <LeadConvertDialog
        open={!!convertLead}
        onOpenChange={(open) => !open && setConvertLead(null)}
        lead={convertLead}
      />

      <LeadActivitiesDialog
        open={activitiesOpen}
        onOpenChange={setActivitiesOpen}
        lead={selectedLead}
      />

      <MoveFunnelDialog
        open={moveFunnelOpen}
        onOpenChange={setMoveFunnelOpen}
        lead={leadToMove}
      />

      <AlertDialog open={!!leadToDelete} onOpenChange={() => setLeadToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir lead?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {selectedIds.length} lead(s)?</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a excluir {selectedIds.length} lead(s) permanentemente. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir {selectedIds.length} lead(s)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
