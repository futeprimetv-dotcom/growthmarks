import { useState } from "react";
import { useExpenses, useDeleteExpense, Expense } from "@/hooks/useExpenses";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
import { ExpenseFormDialog } from "@/components/financeiro/ExpenseFormDialog";
import { Laptop, Users, TrendingUp, Wallet, Plus, Pencil, Trash2, Receipt } from "lucide-react";

export function DespesasTab() {
  const { data: expenses, isLoading } = useExpenses();
  const deleteExpense = useDeleteExpense();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);

  const operationalCosts = expenses?.filter(e => e.category === 'custo_operacional').reduce((sum, e) => sum + e.value, 0) || 0;
  const personnelCosts = expenses?.filter(e => e.category === 'despesa').reduce((sum, e) => sum + e.value, 0) || 0;
  const investments = expenses?.filter(e => e.category === 'investimento').reduce((sum, e) => sum + e.value, 0) || 0;
  const totalExpenses = expenses?.reduce((sum, e) => sum + e.value, 0) || 0;

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'custo_operacional': return 'Custo Operacional';
      case 'despesa': return 'Despesa';
      case 'investimento': return 'Investimento';
      default: return category;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'custo_operacional': return 'bg-blue-500/20 text-blue-400';
      case 'despesa': return 'bg-purple-500/20 text-purple-400';
      case 'investimento': return 'bg-primary/20 text-primary';
      default: return 'bg-secondary';
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setDialogOpen(true);
  };

  const handleDeleteClick = (expense: Expense) => {
    setExpenseToDelete(expense);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (expenseToDelete) {
      deleteExpense.mutate(expenseToDelete.id);
      setDeleteDialogOpen(false);
      setExpenseToDelete(null);
    }
  };

  const handleAddNew = () => {
    setEditingExpense(null);
    setDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6 bg-blue-500/10 border-blue-500/20">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-blue-500/20">
              <Laptop className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Custos Operacionais</p>
              <p className="text-xl font-bold text-blue-400">
                R$ {operationalCosts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-6 bg-purple-500/10 border-purple-500/20">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-purple-500/20">
              <Users className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Despesas</p>
              <p className="text-xl font-bold text-purple-400">
                R$ {personnelCosts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-6 bg-primary/10 border-primary/20">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-primary/20">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Investimentos</p>
              <p className="text-xl font-bold text-primary">
                R$ {investments.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-6 bg-destructive/10 border-destructive/20">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-destructive/20">
              <Wallet className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Saídas</p>
              <p className="text-xl font-bold text-destructive">
                R$ {totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Expenses Table */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Despesas & Custos</h3>
          <Button onClick={handleAddNew}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Despesa
          </Button>
        </div>

        {!expenses || expenses.length === 0 ? (
          <div className="text-center py-12">
            <Receipt className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma despesa cadastrada</h3>
            <p className="text-muted-foreground mb-4">
              Comece cadastrando suas despesas e custos
            </p>
            <Button onClick={handleAddNew}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Primeira Despesa
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
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Data</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Recorrente</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense.id} className="border-b hover:bg-secondary/50 transition-colors">
                    <td className="py-3 px-4 font-medium">{expense.description}</td>
                    <td className="py-3 px-4">
                      <Badge variant="secondary" className={getCategoryColor(expense.category)}>
                        {getCategoryLabel(expense.category)}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 font-semibold text-destructive">
                      R$ {expense.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4">
                      {new Date(expense.date).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-3 px-4">
                      {expense.recurring ? (
                        <Badge variant="outline">Mensal</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(expense)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(expense)}>
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

      <ExpenseFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        expense={editingExpense}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir despesa?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{expenseToDelete?.description}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
