import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Service, ServiceInsert, useCreateService, useUpdateService } from "@/hooks/useServices";
import { useClients } from "@/hooks/useClients";

interface ServiceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service?: Service | null;
}

export function ServiceFormDialog({ open, onOpenChange, service }: ServiceFormDialogProps) {
  const { data: clients } = useClients();
  
  const [formData, setFormData] = useState<Partial<ServiceInsert>>({
    name: "",
    client_id: "",
    monthly_value: 0,
    start_date: new Date().toISOString().split("T")[0],
    status: "active",
    notes: "",
  });

  const createService = useCreateService();
  const updateService = useUpdateService();

  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name,
        client_id: service.client_id,
        monthly_value: service.monthly_value,
        start_date: service.start_date || "",
        status: service.status || "active",
        notes: service.notes || "",
      });
    } else {
      setFormData({
        name: "",
        client_id: "",
        monthly_value: 0,
        start_date: new Date().toISOString().split("T")[0],
        status: "active",
        notes: "",
      });
    }
  }, [service, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.client_id || !formData.monthly_value) {
      return;
    }

    if (service) {
      updateService.mutate(
        { id: service.id, ...formData },
        { onSuccess: () => onOpenChange(false) }
      );
    } else {
      createService.mutate(
        formData as ServiceInsert,
        { onSuccess: () => onOpenChange(false) }
      );
    }
  };

  const isLoading = createService.isPending || updateService.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{service ? "Editar Serviço" : "Novo Serviço"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Serviço *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Social Media, Tráfego Pago, etc."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="client_id">Cliente *</Label>
            <Select
              value={formData.client_id}
              onValueChange={(value) => setFormData({ ...formData, client_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o cliente" />
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="monthly_value">Valor Mensal (R$) *</Label>
              <Input
                id="monthly_value"
                type="number"
                step="0.01"
                min="0"
                value={formData.monthly_value || ""}
                onChange={(e) => setFormData({ ...formData, monthly_value: parseFloat(e.target.value) || 0 })}
                placeholder="0,00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="start_date">Data Início</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date || ""}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status || "active"}
              onValueChange={(value) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
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
              {isLoading ? "Salvando..." : service ? "Atualizar" : "Criar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
