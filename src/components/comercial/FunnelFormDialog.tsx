import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useCreateFunnel, useUpdateFunnel, SalesFunnel } from "@/hooks/useSalesFunnels";

const colorOptions = [
  { name: "Laranja", value: "#f97316" },
  { name: "Azul", value: "#3b82f6" },
  { name: "Verde", value: "#22c55e" },
  { name: "Roxo", value: "#8b5cf6" },
  { name: "Rosa", value: "#ec4899" },
  { name: "Vermelho", value: "#ef4444" },
  { name: "Amarelo", value: "#eab308" },
  { name: "Ciano", value: "#06b6d4" },
];

interface FunnelFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  funnel?: SalesFunnel | null;
}

export function FunnelFormDialog({ open, onOpenChange, funnel }: FunnelFormDialogProps) {
  const createFunnel = useCreateFunnel();
  const updateFunnel = useUpdateFunnel();
  const isEditing = !!funnel;

  const [formData, setFormData] = useState({
    name: funnel?.name || "",
    description: funnel?.description || "",
    color: funnel?.color || "#f97316",
  });

  const handleSubmit = () => {
    if (!formData.name.trim()) return;

    if (isEditing && funnel) {
      updateFunnel.mutate(
        { id: funnel.id, ...formData },
        { onSuccess: () => onOpenChange(false) }
      );
    } else {
      createFunnel.mutate(formData, {
        onSuccess: () => {
          onOpenChange(false);
          setFormData({ name: "", description: "", color: "#f97316" });
        },
      });
    }
  };

  const isPending = createFunnel.isPending || updateFunnel.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Funil" : "Novo Funil"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nome do Funil</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Produtos, Serviços Recorrentes..."
            />
          </div>
          <div className="space-y-2">
            <Label>Descrição (opcional)</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descreva o propósito deste funil..."
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label>Cor</Label>
            <div className="flex gap-2 flex-wrap">
              {colorOptions.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: color.value })}
                  className={`w-8 h-8 rounded-lg transition-all ${
                    formData.color === color.value
                      ? "ring-2 ring-offset-2 ring-offset-background ring-primary scale-110"
                      : "hover:scale-105"
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || !formData.name.trim()}>
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isEditing ? "Salvar" : "Criar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
