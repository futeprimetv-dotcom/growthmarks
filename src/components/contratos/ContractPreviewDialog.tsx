import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download, Eye, Edit, Loader2, Layout } from "lucide-react";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { useContractTemplates, type ContractTemplate } from "@/hooks/useContractTemplates";
import { useContractServices } from "@/hooks/useContractServices";
import { type ContractWithClient } from "@/hooks/useContracts";
import { toast } from "sonner";

interface ContractPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract: ContractWithClient | null;
}

interface ContractData {
  // Company (Contractor)
  companyName: string;
  companyCnpj: string;
  companyAddress: string;
  companyCity: string;
  companyState: string;
  // Client (Contracted)
  clientName: string;
  clientCnpj: string;
  clientAddress: string;
  clientCity: string;
  clientState: string;
  clientContact: string;
  clientEmail: string;
  clientPhone: string;
  // Contract Details
  services: string;
  value: string;
  paymentTerms: string;
  startDate: string;
  endDate: string;
  duration: string;
  // Terms
  terms: string;
  // Template
  useTemplate: boolean;
  templateContent: string;
}

const defaultTerms = `CLÁUSULA 1ª - DO OBJETO
O presente contrato tem por objeto a prestação de serviços de marketing digital, conforme especificado acima.

CLÁUSULA 2ª - DAS OBRIGAÇÕES DA CONTRATADA
A CONTRATADA se obriga a:
a) Executar os serviços descritos com zelo e profissionalismo;
b) Manter sigilo sobre todas as informações do CONTRATANTE;
c) Entregar os trabalhos nos prazos acordados.

CLÁUSULA 3ª - DAS OBRIGAÇÕES DO CONTRATANTE
O CONTRATANTE se obriga a:
a) Fornecer as informações necessárias para execução dos serviços;
b) Efetuar os pagamentos nas datas acordadas;
c) Aprovar ou solicitar alterações em até 3 dias úteis.

CLÁUSULA 4ª - DO PAGAMENTO
O pagamento será realizado conforme condições estabelecidas, até o dia 10 de cada mês.

CLÁUSULA 5ª - DA VIGÊNCIA
O presente contrato vigorará pelo período especificado, podendo ser renovado mediante acordo entre as partes.

CLÁUSULA 6ª - DA RESCISÃO
O contrato poderá ser rescindido por qualquer das partes, mediante aviso prévio de 30 dias.

CLÁUSULA 7ª - DO FORO
Fica eleito o foro da comarca da sede da CONTRATADA para dirimir quaisquer dúvidas.`;

