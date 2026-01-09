import { useState } from "react";
import { 
  useContractTemplates, 
  useCreateContractTemplate, 
  useUpdateContractTemplate, 
  useDeleteContractTemplate,
  type ContractTemplate 
} from "@/hooks/useContractTemplates";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, FileText, Loader2 } from "lucide-react";

const SERVICE_TYPES = [
  { value: "social_media", label: "Social Media" },
  { value: "trafego", label: "Tráfego Pago" },
  { value: "full_marketing", label: "Full Marketing" },
  { value: "branding", label: "Branding" },
  { value: "design", label: "Design" },
  { value: "video", label: "Produção de Vídeo" },
  { value: "consultoria", label: "Consultoria" },
  { value: "outro", label: "Outro" },
];

interface TemplateFormData {
  name: string;
  description: string;
  service_type: string;
  content: string;
}

const defaultContent = `<h2 style="text-align: center; margin-bottom: 20px;">CONTRATO DE PRESTAÇÃO DE SERVIÇOS</h2>

<p><strong>CONTRATANTE:</strong> {{cliente_nome}}, inscrito no CNPJ sob nº {{cliente_cnpj}}, com sede em {{cliente_endereco}}.</p>

<p><strong>CONTRATADA:</strong> {{empresa_nome}}, inscrita no CNPJ sob nº {{empresa_cnpj}}, com sede em {{empresa_endereco}}.</p>

<h3>CLÁUSULA PRIMEIRA - DO OBJETO</h3>
<p>O presente contrato tem por objeto a prestação de serviços conforme especificado.</p>

<h3>CLÁUSULA SEGUNDA - DO VALOR E FORMA DE PAGAMENTO</h3>
<p>Pelos serviços prestados, a CONTRATANTE pagará à CONTRATADA o valor mensal de <strong>R$ {{valor}}</strong>.</p>

<h3>CLÁUSULA TERCEIRA - DO PRAZO</h3>
<p>O presente contrato terá vigência de {{data_inicio}} a {{data_fim}}.</p>

<h3>CLÁUSULA QUARTA - DA RESCISÃO</h3>
<p>O presente contrato poderá ser rescindido por qualquer das partes mediante aviso prévio de 30 (trinta) dias.</p>

<p style="margin-top: 40px;">{{cidade}}, {{data_atual}}</p>

<div style="display: flex; justify-content: space-between; margin-top: 60px;">
  <div style="text-align: center; width: 45%;">
    <p>_________________________________</p>
    <p><strong>CONTRATANTE</strong></p>
    <p>{{cliente_nome}}</p>
  </div>
  <div style="text-align: center; width: 45%;">
    <p>_________________________________</p>
    <p><strong>CONTRATADA</strong></p>
    <p>{{empresa_nome}}</p>
  </div>
</div>`;

export function ContractTemplateManager() {
  const { data: templates, isLoading } = useContractTemplates();
  const createTemplate = useCreateContractTemplate();
  const updateTemplate = useUpdateContractTemplate();
  const deleteTemplate = useDeleteContractTemplate();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<TemplateFormData>({
    name: "",
    description: "",
    service_type: "social_media",
    content: defaultContent,
  });

  const handleCreate = () => {
    setSelectedTemplate(null);
    setFormData({
      name: "",
      description: "",
      service_type: "social_media",
      content: defaultContent,
    });
    setDialogOpen(true);
  };

  const handleEdit = (template: ContractTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || "",
      service_type: template.service_type,
      content: template.content,
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setTemplateToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (templateToDelete) {
      await deleteTemplate.mutateAsync(templateToDelete);
      setDeleteDialogOpen(false);
      setTemplateToDelete(null);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.service_type || !formData.content) {
      return;
    }

    if (selectedTemplate) {
      await updateTemplate.mutateAsync({
        id: selectedTemplate.id,
        ...formData,
      });
    } else {
      await createTemplate.mutateAsync(formData);
    }
    setDialogOpen(false);
  };

  const getServiceTypeLabel = (value: string) => {
    return SERVICE_TYPES.find(t => t.value === value)?.label || value;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Templates de Contrato</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie templates reutilizáveis para diferentes tipos de serviço
          </p>
        </div>
        <Button onClick={handleCreate} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Novo Template
        </Button>
      </div>

      <div className="grid gap-3">
        {templates && templates.length > 0 ? (
          templates.map((template) => (
            <Card key={template.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium">{template.name}</h4>
                    {template.description && (
                      <p className="text-sm text-muted-foreground">{template.description}</p>
                    )}
                    <Badge variant="secondary" className="mt-2">
                      {getServiceTypeLabel(template.service_type)}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(template)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(template.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card className="p-8">
            <div className="text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum template criado ainda.</p>
              <p className="text-sm">Crie templates para agilizar a geração de contratos.</p>
            </div>
          </Card>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {selectedTemplate ? "Editar Template" : "Novo Template"}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Template *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Contrato Social Media"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="service_type">Tipo de Serviço *</Label>
                <Select 
                  value={formData.service_type} 
                  onValueChange={(value) => setFormData({ ...formData, service_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Breve descrição do template"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Conteúdo do Contrato (HTML) *</Label>
              <p className="text-xs text-muted-foreground">
                Variáveis disponíveis: {`{{cliente_nome}}, {{cliente_cnpj}}, {{cliente_endereco}}, {{empresa_nome}}, {{empresa_cnpj}}, {{empresa_endereco}}, {{valor}}, {{data_inicio}}, {{data_fim}}, {{cidade}}, {{data_atual}}`}
              </p>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={15}
                className="font-mono text-sm"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={createTemplate.isPending || updateTemplate.isPending}
            >
              {(createTemplate.isPending || updateTemplate.isPending) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {selectedTemplate ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover template?</AlertDialogTitle>
            <AlertDialogDescription>
              O template será removido e não poderá mais ser usado para novos contratos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
