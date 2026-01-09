import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Mail, CheckCircle2, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { type ContractWithClient } from "@/hooks/useContracts";
import { useContractServices } from "@/hooks/useContractServices";
import { toast } from "sonner";

interface SendSignatureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract: ContractWithClient | null;
  onSuccess?: () => void;
}

export function SendSignatureDialog({ 
  open, 
  onOpenChange, 
  contract,
  onSuccess 
}: SendSignatureDialogProps) {
  const [isSending, setIsSending] = useState(false);
  const [formData, setFormData] = useState({
    signerEmail: contract?.client?.contact_email || "",
    signerName: contract?.client?.contact_name || contract?.client?.name || "",
  });
  const { data: contractServices } = useContractServices(contract?.id);

  const handleSend = async () => {
    if (!contract) return;

    if (!formData.signerEmail || !formData.signerName) {
      toast.error("Preencha todos os campos");
      return;
    }

    setIsSending(true);

    try {
      // Build services text
      let servicesText = contract.client?.plan || "Serviços de Marketing Digital";
      if (contractServices && contractServices.length > 0) {
        servicesText = contractServices
          .map(cs => cs.service?.name)
          .filter(Boolean)
          .join(", ");
      }

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Você precisa estar logado");
        return;
      }

      const response = await supabase.functions.invoke("send-contract-signature", {
        body: {
          contractId: contract.id,
          signerEmail: formData.signerEmail,
          signerName: formData.signerName,
          contractDetails: {
            clientName: contract.client?.name || "",
            companyName: "Growth Marks",
            value: `R$ ${contract.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            services: servicesText,
            startDate: new Date(contract.start_date).toLocaleDateString('pt-BR'),
          },
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      toast.success("Email de assinatura enviado com sucesso!");
      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      console.error("Error sending signature email:", err);
      toast.error("Erro ao enviar email de assinatura");
    } finally {
      setIsSending(false);
    }
  };

  const signatureStatus = (contract as any)?.signature_status;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Enviar para Assinatura
          </DialogTitle>
          <DialogDescription>
            Envie o contrato por email para assinatura digital
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status Badge */}
          {signatureStatus && signatureStatus !== "pending" && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
              {signatureStatus === "signed" ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-700">Contrato Assinado</p>
                    <p className="text-xs text-muted-foreground">
                      Assinado por {(contract as any)?.signer_name}
                    </p>
                  </div>
                </>
              ) : signatureStatus === "sent" ? (
                <>
                  <Mail className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-700">Aguardando Assinatura</p>
                    <p className="text-xs text-muted-foreground">
                      Email enviado para {(contract as any)?.signer_email}
                    </p>
                  </div>
                </>
              ) : null}
            </div>
          )}

          {/* Contract Info */}
          <div className="p-3 bg-muted/50 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Cliente:</span>
              <span className="font-medium">{contract?.client?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Valor:</span>
              <span className="font-medium">
                R$ {contract?.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signerName">Nome do Signatário *</Label>
              <Input
                id="signerName"
                value={formData.signerName}
                onChange={(e) => setFormData({ ...formData, signerName: e.target.value })}
                placeholder="Nome completo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="signerEmail">Email do Signatário *</Label>
              <Input
                id="signerEmail"
                type="email"
                value={formData.signerEmail}
                onChange={(e) => setFormData({ ...formData, signerEmail: e.target.value })}
                placeholder="email@exemplo.com"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSend} 
              disabled={isSending || signatureStatus === "signed"}
            >
              {isSending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  {signatureStatus === "sent" ? "Reenviar Email" : "Enviar para Assinatura"}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
