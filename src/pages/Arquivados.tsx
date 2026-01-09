import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Archive, RotateCcw, Trash2, Search, Calendar, AlertTriangle } from "lucide-react";
import { useArchivedItems } from "@/hooks/useArchivedItems";
import { useUserRole } from "@/hooks/useUserRole";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Navigate } from "react-router-dom";

type ItemType = 'client' | 'demand' | 'lead' | 'planning' | 'contract' | 'expense' | 'product' | 'service' | 'goal' | 'team_member';

const typeLabels: Record<ItemType, string> = {
  client: 'Cliente',
  demand: 'Demanda',
  lead: 'Lead',
  planning: 'Planejamento',
  contract: 'Contrato',
  expense: 'Despesa',
  product: 'Produto',
  service: 'Serviço',
  goal: 'Meta',
  team_member: 'Membro',
};

const typeColors: Record<ItemType, string> = {
  client: 'bg-blue-500/20 text-blue-500',
  demand: 'bg-purple-500/20 text-purple-500',
  lead: 'bg-orange-500/20 text-orange-500',
  planning: 'bg-green-500/20 text-green-500',
  contract: 'bg-cyan-500/20 text-cyan-500',
  expense: 'bg-red-500/20 text-red-500',
  product: 'bg-yellow-500/20 text-yellow-500',
  service: 'bg-indigo-500/20 text-indigo-500',
  goal: 'bg-pink-500/20 text-pink-500',
  team_member: 'bg-teal-500/20 text-teal-500',
};

interface ArchivedDisplayItem {
  id: string;
  item_type: ItemType;
  original_id: string;
  original_data: Record<string, unknown>;
  archived_at: string;
  name: string;
  details?: string;
}

export default function Arquivados() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [deleteConfirm, setDeleteConfirm] = useState<ArchivedDisplayItem | null>(null);
  
  const { canViewArquivados, canDeletePermanently, loading: roleLoading } = useUserRole();
  const { archivedItems, isLoading, restoreItem, deletePermanently } = useArchivedItems();

  if (roleLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!canViewArquivados) {
    return <Navigate to="/producao" replace />;
  }

  // Transform archived items for display
  const displayItems: ArchivedDisplayItem[] = archivedItems.map(item => ({
    id: item.id,
    item_type: item.item_type as ItemType,
    original_id: item.original_id,
    original_data: item.original_data,
    archived_at: item.archived_at,
    name: (item.original_data?.name as string) || (item.original_data?.title as string) || (item.original_data?.description as string) || 'Item sem nome',
    details: (item.original_data?.description as string) || (item.original_data?.notes as string) || undefined,
  }));

  const filteredItems = displayItems.filter(item => {
    const matchesSearch = !searchTerm || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.details?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || item.item_type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleRestore = async (item: ArchivedDisplayItem) => {
    await restoreItem.mutateAsync({
      id: item.id,
      itemType: item.item_type,
      originalId: item.original_id,
    });
  };

  const handleDelete = async () => {
    if (deleteConfirm) {
      await deletePermanently.mutateAsync({
        id: deleteConfirm.id,
        itemType: deleteConfirm.item_type,
        originalId: deleteConfirm.original_id,
      });
      setDeleteConfirm(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Arquivados</h1>
        <p className="text-muted-foreground">Itens arquivados de todo o sistema</p>
      </div>

      {/* Summary */}
      <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border">
        <Archive className="h-6 w-6 text-muted-foreground" />
        <p className="text-muted-foreground">
          <span className="font-medium text-foreground">{displayItems.length}</span> itens arquivados
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            {Object.entries(typeLabels).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Items List */}
      {filteredItems.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          <Archive className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Nenhum item arquivado</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-secondary/50">
                  <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Item</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Tipo</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Data</th>
                  <th className="text-right py-4 px-6 text-sm font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={`${item.item_type}-${item.id}`} className="border-b hover:bg-secondary/30 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <Archive className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{item.name}</p>
                          {item.details && (
                            <p className="text-xs text-muted-foreground truncate max-w-[300px]">
                              {item.details}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <Badge className={typeColors[item.item_type]}>
                        {typeLabels[item.item_type]}
                      </Badge>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Calendar className="h-4 w-4" />
                        {item.archived_at 
                          ? new Date(item.archived_at).toLocaleDateString('pt-BR')
                          : '-'
                        }
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleRestore(item)}
                          disabled={restoreItem.isPending}
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Restaurar
                        </Button>
                        {canDeletePermanently && (
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => setDeleteConfirm(item)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Excluir Permanentemente
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{deleteConfirm?.name}" permanentemente? 
              <br /><br />
              <strong className="text-destructive">Esta ação não pode ser desfeita.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir Permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}