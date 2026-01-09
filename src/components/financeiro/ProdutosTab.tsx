import { useState } from "react";
import { useProducts, useDeleteProduct } from "@/hooks/useProducts";
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
import { ProductFormDialog } from "@/components/financeiro/ProductFormDialog";
import { Package, CheckCircle2, Plus, Pencil, Trash2 } from "lucide-react";

type ProductWithClient = {
  id: string;
  name: string;
  client_id: string | null;
  value: number;
  delivery_date: string | null;
  status: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  clients: { name: string } | null;
};

export function ProdutosTab() {
  const { data: products, isLoading } = useProducts();
  const deleteProduct = useDeleteProduct();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductWithClient | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<ProductWithClient | null>(null);

  const paidProducts = products?.filter(p => p.status === 'paid') || [];
  const pendingProducts = products?.filter(p => p.status !== 'paid') || [];
  const totalReceived = paidProducts.reduce((sum, p) => sum + (p.value || 0), 0);
  const totalPending = pendingProducts.reduce((sum, p) => sum + (p.value || 0), 0);

  const getStatusLabel = (status: string | null) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'in_progress': return 'Em Andamento';
      case 'delivered': return 'Entregue';
      case 'paid': return 'Pago';
      default: return status || 'Pendente';
    }
  };

  const getStatusClass = (status: string | null) => {
    switch (status) {
      case 'paid': return 'bg-success hover:bg-success/90';
      case 'delivered': return 'bg-primary hover:bg-primary/90';
      case 'in_progress': return 'bg-warning hover:bg-warning/90';
      default: return '';
    }
  };

  const handleEdit = (product: ProductWithClient) => {
    setEditingProduct(product);
    setDialogOpen(true);
  };

  const handleDeleteClick = (product: ProductWithClient) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (productToDelete) {
      deleteProduct.mutate(productToDelete.id);
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    }
  };

  const handleAddNew = () => {
    setEditingProduct(null);
    setDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6 bg-success/10 border-success/20">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-success/20">
              <CheckCircle2 className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Recebido</p>
              <p className="text-2xl font-bold text-success">
                R$ {totalReceived.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-6 bg-warning/10 border-warning/20">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-warning/20">
              <Package className="h-6 w-6 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">A Receber</p>
              <p className="text-2xl font-bold text-warning">
                R$ {totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Products Table */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Projetos / Produtos</h3>
          <Button onClick={handleAddNew}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Produto
          </Button>
        </div>

        {!products || products.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Nenhum produto cadastrado</h3>
            <p className="text-muted-foreground mb-4">
              Comece cadastrando seus produtos e projetos
            </p>
            <Button onClick={handleAddNew}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Primeiro Produto
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Produto</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Cliente</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Valor</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Entrega</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {(products as ProductWithClient[]).map((product) => (
                  <tr key={product.id} className="border-b hover:bg-secondary/50 transition-colors">
                    <td className="py-3 px-4 font-medium">{product.name}</td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {product.clients?.name || "Sem cliente"}
                    </td>
                    <td className="py-3 px-4 font-semibold">
                      R$ {product.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4">
                      {product.delivery_date ? new Date(product.delivery_date).toLocaleDateString('pt-BR') : "-"}
                    </td>
                    <td className="py-3 px-4">
                      <Badge 
                        variant={product.status === 'paid' || product.status === 'delivered' ? 'default' : 'secondary'}
                        className={getStatusClass(product.status)}
                      >
                        {getStatusLabel(product.status)}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(product)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(product)}>
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

      <ProductFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        product={editingProduct as any}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir produto?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{productToDelete?.name}"? Esta ação não pode ser desfeita.
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
