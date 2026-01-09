import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Expense, ExpenseInsert, useCreateExpense, useUpdateExpense } from "@/hooks/useExpenses";

interface ExpenseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense?: Expense | null;
}

export function ExpenseFormDialog({ open, onOpenChange, expense }: ExpenseFormDialogProps) {
  const [formData, setFormData] = useState<Partial<ExpenseInsert>>({
    description: "",
    category: "custo_operacional",
    value: 0,
    date: new Date().toISOString().split("T")[0],
    recurring: false,
    notes: "",
  });

  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();

  useEffect(() => {
    if (expense) {
      setFormData({
        description: expense.description,
        category: expense.category,
        value: expense.value,
        date: expense.date,
        recurring: expense.recurring || false,
        notes: expense.notes || "",
      });
    } else {
      setFormData({
        description: "",
        category: "custo_operacional",
        value: 0,
        date: new Date().toISOString().split("T")[0],
        recurring: false,
        notes: "",
      });
    }
  }, [expense, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.description || !formData.category || !formData.value || !formData.date) {
      return;
    }

    if (expense) {
      updateExpense.mutate(
        { id: expense.id, ...formData },
        { onSuccess: () => onOpenChange(false) }
      );
    } else {
      createExpense.mutate(
        formData as ExpenseInsert,
        { onSuccess: () => onOpenChange(false) }
      );
    }
  };

  const isLoading = createExpense.isPending || updateExpense.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{expense ? "Editar Despesa" : "Nova Despesa"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Descrição *</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Ex: Aluguel, Software, etc."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoria *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="custo_operacional">Custo Operacional</SelectItem>
                <SelectItem value="despesa">Despesa</SelectItem>
                <SelectItem value="investimento">Investimento</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="value">Valor (R$) *</Label>
              <Input
                id="value"
                type="number"
                step="0.01"
                min="0"
                value={formData.value || ""}
                onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                placeholder="0,00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Data *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="recurring"
              checked={formData.recurring || false}
              onCheckedChange={(checked) => setFormData({ ...formData, recurring: checked as boolean })}
            />
            <Label htmlFor="recurring" className="text-sm font-normal">
              Despesa recorrente (mensal)
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes || ""}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Observações adicionais..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Salvando..." : expense ? "Atualizar" : "Criar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
