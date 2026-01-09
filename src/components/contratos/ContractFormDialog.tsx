import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useClients } from "@/hooks/useClients";
import { useCreateContract, useUpdateContract, type Contract } from "@/hooks/useContracts";
import { useContractServices, useSyncContractServices } from "@/hooks/useContractServices";
import { ContractServicesSelect } from "./ContractServicesSelect";
import { Loader2 } from "lucide-react";

interface ContractFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract?: Contract | null;
  defaultClientId?: string;
}

export function ContractFormDialog({ 
  open, 
  onOpenChange, 
  contract,
  defaultClientId 
}: ContractFormDialogProps) {
  const { data: clients } = useClients();
  const createContract = useCreateContract();
  const updateContract = useUpdateContract();
  const { data: existingServices } = useContractServices(contract?.id);
  const syncServices = useSyncContractServices();

  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    client_id: defaultClientId || "",
    type: "mensal",
    value: 0,
    start_date: new Date().toISOString().split("T")[0],
    end_date: "",
    status: "active",
    notes: "",
  });

  useEffect(() => {
    if (contract) {
      setFormData({
        client_id: contract.client_id,
        type: contract.type,
        value: contract.value,
        start_date: contract.start_date,
        end_date: contract.end_date || "",
        status: contract.status || "active",
        notes: contract.notes || "",
      });
    } else {
      setFormData({
        client_id: defaultClientId || "",
        type: "mensal",
        value: 0,
        start_date: new Date().toISOString().split("T")[0],
        end_date: "",
        status: "active",
        notes: "",
      });
      setSelectedServices([]);
    }
  }, [contract, defaultClientId, open]);

  useEffect(() => {
    if (existingServices) {
      setSelectedServices(existingServices.map(s => s.service_id));
    }
  }, [existingServices]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const contractData = {
      ...formData,
      end_date: formData.end_date || null,
    };

    let contractId: string;

    if (contract) {
      await updateContract.mutateAsync({ id: contract.id, ...contractData });
      contractId = contract.id;
    } else {
      const newContract = await createContract.mutateAsync(contractData);
      contractId = newContract.id;
    }

    // Sync services with the contract
    if (contractId) {
      await syncServices.mutateAsync({ contractId, serviceIds: selectedServices });
    }
    
    onOpenChange(false);
  };

  const isLoading = createContract.isPending || updateContract.isPending || syncServices.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {contract ? "Editar Contrato" : "Novo Contrato"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="client_id">Cliente *</Label>
            <Select
              value={formData.client_id}
              onValueChange={(value) => setFormData({ ...formData, client_id: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cliente" />
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
              <Label htmlFor="type">Tipo *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mensal">Mensal</SelectItem>
                  <SelectItem value="trimestral">Trimestral</SelectItem>
                  <SelectItem value="semestral">Semestral</SelectItem>
                  <SelectItem value="anual">Anual</SelectItem>
                  <SelectItem value="projeto">Projeto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="expired">Expirado</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="value">Valor (R$) *</Label>
            <Input
              id="value"
              type="number"
              step="0.01"
              min="0"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Data de Início *</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">Data de Término</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Serviços Incluídos</Label>
            <ContractServicesSelect
              selectedServices={selectedServices}
              onServicesChange={setSelectedServices}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Informações adicionais sobre o contrato..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {contract ? "Salvar" : "Criar Contrato"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
