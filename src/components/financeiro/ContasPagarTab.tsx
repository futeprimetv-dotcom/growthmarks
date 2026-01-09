import { useState } from "react";
import { 
  usePayables, 
  useCreatePayable, 
  useUpdatePayable, 
  useDeletePayable,
  useMarkPayableAsPaid,
  Payable,
  PayableInsert
} from "@/hooks/usePayables";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Pencil, Trash2, CheckCircle2, Receipt, Loader2 } from "lucide-react";
import { format, differenceInDays } from "date-fns";

const CATEGORIES = [
  { value: "custo_operacional", label: "Custo Operacional" },
  { value: "folha_pagamento", label: "Folha de Pagamento" },
  { value: "impostos", label: "Impostos" },
  { value: "marketing", label: "Marketing" },
  { value: "ferramentas", label: "Ferramentas/Software" },
  { value: "infraestrutura", label: "Infraestrutura" },
  { value: "fornecedores", label: "Fornecedores" },
  { value: "outros", label: "Outros" },
];

interface ContasPagarTabProps {
  selectedMonth: number;
  selectedYear: number;
}

export function ContasPagarTab({ selectedMonth, selectedYear }: ContasPagarTabProps) {
  const { data: payables, isLoading } = usePayables(selectedMonth, selectedYear);
  const createPayable = useCreatePayable();
  const updatePayable = useUpdatePayable();
  const deletePayable = useDeletePayable();
  const markAsPaid = useMarkPayableAsPaid();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [selectedPayable, setSelectedPayable] = useState<Payable | null>(null);
  const [paidValue, setPaidValue] = useState("");

  const [formData, setFormData] = useState<PayableInsert>({
    description: "",
    category: "custo_operacional",
    value: 0,
    due_date: "",
    reference_month: selectedMonth,
    reference_year: selectedYear,
    recurring: false,
  });

  const handleCreate = () => {
    setSelectedPayable(null);
    setFormData({
      description: "",
      category: "custo_operacional",
      value: 0,
      due_date: format(new Date(selectedYear, selectedMonth - 1, 10), "yyyy-MM-dd"),
      reference_month: selectedMonth,
      reference_year: selectedYear,
      recurring: false,
    });
    setDialogOpen(true);
  };

  const handleEdit = (payable: Payable) => {
    setSelectedPayable(payable);
    setFormData({
      description: payable.description,
      category: payable.category,
      value: payable.value,
      due_date: payable.due_date,
      reference_month: payable.reference_month,
      reference_year: payable.reference_year,
      supplier: payable.supplier || "",
      notes: payable.notes || "",
      recurring: payable.recurring,
    });
    setDialogOpen(true);
  };

  const handleDelete = (payable: Payable) => {
    setSelectedPayable(payable);
    setDeleteDialogOpen(true);
  };

  const handlePayClick = (payable: Payable) => {
    setSelectedPayable(payable);
    setPaidValue(payable.value.toString());
    setPayDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (selectedPayable) {
      await updatePayable.mutateAsync({ id: selectedPayable.id, ...formData });
    } else {
      await createPayable.mutateAsync(formData);
    }
    setDialogOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (selectedPayable) {
      await deletePayable.mutateAsync(selectedPayable.id);
      setDeleteDialogOpen(false);
    }
  };

  const handleConfirmPay = async () => {
    if (selectedPayable) {
      await markAsPaid.mutateAsync({ 
        id: selectedPayable.id, 
        paid_value: parseFloat(paidValue) 
      });
      setPayDialogOpen(false);
    }
  };

  const getStatusBadge = (payable: Payable) => {
    if (payable.status === "paid") {
      return <Badge className="bg-green-500">Pago</Badge>;
    }
    const now = new Date();
    const dueDate = new Date(payable.due_date);
    const daysUntilDue = differenceInDays(dueDate, now);
    
    if (daysUntilDue < 0) {
      return <Badge variant="destructive">Vencido ({Math.abs(daysUntilDue)} dias)</Badge>;
    }
    if (daysUntilDue <= 7) {
      return <Badge className="bg-orange-500">Vence em {daysUntilDue} dias</Badge>;
    }
    return <Badge variant="secondary">Pendente</Badge>;
  };

  const getCategoryLabel = (category: string) => {
    return CATEGORIES.find(c => c.value === category)?.label || category;
  };

  const totalPending = payables?.filter(p => p.status === "pending").reduce((sum, p) => sum + p.value, 0) || 0;
  const totalPaid = payables?.filter(p => p.status === "paid").reduce((sum, p) => sum + (p.paid_value || p.value), 0) || 0;

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
        <Card className="p-4 bg-orange-500/10 border-orange-500/20">
          <p className="text-sm text-muted-foreground">Pendente</p>
          <p className="text-2xl font-bold text-orange-500">
            R$ {totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </Card>
        <Card className="p-4 bg-green-500/10 border-green-500/20">
          <p className="text-sm text-muted-foreground">Pago</p>
          <p className="text-2xl font-bold text-green-500">
            R$ {totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </Card>
      </div>

      {/* Table */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Contas a Pagar</h3>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Conta
          </Button>
        </div>

        {!payables || payables.length === 0 ? (
          <div className="text-center py-12">
            <Receipt className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma conta a pagar</h3>
            <p className="text-muted-foreground mb-4">
              Adicione as despesas previstas para este período
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
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Descrição</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Categoria</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Valor</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Vencimento</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {payables.map((payable) => (
                  <tr key={payable.id} className="border-b hover:bg-secondary/50 transition-colors">
                    <td className="py-3 px-4 font-medium">
                      {payable.description}
                      {payable.recurring && (
                        <Badge variant="outline" className="ml-2 text-xs">Recorrente</Badge>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="secondary">{getCategoryLabel(payable.category)}</Badge>
                    </td>
                    <td className="py-3 px-4 font-semibold text-destructive">
                      R$ {payable.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4">
                      {format(new Date(payable.due_date), "dd/MM/yyyy")}
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(payable)}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1">
                        {payable.status === "pending" && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handlePayClick(payable)}
                            title="Marcar como pago"
                          >
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(payable)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(payable)}>
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
              {selectedPayable ? "Editar Conta a Pagar" : "Nova Conta a Pagar"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Descrição *</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Ex: Aluguel"
              />
            </div>
            <div className="space-y-2">
              <Label>Categoria *</Label>
              <Select 
                value={formData.category} 
                onValueChange={(v) => setFormData({ ...formData, category: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              <Label>Fornecedor</Label>
              <Input
                value={formData.supplier || ""}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                placeholder="Nome do fornecedor"
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="recurring"
                checked={formData.recurring}
                onCheckedChange={(checked) => setFormData({ ...formData, recurring: !!checked })}
              />
              <Label htmlFor="recurring" className="cursor-pointer">Despesa recorrente (mensal)</Label>
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
            <Button onClick={handleSubmit} disabled={createPayable.isPending || updatePayable.isPending}>
              {(createPayable.isPending || updatePayable.isPending) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {selectedPayable ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pay Dialog */}
      <Dialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pagamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Confirme o valor pago para "{selectedPayable?.description}"
            </p>
            <div className="space-y-2">
              <Label>Valor Pago</Label>
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
              Confirmar Pagamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir conta a pagar?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{selectedPayable?.description}"?
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
