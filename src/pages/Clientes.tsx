import { useState } from "react";
import { useClients, useDeleteClient, Client } from "@/hooks/useClients";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useDemands } from "@/hooks/useDemands";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Mail, Phone, Calendar, User, Plus, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ClientFormDialog } from "@/components/clientes/ClientFormDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useProtectedCurrency } from "@/components/ui/protected-value";
import { useUserRole } from "@/hooks/useUserRole";

export default function Clientes() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  const { data: clients, isLoading } = useClients();
  const { data: teamMembers } = useTeamMembers();
  const { data: demands } = useDemands();
  const deleteClient = useDeleteClient();
  const { formatCurrency, canViewValues } = useProtectedCurrency();

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getTeamMemberById = (id: string | null) => teamMembers?.find(m => m.id === id);
  const getDemandsByClient = (clientId: string) => demands?.filter(d => d.client_id === clientId) || [];

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteClient.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-9 w-32 mb-2" />
            <Skeleton className="h-5 w-64" />
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Clientes</h1>
          <p className="text-muted-foreground">Gerencie seus clientes ativos e histórico</p>
        </div>
        <Button onClick={() => { setEditingClient(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Novo Cliente
        </Button>
      </div>

      {clients?.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          Nenhum cliente cadastrado. Clique em "Novo Cliente" para começar.
        </Card>
      ) : (
        <div className="grid gap-4">
          {clients?.map((client) => {
            const isExpanded = expandedId === client.id;
            const responsible = getTeamMemberById(client.responsible_id);
            const clientDemands = getDemandsByClient(client.id);
            const activeDemands = clientDemands.filter(d => d.status !== 'done');

            return (
              <Card
                key={client.id}
                className={cn(
                  "overflow-hidden transition-all cursor-pointer hover:shadow-lg",
                  isExpanded && "ring-2 ring-primary"
                )}
                onClick={() => toggleExpand(client.id)}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold">{client.name}</h3>
                        <StatusBadge status={client.status || "active"} />
                      </div>
                      <p className="text-muted-foreground">{client.plan}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      {canViewValues && (
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary">
                            {formatCurrency(client.monthly_value || 0)}
                          </p>
                          <p className="text-xs text-muted-foreground">por mês</p>
                        </div>
                      )}
                      {isExpanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t bg-secondary/30 p-6" onClick={(e) => e.stopPropagation()}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-4">
                      <div className="space-y-3">
                        <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Contato</h4>
                        <div className="space-y-2">
                          <p className="flex items-center gap-2 text-sm"><Mail className="h-4 w-4 text-muted-foreground" />{client.contact_email || "-"}</p>
                          <p className="flex items-center gap-2 text-sm"><Phone className="h-4 w-4 text-muted-foreground" />{client.contact_phone || "-"}</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Conta</h4>
                        <div className="space-y-2">
                          <p className="flex items-center gap-2 text-sm"><User className="h-4 w-4 text-muted-foreground" />{responsible?.name || "Não atribuído"}</p>
                          <p className="flex items-center gap-2 text-sm"><Calendar className="h-4 w-4 text-muted-foreground" />
                            {client.contract_start ? `Desde ${new Date(client.contract_start).toLocaleDateString('pt-BR')}` : "-"}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Demandas</h4>
                        <div className="space-y-1">
                          <p className="text-2xl font-bold">{activeDemands.length}</p>
                          <p className="text-sm text-muted-foreground">em andamento</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Ações</h4>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEdit(client)}>
                            <Pencil className="h-4 w-4 mr-1" /> Editar
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => setDeleteId(client.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <ClientFormDialog open={formOpen} onOpenChange={setFormOpen} client={editingClient} />
      
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cliente?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
