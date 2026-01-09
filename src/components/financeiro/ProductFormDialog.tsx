import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Product, ProductInsert, useCreateProduct, useUpdateProduct } from "@/hooks/useProducts";
import { useClients } from "@/hooks/useClients";

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
}

export function ProductFormDialog({ open, onOpenChange, product }: ProductFormDialogProps) {
  const { data: clients } = useClients();
  
  const [formData, setFormData] = useState<Partial<ProductInsert>>({
    name: "",
    client_id: "",
    value: 0,
    delivery_date: "",
    status: "pending",
    notes: "",
  });

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        client_id: product.client_id || "",
        value: product.value,
        delivery_date: product.delivery_date || "",
        status: product.status || "pending",
        notes: product.notes || "",
      });
    } else {
      setFormData({
        name: "",
        client_id: "",
        value: 0,
        delivery_date: "",
        status: "pending",
        notes: "",
      });
    }
  }, [product, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.value) {
      return;
    }

    const dataToSubmit = {
      ...formData,
      client_id: formData.client_id || null,
    };

    if (product) {
      updateProduct.mutate(
        { id: product.id, ...dataToSubmit },
        { onSuccess: () => onOpenChange(false) }
      );
    } else {
      createProduct.mutate(
        dataToSubmit as ProductInsert,
        { onSuccess: () => onOpenChange(false) }
      );
    }
  };

  const isLoading = createProduct.isPending || updateProduct.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{product ? "Editar Produto" : "Novo Produto"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Produto/Projeto *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Website, Landing Page, etc."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="client_id">Cliente</Label>
            <Select
              value={formData.client_id || "none"}
              onValueChange={(value) => setFormData({ ...formData, client_id: value === "none" ? "" : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem cliente</SelectItem>
                {clients?.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
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
              <Label htmlFor="delivery_date">Data de Entrega</Label>
              <Input
                id="delivery_date"
                type="date"
                value={formData.delivery_date || ""}
                onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status || "pending"}
              onValueChange={(value) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="in_progress">Em Andamento</SelectItem>
                <SelectItem value="delivered">Entregue</SelectItem>
                <SelectItem value="paid">Pago</SelectItem>
              </SelectContent>
            </Select>
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
              {isLoading ? "Salvando..." : product ? "Atualizar" : "Criar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
