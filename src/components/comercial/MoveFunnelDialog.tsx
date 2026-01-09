import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSalesFunnels } from "@/hooks/useSalesFunnels";
import { useUpdateLead, Lead } from "@/hooks/useLeads";
import { toast } from "sonner";
import { ArrowRightLeft } from "lucide-react";

interface MoveFunnelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead | null;
}

export function MoveFunnelDialog({ open, onOpenChange, lead }: MoveFunnelDialogProps) {
  const { data: funnels = [] } = useSalesFunnels();
  const updateLead = useUpdateLead();
  const [selectedFunnelId, setSelectedFunnelId] = useState<string>("");

  const activeFunnels = funnels.filter(f => f.is_active);
  const currentFunnel = funnels.find(f => f.id === (lead as any)?.funnel_id);
  const otherFunnels = activeFunnels.filter(f => f.id !== (lead as any)?.funnel_id);

  const handleMove = async () => {
    if (!lead || !selectedFunnelId) return;

    try {
      await updateLead.mutateAsync({
        id: lead.id,
        funnel_id: selectedFunnelId,
      } as any);

      const targetFunnel = funnels.find(f => f.id === selectedFunnelId);
      toast.success(`Lead movido para o funil "${targetFunnel?.name}"`);
      onOpenChange(false);
      setSelectedFunnelId("");
    } catch (error) {
      toast.error("Erro ao mover lead");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Mover Lead para Outro Funil
          </DialogTitle>
          <DialogDescription>
            Mova o lead "{lead?.name}" para um funil diferente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {currentFunnel && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: currentFunnel.color || '#f97316' }}
              />
              <span className="text-sm text-muted-foreground">Funil atual:</span>
              <span className="font-medium">{currentFunnel.name}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label>Mover para</Label>
            <Select value={selectedFunnelId} onValueChange={setSelectedFunnelId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o funil de destino" />
              </SelectTrigger>
              <SelectContent>
                {otherFunnels.map((funnel) => (
                  <SelectItem key={funnel.id} value={funnel.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: funnel.color || '#f97316' }}
                      />
                      {funnel.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {otherFunnels.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Não há outros funis disponíveis. Crie um novo funil primeiro.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleMove} 
            disabled={!selectedFunnelId || updateLead.isPending}
          >
            {updateLead.isPending ? "Movendo..." : "Mover Lead"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