export function ContractPreviewDialog({ open, onOpenChange, contract }: ContractPreviewDialogProps) {
  const { data: companySettings } = useCompanySettings();
  const { data: templates } = useContractTemplates();
  const { data: contractServices } = useContractServices(contract?.id);
  const [tab, setTab] = useState<string>("edit");
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const printRef = useRef<HTMLDivElement>(null);

  const [contractData, setContractData] = useState<ContractData>({
    companyName: "",
    companyCnpj: "",
    companyAddress: "",
    companyCity: "",
    companyState: "",
    clientName: "",
    clientCnpj: "",
    clientAddress: "",
    clientCity: "",
    clientState: "",
    clientContact: "",
    clientEmail: "",
    clientPhone: "",
    services: "",
    value: "",
    paymentTerms: "Pagamento mensal até o dia 10",
    startDate: "",
    endDate: "",
    duration: "",
    terms: defaultTerms,
    useTemplate: false,
    templateContent: "",
  });

  useEffect(() => {
    if (contract && companySettings) {
      const startDate = new Date(contract.start_date);
      const endDate = contract.end_date ? new Date(contract.end_date) : null;
      
      let duration = "";
      if (endDate) {
        const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                       (endDate.getMonth() - startDate.getMonth());
        duration = `${months} meses`;
      } else {
        duration = "Indeterminado";
      }

      // Build services string from linked services
      let servicesText = contract.client?.plan || "Serviços de Marketing Digital";
      if (contractServices && contractServices.length > 0) {
        servicesText = contractServices
          .map(cs => cs.service?.name)
          .filter(Boolean)
          .join(", ");
      }

      setContractData({
        companyName: companySettings.name || "Growth Marks",
        companyCnpj: companySettings.cnpj || "",
        companyAddress: companySettings.address || "",
        companyCity: companySettings.city || "",
        companyState: companySettings.state || "",
        clientName: contract.client?.name || "",
        clientCnpj: (contract.client as any)?.cnpj || "",
        clientAddress: (contract.client as any)?.address || "",
        clientCity: (contract.client as any)?.city || "",
        clientState: (contract.client as any)?.state || "",
        clientContact: contract.client?.contact_name || "",
        clientEmail: contract.client?.contact_email || "",
        clientPhone: contract.client?.contact_phone || "",
        services: servicesText,
        value: `R$ ${contract.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        paymentTerms: "Pagamento mensal até o dia 10",
        startDate: startDate.toLocaleDateString('pt-BR'),
        endDate: endDate?.toLocaleDateString('pt-BR') || "Indeterminado",
        duration,
        terms: defaultTerms,
        useTemplate: false,
        templateContent: "",
      });
      setSelectedTemplateId("");
    }
  }, [contract, companySettings, contractServices]);

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    
    if (templateId && templates) {
      const template = templates.find(t => t.id === templateId);
      if (template) {
        setContractData(prev => ({
          ...prev,
          useTemplate: true,
          templateContent: template.content,
        }));
        toast.success(`Template "${template.name}" aplicado!`);
      }
    } else {
      setContractData(prev => ({
        ...prev,
        useTemplate: false,
        templateContent: "",
      }));
    }
  };

  const processTemplateContent = (content: string): string => {
    const today = new Date().toLocaleDateString('pt-BR', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
    
    const clientAddress = [
      contractData.clientAddress,
      contractData.clientCity,
      contractData.clientState
    ].filter(Boolean).join(", ");
    
    const companyAddress = [
      contractData.companyAddress,
      contractData.companyCity,
      contractData.companyState
    ].filter(Boolean).join(", ");

    return content
      .replace(/\{\{cliente_nome\}\}/g, contractData.clientName)
      .replace(/\{\{cliente_cnpj\}\}/g, contractData.clientCnpj || "Não informado")
      .replace(/\{\{cliente_endereco\}\}/g, clientAddress || "Não informado")
      .replace(/\{\{empresa_nome\}\}/g, contractData.companyName)
      .replace(/\{\{empresa_cnpj\}\}/g, contractData.companyCnpj || "Não informado")
      .replace(/\{\{empresa_endereco\}\}/g, companyAddress || "Não informado")
      .replace(/\{\{valor\}\}/g, contractData.value)
      .replace(/\{\{data_inicio\}\}/g, contractData.startDate)
      .replace(/\{\{data_fim\}\}/g, contractData.endDate)
      .replace(/\{\{cidade\}\}/g, contractData.companyCity || "Local")
      .replace(/\{\{data_atual\}\}/g, today);
  };

  const handleGeneratePDF = async () => {
    setIsGenerating(true);
    
    try {
      const printContent = printRef.current;
      if (!printContent) {
        throw new Error("Content not found");
      }

      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error("Could not open print window");
      }

      const styles = `
        <style>
          @page { margin: 2cm; }
          body { font-family: Arial, sans-serif; font-size: 12pt; line-height: 1.6; color: #333; }
          .contract-header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .contract-title { font-size: 24pt; font-weight: bold; margin-bottom: 10px; }
          .contract-subtitle { font-size: 14pt; color: #666; }
          .parties-section { margin: 30px 0; }
          .party { margin-bottom: 20px; padding: 15px; background: #f5f5f5; border-radius: 8px; }
          .party-title { font-weight: bold; font-size: 14pt; margin-bottom: 10px; }
          .party-info { font-size: 11pt; }
          .details-section { margin: 30px 0; }
          .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
          .detail-item { padding: 10px; background: #f9f9f9; border-radius: 4px; }
          .detail-label { font-weight: bold; font-size: 10pt; color: #666; }
          .detail-value { font-size: 12pt; margin-top: 5px; }
          .terms-section { margin: 30px 0; }
          .terms-title { font-size: 16pt; font-weight: bold; margin-bottom: 15px; }
          .terms-content { white-space: pre-wrap; font-size: 11pt; text-align: justify; }
          .signatures { margin-top: 60px; display: flex; justify-content: space-between; }
          .signature-block { width: 45%; text-align: center; }
          .signature-line { border-top: 1px solid #333; padding-top: 10px; margin-top: 60px; }
          .date-location { text-align: center; margin-top: 40px; font-size: 11pt; }
        </style>
      `;

      const today = new Date().toLocaleDateString('pt-BR', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      });

      // Check if using template or default format
      const bodyContent = contractData.useTemplate && contractData.templateContent
        ? processTemplateContent(contractData.templateContent)
        : `
          <div class="contract-header">
            <div class="contract-title">CONTRATO DE PRESTAÇÃO DE SERVIÇOS</div>
            <div class="contract-subtitle">Marketing Digital e Comunicação</div>
          </div>

          <div class="parties-section">
            <div class="party">
              <div class="party-title">CONTRATADA</div>
              <div class="party-info">
                <strong>${contractData.companyName}</strong><br>
                ${contractData.companyCnpj ? `CNPJ: ${contractData.companyCnpj}<br>` : ''}
                ${contractData.companyAddress ? `${contractData.companyAddress}<br>` : ''}
                ${contractData.companyCity && contractData.companyState ? `${contractData.companyCity} - ${contractData.companyState}` : ''}
              </div>
            </div>

            <div class="party">
              <div class="party-title">CONTRATANTE</div>
              <div class="party-info">
                <strong>${contractData.clientName}</strong><br>
                ${contractData.clientCnpj ? `CNPJ: ${contractData.clientCnpj}<br>` : ''}
                ${contractData.clientAddress ? `${contractData.clientAddress}<br>` : ''}
                ${contractData.clientCity && contractData.clientState ? `${contractData.clientCity} - ${contractData.clientState}<br>` : ''}
                ${contractData.clientContact ? `Contato: ${contractData.clientContact}<br>` : ''}
                ${contractData.clientEmail ? `Email: ${contractData.clientEmail}<br>` : ''}
                ${contractData.clientPhone ? `Telefone: ${contractData.clientPhone}` : ''}
              </div>
            </div>
          </div>

          <div class="details-section">
            <div class="details-grid">
              <div class="detail-item">
                <div class="detail-label">SERVIÇOS CONTRATADOS</div>
                <div class="detail-value">${contractData.services}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">VALOR</div>
                <div class="detail-value">${contractData.value}/mês</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">INÍCIO</div>
                <div class="detail-value">${contractData.startDate}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">VIGÊNCIA</div>
                <div class="detail-value">${contractData.duration}</div>
              </div>
              <div class="detail-item" style="grid-column: span 2;">
                <div class="detail-label">CONDIÇÕES DE PAGAMENTO</div>
                <div class="detail-value">${contractData.paymentTerms}</div>
              </div>
            </div>
          </div>

          <div class="terms-section">
            <div class="terms-title">TERMOS E CONDIÇÕES</div>
            <div class="terms-content">${contractData.terms}</div>
          </div>

          <div class="date-location">
            ${contractData.companyCity || 'Local'}, ${today}
          </div>

          <div class="signatures">
            <div class="signature-block">
              <div class="signature-line">
                <strong>${contractData.companyName}</strong><br>
                CONTRATADA
              </div>
            </div>
            <div class="signature-block">
              <div class="signature-line">
                <strong>${contractData.clientName}</strong><br>
                CONTRATANTE
              </div>
            </div>
          </div>
        `;

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Contrato - ${contractData.clientName}</title>
          ${styles}
        </head>
        <body>
          ${bodyContent}
        </body>
        </html>
      `);

      printWindow.document.close();
      
      // Wait for content to load then print
      setTimeout(() => {
        printWindow.print();
        setIsGenerating(false);
      }, 500);

      toast.success("PDF gerado! Use 'Salvar como PDF' na janela de impressão.");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Erro ao gerar PDF");
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Contrato - {contract?.client?.name}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="edit" className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              Editar
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Visualizar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="edit" className="flex-1 overflow-y-auto mt-4 space-y-6">
            {/* Template Selection */}
            {templates && templates.length > 0 && (
              <Card className="p-4 border-primary/20 bg-primary/5">
                <div className="flex items-center gap-2 mb-3">
                  <Layout className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Usar Template</h3>
                </div>
                <div className="space-y-2">
                  <Label>Selecione um template (opcional)</Label>
                  <Select value={selectedTemplateId} onValueChange={handleTemplateChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Formato padrão (sem template)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Formato padrão (sem template)</SelectItem>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {contractData.useTemplate && (
                    <p className="text-xs text-muted-foreground">
                      ✓ Template aplicado. Os dados abaixo serão substituídos automaticamente no template.
                    </p>
                  )}
                </div>
              </Card>
            )}

            {/* Company Info */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Dados da Contratada</h3>
              <h3 className="font-semibold mb-3">Dados da Contratada</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome da Empresa</Label>
                  <Input
                    value={contractData.companyName}
                    onChange={(e) => setContractData({ ...contractData, companyName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>CNPJ</Label>
                  <Input
                    value={contractData.companyCnpj}
                    onChange={(e) => setContractData({ ...contractData, companyCnpj: e.target.value })}
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Endereço</Label>
                  <Input
                    value={contractData.companyAddress}
                    onChange={(e) => setContractData({ ...contractData, companyAddress: e.target.value })}
                  />
                </div>
              </div>
            </Card>

            {/* Client Info */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Dados do Contratante</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome/Empresa</Label>
                  <Input
                    value={contractData.clientName}
                    onChange={(e) => setContractData({ ...contractData, clientName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>CNPJ</Label>
                  <Input
                    value={contractData.clientCnpj}
                    onChange={(e) => setContractData({ ...contractData, clientCnpj: e.target.value })}
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Endereço</Label>
                  <Input
                    value={contractData.clientAddress}
                    onChange={(e) => setContractData({ ...contractData, clientAddress: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cidade</Label>
                  <Input
                    value={contractData.clientCity}
                    onChange={(e) => setContractData({ ...contractData, clientCity: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Input
                    value={contractData.clientState}
                    onChange={(e) => setContractData({ ...contractData, clientState: e.target.value })}
                    maxLength={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contato</Label>
                  <Input
                    value={contractData.clientContact}
                    onChange={(e) => setContractData({ ...contractData, clientContact: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input
                    value={contractData.clientPhone}
                    onChange={(e) => setContractData({ ...contractData, clientPhone: e.target.value })}
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Email</Label>
                  <Input
                    value={contractData.clientEmail}
                    onChange={(e) => setContractData({ ...contractData, clientEmail: e.target.value })}
                  />
                </div>
              </div>
            </Card>

            {/* Contract Details */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Detalhes do Contrato</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label>Serviços Contratados</Label>
                  <Input
                    value={contractData.services}
                    onChange={(e) => setContractData({ ...contractData, services: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Valor</Label>
                  <Input
                    value={contractData.value}
                    onChange={(e) => setContractData({ ...contractData, value: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Condições de Pagamento</Label>
                  <Input
                    value={contractData.paymentTerms}
                    onChange={(e) => setContractData({ ...contractData, paymentTerms: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data de Início</Label>
                  <Input
                    value={contractData.startDate}
                    onChange={(e) => setContractData({ ...contractData, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Vigência</Label>
                  <Input
                    value={contractData.duration}
                    onChange={(e) => setContractData({ ...contractData, duration: e.target.value })}
                  />
                </div>
              </div>
            </Card>

            {/* Terms - Only show if not using template */}
            {!contractData.useTemplate && (
              <Card className="p-4">
                <h3 className="font-semibold mb-3">Termos e Condições</h3>
                <Textarea
                  value={contractData.terms}
                  onChange={(e) => setContractData({ ...contractData, terms: e.target.value })}
                  rows={12}
                  className="font-mono text-sm"
                />
              </Card>
            )}
          </TabsContent>

          <TabsContent value="preview" className="flex-1 overflow-y-auto mt-4" ref={printRef}>
            {contractData.useTemplate && contractData.templateContent ? (
              <div 
                className="bg-white text-black p-8 rounded-lg shadow-sm min-h-[800px]"
                dangerouslySetInnerHTML={{ __html: processTemplateContent(contractData.templateContent) }}
              />
            ) : (
            <div className="bg-white text-black p-8 rounded-lg shadow-sm min-h-[800px]">
              {/* Header */}
              <div className="text-center border-b-2 border-black pb-4 mb-6">
                <h1 className="text-2xl font-bold">CONTRATO DE PRESTAÇÃO DE SERVIÇOS</h1>
                <p className="text-muted-foreground">Marketing Digital e Comunicação</p>
              </div>

              {/* Parties */}
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-bold mb-2">CONTRATADA</h3>
                  <p className="font-semibold">{contractData.companyName}</p>
                  {contractData.companyCnpj && <p className="text-sm">CNPJ: {contractData.companyCnpj}</p>}
                  {contractData.companyAddress && <p className="text-sm">{contractData.companyAddress}</p>}
                  {contractData.companyCity && <p className="text-sm">{contractData.companyCity} - {contractData.companyState}</p>}
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-bold mb-2">CONTRATANTE</h3>
                  <p className="font-semibold">{contractData.clientName}</p>
                  {contractData.clientCnpj && <p className="text-sm">CNPJ: {contractData.clientCnpj}</p>}
                  {contractData.clientAddress && <p className="text-sm">{contractData.clientAddress}</p>}
                  {contractData.clientCity && <p className="text-sm">{contractData.clientCity} - {contractData.clientState}</p>}
                  {contractData.clientContact && <p className="text-sm">Contato: {contractData.clientContact}</p>}
                  {contractData.clientEmail && <p className="text-sm">Email: {contractData.clientEmail}</p>}
                  {contractData.clientPhone && <p className="text-sm">Tel: {contractData.clientPhone}</p>}
                </div>
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="p-3 bg-gray-50 rounded">
                  <p className="text-xs text-muted-foreground font-semibold">SERVIÇOS</p>
                  <p className="font-medium">{contractData.services}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded">
                  <p className="text-xs text-muted-foreground font-semibold">VALOR MENSAL</p>
                  <p className="font-medium">{contractData.value}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded">
                  <p className="text-xs text-muted-foreground font-semibold">INÍCIO</p>
                  <p className="font-medium">{contractData.startDate}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded">
                  <p className="text-xs text-muted-foreground font-semibold">VIGÊNCIA</p>
                  <p className="font-medium">{contractData.duration}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded col-span-2">
                  <p className="text-xs text-muted-foreground font-semibold">PAGAMENTO</p>
                  <p className="font-medium">{contractData.paymentTerms}</p>
                </div>
              </div>

              {/* Terms */}
              <div className="mb-8">
                <h3 className="font-bold mb-3">TERMOS E CONDIÇÕES</h3>
                <div className="text-sm whitespace-pre-wrap text-justify leading-relaxed">
                  {contractData.terms}
                </div>
              </div>

              {/* Signatures */}
              <div className="mt-16 grid grid-cols-2 gap-8">
                <div className="text-center">
                  <div className="border-t border-black pt-2 mt-16">
                    <p className="font-semibold">{contractData.companyName}</p>
                    <p className="text-sm text-muted-foreground">CONTRATADA</p>
                  </div>
                </div>
                <div className="text-center">
                  <div className="border-t border-black pt-2 mt-16">
                    <p className="font-semibold">{contractData.clientName}</p>
                    <p className="text-sm text-muted-foreground">CONTRATANTE</p>
                  </div>
                </div>
              </div>
            </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button onClick={handleGeneratePDF} disabled={isGenerating}>
            {isGenerating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Gerar PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
