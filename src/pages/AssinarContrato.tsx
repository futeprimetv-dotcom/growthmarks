import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, CheckCircle2, XCircle, Pen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ContractData {
  id: string;
  client: { name: string } | null;
  value: number;
  start_date: string;
  end_date: string | null;
  type: string;
  signature_status: string;
  signer_name: string;
  signer_email: string;
  signed_at: string | null;
}

export default function AssinarContrato() {
  const { token } = useParams<{ token: string }>();
  const [contract, setContract] = useState<ContractData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigning, setIsSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    signerName: "",
    acceptTerms: false,
  });

  useEffect(() => {
    const fetchContract = async () => {
      if (!token) {
        setError("Token inválido");
        setIsLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from("contracts")
          .select(`
            id,
            value,
            start_date,
            end_date,
            type,
            signature_status,
            signer_name,
            signer_email,
            signed_at,
            client:clients(name)
          `)
          .eq("signature_token", token)
          .single();

        if (fetchError || !data) {
          setError("Contrato não encontrado ou link expirado");
          return;
        }

        setContract(data as unknown as ContractData);
        setFormData(prev => ({
          ...prev,
          signerName: (data as any).signer_name || "",
        }));
      } catch (err) {
        console.error("Error fetching contract:", err);
        setError("Erro ao carregar contrato");
      } finally {
        setIsLoading(false);
      }
    };

    fetchContract();
  }, [token]);

  const handleSign = async () => {
    if (!formData.signerName.trim()) {
      toast.error("Por favor, informe seu nome completo");
      return;
    }

    if (!formData.acceptTerms) {
      toast.error("Você precisa aceitar os termos para assinar");
      return;
    }

    setIsSigning(true);

    try {
      // Get user IP (simple approach)
      let userIp = "unknown";
      try {
        const ipResponse = await fetch("https://api.ipify.org?format=json");
        const ipData = await ipResponse.json();
        userIp = ipData.ip;
      } catch {
        console.log("Could not get IP");
      }

      const { error: updateError } = await supabase
        .from("contracts")
        .update({
          signature_status: "signed",
          signed_at: new Date().toISOString(),
          signer_name: formData.signerName,
          signer_ip: userIp,
        })
        .eq("signature_token", token);

      if (updateError) throw updateError;

      toast.success("Contrato assinado com sucesso!");
      
      // Refresh contract data
      setContract(prev => prev ? {
        ...prev,
        signature_status: "signed",
        signed_at: new Date().toISOString(),
        signer_name: formData.signerName,
      } : null);
    } catch (err) {
      console.error("Error signing contract:", err);
      toast.error("Erro ao assinar contrato");
    } finally {
      setIsSigning(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Carregando contrato...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-destructive/10 to-secondary/10">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <XCircle className="h-12 w-12 text-destructive mb-4" />
            <h2 className="text-xl font-semibold mb-2">Erro</h2>
            <p className="text-muted-foreground text-center">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (contract?.signature_status === "signed") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-700 dark:text-green-400">
              Contrato Assinado!
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Este contrato foi assinado com sucesso.
            </p>
            <div className="bg-muted/50 rounded-lg p-4 text-sm">
              <p><strong>Assinado por:</strong> {contract.signer_name}</p>
              <p><strong>Data:</strong> {contract.signed_at ? new Date(contract.signed_at).toLocaleString('pt-BR') : '-'}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <FileText className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-2xl">Assinatura de Contrato</CardTitle>
            <p className="text-muted-foreground">
              Revise os detalhes e assine digitalmente
            </p>
          </CardHeader>
        </Card>

        {/* Contract Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Detalhes do Contrato
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground font-medium">CLIENTE</p>
                <p className="font-semibold">{contract?.client?.name || '-'}</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground font-medium">VALOR MENSAL</p>
                <p className="font-semibold">
                  R$ {contract?.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground font-medium">INÍCIO</p>
                <p className="font-semibold">
                  {contract?.start_date ? new Date(contract.start_date).toLocaleDateString('pt-BR') : '-'}
                </p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground font-medium">TIPO</p>
                <Badge variant="outline" className="mt-1">
                  {contract?.type === 'mensal' ? 'Mensal' : 
                   contract?.type === 'trimestral' ? 'Trimestral' :
                   contract?.type === 'semestral' ? 'Semestral' :
                   contract?.type === 'anual' ? 'Anual' : 'Projeto'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Signature Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Pen className="h-5 w-5" />
              Assinar Contrato
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="signerName">Nome Completo do Signatário *</Label>
              <Input
                id="signerName"
                value={formData.signerName}
                onChange={(e) => setFormData({ ...formData, signerName: e.target.value })}
                placeholder="Digite seu nome completo"
                className="text-lg"
              />
              <p className="text-xs text-muted-foreground">
                Este nome será registrado como assinatura digital do contrato
              </p>
            </div>

            <div className="flex items-start space-x-3 p-4 bg-muted/50 rounded-lg">
              <Checkbox
                id="acceptTerms"
                checked={formData.acceptTerms}
                onCheckedChange={(checked) => setFormData({ ...formData, acceptTerms: !!checked })}
              />
              <div className="space-y-1">
                <Label htmlFor="acceptTerms" className="cursor-pointer">
                  Li e concordo com os termos do contrato
                </Label>
                <p className="text-xs text-muted-foreground">
                  Ao marcar esta opção, você declara que leu e concorda com todos os termos e condições do contrato acima descrito.
                </p>
              </div>
            </div>

            <Button 
              onClick={handleSign} 
              className="w-full h-12 text-lg"
              disabled={isSigning || !formData.signerName || !formData.acceptTerms}
            >
              {isSigning ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Assinando...
                </>
              ) : (
                <>
                  <Pen className="mr-2 h-5 w-5" />
                  Assinar Contrato Digitalmente
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Sua assinatura digital tem validade jurídica conforme a legislação brasileira.
              O registro incluirá seu nome, data, hora e endereço IP.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
