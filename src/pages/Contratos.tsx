import { useState } from "react";
import { useContracts, useDeleteContract, type ContractWithClient } from "@/hooks/useContracts";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronDown, ChevronUp, FileText, Calendar, DollarSign, Plus, Pencil, Trash2, Loader2, FileWarning, Eye, Layout, Send, CheckCircle2, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ContractFormDialog } from "@/components/contratos/ContractFormDialog";
import { ContractPreviewDialog } from "@/components/contratos/ContractPreviewDialog";
import { ContractTemplateManager } from "@/components/contratos/ContractTemplateManager";
import { SendSignatureDialog } from "@/components/contratos/SendSignatureDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useQueryClient } from "@tanstack/react-query";

export default function Contratos() {
  const { data: contracts, isLoading } = useContracts();
  const deleteContract = useDeleteContract();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState("contracts");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [signatureOpen, setSignatureOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<ContractWithClient | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contractToDelete, setContractToDelete] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleEdit = (contract: ContractWithClient, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedContract(contract);
    setFormOpen(true);
  };

  const handlePreview = (contract: ContractWithClient, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedContract(contract);
    setPreviewOpen(true);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setContractToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleSendSignature = (contract: ContractWithClient, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedContract(contract);
    setSignatureOpen(true);
  };

  const getSignatureStatusBadge = (contract: ContractWithClient) => {
    const status = (contract as any).signature_status;
    if (status === "signed") {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Assinado
        </Badge>
      );
    }
    if (status === "sent") {
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          <Mail className="h-3 w-3 mr-1" />
          Aguardando
        </Badge>
      );
    }
    return null;
  };

  const confirmDelete = async () => {
    if (contractToDelete) {
      await deleteContract.mutateAsync(contractToDelete);
      setDeleteDialogOpen(false);
      setContractToDelete(null);
    }
  };

  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      mensal: "Mensal",
      trimestral: "Trimestral",
      semestral: "Semestral",
      anual: "Anual",
      projeto: "Projeto",
    };
    return types[type] || type;
  };

  const getStatusForBadge = (status: string | null) => {
    const statusMap: Record<string, string> = {
      active: "ativo",
      pending: "pausado",
      expired: "encerrado",
      cancelled: "encerrado",
    };
    return statusMap[status || "active"] || "ativo";
  };

  const calculateAnnualValue = (contract: ContractWithClient) => {
    const multipliers: Record<string, number> = {
      mensal: 12,
      trimestral: 4,
      semestral: 2,
      anual: 1,
      projeto: 1,
    };
    return contract.value * (multipliers[contract.type] || 1);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Contratos</h1>
          <p className="text-muted-foreground">Gerencie contratos, pacotes de serviços e templates</p>
        </div>
        {activeTab === "contracts" && (
          <Button onClick={() => { setSelectedContract(null); setFormOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Contrato
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="contracts" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Contratos
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Layout className="h-4 w-4" />
            Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contracts" className="mt-6">
          {(!contracts || contracts.length === 0) ? (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <FileWarning className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum contrato encontrado</h3>
            <p className="text-muted-foreground mb-4">
              Comece criando seu primeiro contrato para gerenciar seus clientes.
            </p>
            <Button onClick={() => { setSelectedContract(null); setFormOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Contrato
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4">
          {contracts.map((contract) => {
            const isExpanded = expandedId === contract.id;

            return (
              <Card
                key={contract.id}
                className={cn(
                  "overflow-hidden transition-all cursor-pointer hover:shadow-lg",
                  isExpanded && "ring-2 ring-primary"
                )}
                onClick={() => toggleExpand(contract.id)}
              >
                {/* Header */}
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <FileText className="h-5 w-5 text-primary" />
                        <h3 className="text-xl font-semibold">
                          {contract.client?.name || "Cliente não encontrado"}
                        </h3>
                        <StatusBadge status={getStatusForBadge(contract.status)} />
                        {getSignatureStatusBadge(contract)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{getTypeLabel(contract.type)}</span>
                        <span>•</span>
                        <span>
                          {new Date(contract.start_date).toLocaleDateString('pt-BR')}
                          {contract.end_date && ` - ${new Date(contract.end_date).toLocaleDateString('pt-BR')}`}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">
                          R$ {contract.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {contract.type === 'projeto' ? 'valor total' : `por ${contract.type === 'mensal' ? 'mês' : contract.type}`}
                        </p>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t bg-secondary/30 p-6" onClick={(e) => e.stopPropagation()}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Details */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 p-4 rounded-lg bg-card">
                          <Calendar className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">Vigência</p>
                            <p className="font-medium">
                              {new Date(contract.start_date).toLocaleDateString('pt-BR')}
                              {contract.end_date && ` até ${new Date(contract.end_date).toLocaleDateString('pt-BR')}`}
                            </p>
                          </div>
                        </div>
                        
                        {contract.type !== 'projeto' && (
                          <div className="flex items-center gap-3 p-4 rounded-lg bg-card">
                            <DollarSign className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="text-sm text-muted-foreground">Valor Anual Estimado</p>
                              <p className="font-medium">
                                R$ {calculateAnnualValue(contract).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Notes & Actions */}
                      <div className="space-y-4">
                        {contract.notes && (
                          <div className="p-4 rounded-lg bg-card">
                            <p className="text-sm text-muted-foreground mb-1">Observações</p>
                            <p className="text-sm">{contract.notes}</p>
                          </div>
                        )}
                        
                        <div className="flex flex-wrap gap-2">
                          <Button 
                            variant="default" 
                            size="sm"
                            onClick={(e) => handlePreview(contract, e)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Contrato / PDF
                          </Button>
                          <Button 
                            variant="secondary" 
                            size="sm"
                            onClick={(e) => handleSendSignature(contract, e)}
                          >
                            <Send className="h-4 w-4 mr-2" />
                            {(contract as any).signature_status === "sent" ? "Ver Assinatura" : "Enviar para Assinatura"}
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={(e) => handleEdit(contract, e)}
                          >
                            <Pencil className="h-4 w-4 mr-2" />
                            Editar
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={(e) => handleDelete(contract.id, e)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Arquivar
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
          </div>
        )}
        </TabsContent>

        <TabsContent value="templates" className="mt-6">
          <ContractTemplateManager />
        </TabsContent>
      </Tabs>

      <ContractFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        contract={selectedContract}
      />

      <ContractPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        contract={selectedContract}
      />

      <SendSignatureDialog
        open={signatureOpen}
        onOpenChange={setSignatureOpen}
        contract={selectedContract}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["contracts"] })}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Arquivar contrato?</AlertDialogTitle>
            <AlertDialogDescription>
              O contrato será arquivado e não aparecerá mais na lista. Você pode restaurá-lo posteriormente na seção de arquivados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Arquivar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
