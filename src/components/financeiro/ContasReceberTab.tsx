import { useState } from "react";
import { 
  useReceivables, 
  useCreateReceivable, 
  useUpdateReceivable, 
  useDeleteReceivable,
  useMarkReceivableAsPaid,
  Receivable,
  ReceivableInsert
} from "@/hooks/useReceivables";
import { useClients } from "@/hooks/useClients";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, CheckCircle2, Receipt, Loader2 } from "lucide-react";
import { format, differenceInDays } from "date-fns";

interface ContasReceberTabProps {
  selectedMonth: number;
  selectedYear: number;
}

export function ContasReceberTab({ selectedMonth, selectedYear }: ContasReceberTabProps) {
  const { data: receivables, isLoading } = useReceivables(selectedMonth, selectedYear);
  const { data: clients } = useClients();
  const createReceivable = useCreateReceivable();
  const updateReceivable = useUpdateReceivable();
  const deleteReceivable = useDeleteReceivable();
  const markAsPaid = useMarkReceivableAsPaid();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [selectedReceivable, setSelectedReceivable] = useState<Receivable | null>(null);
  const [paidValue, setPaidValue] = useState("");

  const [formData, setFormData] = useState<ReceivableInsert>({
    client_id: null,
    description: "",
    value: 0,
    due_date: "",
    reference_month: selectedMonth,
    reference_year: selectedYear,
  });

  const handleCreate = () => {
    setSelectedReceivable(null);
    setFormData({
      client_id: null,
      description: "",
      value: 0,
      due_date: format(new Date(selectedYear, selectedMonth - 1, 10), "yyyy-MM-dd"),
      reference_month: selectedMonth,
      reference_year: selectedYear,
    });
    setDialogOpen(true);
  };

  const handleEdit = (receivable: Receivable) => {
    setSelectedReceivable(receivable);
    setFormData({
      client_id: receivable.client_id,
      description: receivable.description,
      value: receivable.value,
      due_date: receivable.due_date,
      reference_month: receivable.reference_month,
      reference_year: receivable.reference_year,
      notes: receivable.notes || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = (receivable: Receivable) => {
    setSelectedReceivable(receivable);
    setDeleteDialogOpen(true);
  };

  const handlePayClick = (receivable: Receivable) => {
    setSelectedReceivable(receivable);
    setPaidValue(receivable.value.toString());
    setPayDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (selectedReceivable) {
      await updateReceivable.mutateAsync({ id: selectedReceivable.id, ...formData });
    } else {
      await createReceivable.mutateAsync(formData);
    }
    setDialogOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (selectedReceivable) {
      await deleteReceivable.mutateAsync(selectedReceivable.id);
      setDeleteDialogOpen(false);
    }
  };

  const handleConfirmPay = async () => {
    if (selectedReceivable) {
      await markAsPaid.mutateAsync({ 
        id: selectedReceivable.id, 
        paid_value: parseFloat(paidValue) 
      });
      setPayDialogOpen(false);
    }
  };

  const getStatusBadge = (receivable: Receivable) => {
    if (receivable.status === "paid") {
      return <Badge className="bg-green-500">Recebido</Badge>;
    }
    const now = new Date();
    const dueDate = new Date(receivable.due_date);
    const daysUntilDue = differenceInDays(dueDate, now);
    
    if (daysUntilDue < 0) {
      return <Badge variant="destructive">Vencido ({Math.abs(daysUntilDue)} dias)</Badge>;
    }
    if (daysUntilDue <= 7) {
      return <Badge className="bg-orange-500">Vence em {daysUntilDue} dias</Badge>;
    }
    return <Badge variant="secondary">Pendente</Badge>;
  };

  const totalPending = receivables?.filter(r => r.status === "pending").reduce((sum, r) => sum + r.value, 0) || 0;
  const totalPaid = receivables?.filter(r => r.status === "paid").reduce((sum, r) => sum + (r.paid_value || r.value), 0) || 0;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4 bg-blue-500/10 border-blue-500/20">
          <p className="text-sm text-muted-foreground">Pendente</p>
          <p className="text-2xl font-bold text-blue-500">
            R$ {totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </Card>
        <Card className="p-4 bg-green-500/10 border-green-500/20">
          <p className="text-sm text-muted-foreground">Recebido</p>
          <p className="text-2xl font-bold text-green-500">
            R$ {totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </Card>
      </div>

      {/* Table */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Contas a Receber</h3>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Conta
          </Button>
        </div>

        {!receivables || receivables.length === 0 ? (
          <div className="text-center py-12">
            <Receipt className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma conta a receber</h3>
            <p className="text-muted-foreground mb-4">
              Adicione as receitas esperadas para este período
            </p>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Conta
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Cliente</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Descrição</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Valor</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Vencimento</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {receivables.map((receivable) => (
                  <tr key={receivable.id} className="border-b hover:bg-secondary/50 transition-colors">
                    <td className="py-3 px-4 font-medium">
                      {receivable.client?.name || "-"}
                    </td>
                    <td className="py-3 px-4">{receivable.description}</td>
                    <td className="py-3 px-4 font-semibold text-green-500">
                      R$ {receivable.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4">
                      {format(new Date(receivable.due_date), "dd/MM/yyyy")}
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(receivable)}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1">
                        {receivable.status === "pending" && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handlePayClick(receivable)}
                            title="Marcar como recebido"
                          >
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(receivable)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(receivable)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedReceivable ? "Editar Conta a Receber" : "Nova Conta a Receber"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Select 
                value={formData.client_id || ""} 
                onValueChange={(v) => setFormData({ ...formData, client_id: v || null })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients?.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Descrição *</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Ex: Mensalidade Janeiro"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valor *</Label>
                <Input
                  type="number"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Data de Vencimento *</Label>
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={formData.notes || ""}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={createReceivable.isPending || updateReceivable.isPending}>
              {(createReceivable.isPending || updateReceivable.isPending) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {selectedReceivable ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pay Dialog */}
      <Dialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Recebimento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Confirme o valor recebido para "{selectedReceivable?.description}"
            </p>
            <div className="space-y-2">
              <Label>Valor Recebido</Label>
              <Input
                type="number"
                value={paidValue}
                onChange={(e) => setPaidValue(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleConfirmPay} disabled={markAsPaid.isPending}>
              {markAsPaid.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirmar Recebimento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir conta a receber?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{selectedReceivable?.description}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
