import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useSalesFunnels } from "@/hooks/useSalesFunnels";
import { useSendProspectsToFunnel, useSendCNPJToFunnel } from "@/hooks/useProspects";
import type { CNPJLookupResult } from "@/hooks/useCNPJLookup";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedProspects: string[];
  cnpjData?: CNPJLookupResult;
  onSuccess: () => void;
}

export function SendToFunnelDialog({ open, onOpenChange, selectedProspects, cnpjData, onSuccess }: Props) {
  const [funnelId, setFunnelId] = useState<string>("");
  const { data: funnels } = useSalesFunnels();
  const sendMutation = useSendProspectsToFunnel();
  const sendCNPJMutation = useSendCNPJToFunnel();

  const handleSubmit = async () => {
    if (!funnelId) return;
    
    if (cnpjData) {
      // Send CNPJ data directly to funnel
      await sendCNPJMutation.mutateAsync({
        cnpjData,
        funnelId
      });
    } else {
      // Send selected prospects to funnel
      await sendMutation.mutateAsync({
        prospectIds: selectedProspects,
        funnelId
      });
    }
    
    onSuccess();
    onOpenChange(false);
    setFunnelId("");
  };

  const isPending = sendMutation.isPending || sendCNPJMutation.isPending;
  const count = cnpjData ? 1 : selectedProspects.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enviar para Funil</DialogTitle>
          <DialogDescription>
            {cnpjData 
              ? `Enviar "${cnpjData.nomeFantasia || cnpjData.razaoSocial}" como lead para o funil selecionado.`
              : `Selecione o funil para onde deseja enviar ${count} prospecto(s) como leads.`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Funil de destino</Label>
            <Select value={funnelId} onValueChange={setFunnelId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um funil" />
              </SelectTrigger>
              <SelectContent>
                {funnels?.map((funnel) => (
                  <SelectItem key={funnel.id} value={funnel.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: funnel.color || "#f97316" }}
                      />
                      {funnel.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!funnelId || isPending}>
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Enviar para Funil
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
