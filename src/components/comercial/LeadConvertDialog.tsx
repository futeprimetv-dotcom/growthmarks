import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Lead, useUpdateLead } from "@/hooks/useLeads";
import { useCreateClient } from "@/hooks/useClients";
import { useCreateLeadHistory } from "@/hooks/useLeadHistory";
import { UserPlus, ArrowRight, Check } from "lucide-react";
import { toast } from "sonner";

interface LeadConvertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead | null;
}

export function LeadConvertDialog({ open, onOpenChange, lead }: LeadConvertDialogProps) {
  const [clientData, setClientData] = useState({
    name: "",
    contact_name: "",
    contact_email: "",
    contact_phone: "",
    monthly_value: 0,
    notes: "",
  });
  const [isConverting, setIsConverting] = useState(false);

  const createClient = useCreateClient();
  const updateLead = useUpdateLead();
  const createHistory = useCreateLeadHistory();

  // Pre-fill form when lead changes or dialog opens
  useEffect(() => {
    if (lead && open) {
      setClientData({
        name: lead.company || lead.name,
        contact_name: lead.name,
        contact_email: lead.email || "",
        contact_phone: lead.phone || lead.whatsapp || "",
        monthly_value: lead.estimated_value || 0,
        notes: lead.notes || "",
      });
    }
  }, [lead, open]);

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset form when closing
      setClientData({
        name: "",
        contact_name: "",
        contact_email: "",
        contact_phone: "",
        monthly_value: 0,
        notes: "",
      });
    }
    onOpenChange(newOpen);
  };

  const handleConvert = async () => {
    if (!lead) return;

    if (!clientData.name.trim()) {
      toast.error("Nome do cliente é obrigatório");
      return;
    }

    setIsConverting(true);

    try {
      // 1. Create the client
      const newClient = await createClient.mutateAsync({
        name: clientData.name,
        contact_name: clientData.contact_name,
        contact_email: clientData.contact_email,
        contact_phone: clientData.contact_phone,
        monthly_value: clientData.monthly_value,
        notes: clientData.notes,
        status: "active",
        responsible_id: lead.responsible_id,
      });

      // 2. Update lead with conversion info
      await updateLead.mutateAsync({
        id: lead.id,
        status: "fechamento",
        converted_to_client_id: newClient.id,
      });

      // 3. Add history entry
      await createHistory.mutateAsync({
        lead_id: lead.id,
        action_type: "conversao",
        description: `Lead convertido para cliente: ${clientData.name}`,
      });

      toast.success("Lead convertido para cliente com sucesso!");
      onOpenChange(false);
    } catch (error) {
      console.error("Erro na conversão:", error);
    } finally {
      setIsConverting(false);
    }
  };

  if (!lead) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Converter Lead para Cliente
          </DialogTitle>
          <DialogDescription>
            Transforme este lead em um cliente ativo do sistema
          </DialogDescription>
        </DialogHeader>

        {/* Lead Info */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Lead:</span>
            <span className="font-medium">{lead.name}</span>
          </div>
          {lead.company && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Empresa:</span>
              <span>{lead.company}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Valor Estimado:</span>
            <Badge variant="secondary">R$ {(lead.estimated_value || 0).toLocaleString('pt-BR')}</Badge>
          </div>
        </div>

        <div className="flex items-center justify-center py-2">
          <ArrowRight className="h-5 w-5 text-muted-foreground" />
        </div>

        {/* Client Form */}
        <div className="space-y-4">
          <div>
            <Label>Nome do Cliente/Empresa *</Label>
            <Input
              value={clientData.name}
              onChange={(e) => setClientData({ ...clientData, name: e.target.value })}
              placeholder="Nome do cliente ou empresa"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Contato</Label>
              <Input
                value={clientData.contact_name}
                onChange={(e) => setClientData({ ...clientData, contact_name: e.target.value })}
                placeholder="Nome do contato"
              />
            </div>
            <div>
              <Label>Valor Mensal (R$)</Label>
              <Input
                type="number"
                value={clientData.monthly_value}
                onChange={(e) => setClientData({ ...clientData, monthly_value: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>E-mail</Label>
              <Input
                type="email"
                value={clientData.contact_email}
                onChange={(e) => setClientData({ ...clientData, contact_email: e.target.value })}
              />
            </div>
            <div>
              <Label>Telefone</Label>
              <Input
                value={clientData.contact_phone}
                onChange={(e) => setClientData({ ...clientData, contact_phone: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label>Observações</Label>
            <Textarea
              value={clientData.notes}
              onChange={(e) => setClientData({ ...clientData, notes: e.target.value })}
              placeholder="Notas sobre o cliente..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isConverting}>
            Cancelar
          </Button>
          <Button onClick={handleConvert} disabled={isConverting}>
            {isConverting ? (
              "Convertendo..."
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Converter para Cliente
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
