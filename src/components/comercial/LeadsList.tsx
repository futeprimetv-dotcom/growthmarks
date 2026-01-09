import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLeads, Lead, useDeleteLead } from "@/hooks/useLeads";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { LeadFormDialog } from "./LeadFormDialog";
import { LeadHistoryDialog } from "./LeadHistoryDialog";
import { LeadImportDialog } from "./LeadImportDialog";
import { LeadExportButton } from "./LeadExportButton";
import { 
  Search, Flame, Snowflake, ThermometerSun, Calendar, 
  Plus, Upload, History, Pencil, Trash2, UserPlus 
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

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
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: leads, isLoading } = useLeads();
  const { data: teamMembers } = useTeamMembers();
  const deleteLead = useDeleteLead();

  const filteredLeads = (leads || []).filter(lead => {
    if ((lead as any).is_archived) return false;
    const matchesSearch = 
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.company?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    const matchesOrigin = originFilter === "all" || lead.origin === originFilter;
    return matchesSearch && matchesStatus && matchesOrigin;
  });

  const handleEdit = (lead: Lead) => {
    setEditingLead(lead);
    setFormOpen(true);
  };

  const handleHistory = (lead: Lead) => {
    setSelectedLead(lead);
    setHistoryOpen(true);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteLead.mutateAsync(deleteId);
      setDeleteId(null);
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

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lead</TableHead>
                  <TableHead>Serviço</TableHead>
                  <TableHead>Valor Est.</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Próxima Ação</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead className="w-[120px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => {
                  const status = statusConfig[lead.status] || { label: lead.status, variant: "outline" as const };
                  const TempIcon = temperatureIcons[lead.temperature]?.icon || ThermometerSun;
                  const tempColor = temperatureIcons[lead.temperature]?.color || 'text-muted-foreground';
                  
                  return (
                    <TableRow key={lead.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <TempIcon className={`h-4 w-4 ${tempColor}`} />
                          <div>
                            <p className="font-medium">{lead.name}</p>
                            <p className="text-sm text-muted-foreground">{lead.company || "-"}</p>
                          </div>
                        </div>
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
                          <Button variant="ghost" size="icon" onClick={() => handleHistory(lead)} title="Histórico">
                            <History className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(lead)} title="Editar">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteId(lead.id)} title="Excluir">
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

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
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
    </>
  );
}
