import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Settings as SettingsIcon, Palette, Lock, Package, Plus, Edit2, Trash2, AlertTriangle } from "lucide-react";
import logo from "@/assets/logo-growth-marks.png";
import { useAvailableServices, AvailableService } from "@/hooks/useAvailableServices";
import { useUserRole } from "@/hooks/useUserRole";
import { CRMSettingsSection } from "@/components/configuracoes/CRMSettingsSection";
import { CompanySettingsSection } from "@/components/configuracoes/CompanySettingsSection";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface ServiceFormData {
  name: string;
  description: string;
  base_value: number;
  type: string;
  active: boolean;
}

export default function Configuracoes() {
  const { isGestao } = useUserRole();
  const { services, isLoading, createService, updateService, deleteService } = useAvailableServices();
  
  const [isServiceFormOpen, setIsServiceFormOpen] = useState(false);
  const [editingService, setEditingService] = useState<AvailableService | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<AvailableService | null>(null);
  const [formData, setFormData] = useState<ServiceFormData>({
    name: '',
    description: '',
    base_value: 0,
    type: 'mensal',
    active: true,
  });

  const openNewServiceForm = () => {
    setEditingService(null);
    setFormData({
      name: '',
      description: '',
      base_value: 0,
      type: 'mensal',
      active: true,
    });
    setIsServiceFormOpen(true);
  };

  const openEditServiceForm = (service: AvailableService) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description || '',
      base_value: service.base_value,
      type: service.type,
      active: service.active,
    });
    setIsServiceFormOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name) {
      toast.error("Nome do serviço é obrigatório");
      return;
    }

    if (editingService) {
      updateService.mutate({ id: editingService.id, ...formData });
    } else {
      createService.mutate(formData);
    }
    setIsServiceFormOpen(false);
  };

  const confirmDelete = () => {
    if (deleteConfirm) {
      deleteService.mutate(deleteConfirm.id);
      setDeleteConfirm(null);
    }
  };

  const handleResetDatabase = async () => {
    toast.info("Funcionalidade de reset será implementada em breve");
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">Preferências do sistema</p>
      </div>

      {/* Company Info */}
      <CompanySettingsSection />

      {/* Services Configuration */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Package className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Serviços Disponíveis</h2>
          </div>
          <Button onClick={openNewServiceForm}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Serviço
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum serviço cadastrado.</p>
            <Button variant="outline" className="mt-4" onClick={openNewServiceForm}>
              <Plus className="h-4 w-4 mr-2" />
              Cadastrar primeiro serviço
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Valor Base</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((service) => (
                <TableRow key={service.id}>
                  <TableCell className="font-medium">{service.name}</TableCell>
                  <TableCell className="text-muted-foreground max-w-[200px] truncate">
                    {service.description || '-'}
                  </TableCell>
                  <TableCell>R$ {service.base_value.toLocaleString('pt-BR')}</TableCell>
                  <TableCell className="capitalize">{service.type}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      service.active 
                        ? 'bg-green-500/20 text-green-500' 
                        : 'bg-gray-500/20 text-gray-500'
                    }`}>
                      {service.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEditServiceForm(service)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm(service)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* CRM Settings */}
      <CRMSettingsSection />

      {/* Theme */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Palette className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Aparência</h2>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Modo Escuro</p>
            <p className="text-sm text-muted-foreground">Usar tema escuro na interface</p>
          </div>
          <Switch defaultChecked />
        </div>
      </Card>

      {/* Danger Zone - Only for Gestão */}
      {isGestao && (
        <Card className="p-6 border-destructive/50">
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <h2 className="text-lg font-semibold text-destructive">Zona de Perigo</h2>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Resetar Banco de Dados</p>
              <p className="text-sm text-muted-foreground">
                Remove todos os dados de teste. Esta ação não pode ser desfeita.
              </p>
            </div>
            <Button variant="destructive" onClick={handleResetDatabase}>
              Resetar Dados
            </Button>
          </div>
        </Card>
      )}

      {/* Advanced */}
      <Card className="p-6 border-dashed">
        <div className="flex items-center gap-3 mb-4">
          <Lock className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-muted-foreground">Configurações Avançadas</h2>
        </div>
        <p className="text-muted-foreground text-sm">
          Configurações avançadas estarão disponíveis na versão completa do sistema. 
          Entre em contato com o suporte para mais informações.
        </p>
      </Card>

      {/* Service Form Dialog */}
      <Dialog open={isServiceFormOpen} onOpenChange={setIsServiceFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingService ? 'Editar Serviço' : 'Novo Serviço'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome do Serviço</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Gestão de Redes Sociais"
              />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva o serviço..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Valor Base (R$)</Label>
                <Input
                  type="number"
                  value={formData.base_value}
                  onChange={(e) => setFormData({ ...formData, base_value: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Tipo de Cobrança</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mensal">Mensal</SelectItem>
                    <SelectItem value="pontual">Pontual</SelectItem>
                    <SelectItem value="por_demanda">Por Demanda</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.active}
                onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
              />
              <Label>Serviço ativo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsServiceFormOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit}>{editingService ? 'Salvar' : 'Criar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Serviço</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o serviço "{deleteConfirm?.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
