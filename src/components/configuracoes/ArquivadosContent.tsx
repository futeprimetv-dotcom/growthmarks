import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Archive, 
  RotateCcw, 
  Trash2, 
  Search, 
  Calendar, 
  Users,
  Kanban,
  Target,
  FileText,
  DollarSign,
  Package,
  Briefcase,
  TrendingUp,
  UserCircle,
  CalendarDays,
  CheckSquare,
  Eye
} from "lucide-react";
import { ArchivedItemPreviewDialog } from "@/components/arquivados/ArchivedItemPreviewDialog";
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
import { differenceInDays } from "date-fns";

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

const typeIcons: Record<ItemType, React.ComponentType<{ className?: string }>> = {
  client: Users,
  demand: Kanban,
  lead: Target,
  planning: CalendarDays,
  contract: FileText,
  expense: DollarSign,
  product: Package,
  service: Briefcase,
  goal: TrendingUp,
  team_member: UserCircle,
};

interface ArchivedDisplayItem {
  id: string;
  item_type: ItemType;
  original_id: string;
  original_data: Record<string, unknown>;
  archived_at: string;
  name: string;
  details?: string;
  daysArchived: number;
}

export default function ArquivadosContent() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [periodFilter, setPeriodFilter] = useState<string>("all");
  const [deleteConfirm, setDeleteConfirm] = useState<ArchivedDisplayItem | null>(null);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [previewItem, setPreviewItem] = useState<ArchivedDisplayItem | null>(null);
  
  const { canDeletePermanently } = useUserRole();
  const { archivedItems, isLoading, restoreItem, deletePermanently } = useArchivedItems();

  // Transform archived items for display
  const displayItems: ArchivedDisplayItem[] = useMemo(() => {
    return archivedItems.map(item => {
      const archivedDate = new Date(item.archived_at);
      const daysArchived = differenceInDays(new Date(), archivedDate);
      
      return {
        id: item.id,
        item_type: item.item_type as ItemType,
        original_id: item.original_id,
        original_data: item.original_data,
        archived_at: item.archived_at,
        name: (item.original_data?.name as string) || (item.original_data?.title as string) || (item.original_data?.description as string) || 'Item sem nome',
        details: (item.original_data?.description as string) || (item.original_data?.notes as string) || undefined,
        daysArchived,
      };
    });
  }, [archivedItems]);

  // Calculate stats by type
  const statsByType = useMemo(() => {
    const stats: Record<ItemType, number> = {} as Record<ItemType, number>;
    Object.keys(typeLabels).forEach(type => {
      stats[type as ItemType] = 0;
    });
    displayItems.forEach(item => {
      stats[item.item_type] = (stats[item.item_type] || 0) + 1;
    });
    return stats;
  }, [displayItems]);

  // Active type stats (with items)
  const activeStats = useMemo(() => {
    return Object.entries(statsByType)
      .filter(([_, count]) => count > 0)
      .sort((a, b) => b[1] - a[1]);
  }, [statsByType]);

  // Filtered items
  const filteredItems = useMemo(() => {
    return displayItems.filter(item => {
      const matchesSearch = !searchTerm || 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.details?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === "all" || item.item_type === typeFilter;
      
      let matchesPeriod = true;
      if (periodFilter === "7") matchesPeriod = item.daysArchived <= 7;
      else if (periodFilter === "30") matchesPeriod = item.daysArchived <= 30;
      else if (periodFilter === "90") matchesPeriod = item.daysArchived <= 90;
      else if (periodFilter === "old") matchesPeriod = item.daysArchived > 90;
      
      return matchesSearch && matchesType && matchesPeriod;
    });
  }, [displayItems, searchTerm, typeFilter, periodFilter]);

  if (isLoading) {
    return <Skeleton className="h-96" />;
  }

  const handleRestore = async (item: ArchivedDisplayItem) => {
    await restoreItem.mutateAsync({
      id: item.id,
      itemType: item.item_type,
      originalId: item.original_id,
    });
    setSelectedItems(prev => {
      const next = new Set(prev);
      next.delete(item.id);
      return next;
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
      setSelectedItems(prev => {
        const next = new Set(prev);
        next.delete(deleteConfirm.id);
        return next;
      });
    }
  };

  const handleBulkRestore = async () => {
    const itemsToRestore = filteredItems.filter(item => selectedItems.has(item.id));
    for (const item of itemsToRestore) {
      await restoreItem.mutateAsync({
        id: item.id,
        itemType: item.item_type,
        originalId: item.original_id,
      });
    }
    setSelectedItems(new Set());
  };

  const handleBulkDelete = async () => {
    const itemsToDelete = filteredItems.filter(item => selectedItems.has(item.id));
    for (const item of itemsToDelete) {
      await deletePermanently.mutateAsync({
        id: item.id,
        itemType: item.item_type,
        originalId: item.original_id,
      });
    }
    setSelectedItems(new Set());
    setBulkDeleteConfirm(false);
  };

  const toggleSelectItem = (id: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === filteredItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredItems.map(item => item.id)));
    }
  };

  const getTimeAgoText = (days: number) => {
    if (days === 0) return 'Hoje';
    if (days === 1) return 'Ontem';
    if (days < 7) return `${days} dias atrás`;
    if (days < 30) return `${Math.floor(days / 7)} semana(s) atrás`;
    if (days < 90) return `${Math.floor(days / 30)} mês(es) atrás`;
    return `${Math.floor(days / 30)} meses atrás`;
  };

  return (
    <div className="space-y-6">
      {/* Stats by Type */}
      {activeStats.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {activeStats.map(([type, count]) => {
            const Icon = typeIcons[type as ItemType];
            const isActive = typeFilter === type;
            return (
              <Card 
                key={type}
                className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                  isActive ? 'ring-2 ring-primary bg-primary/5' : ''
                }`}
                onClick={() => setTypeFilter(isActive ? 'all' : type)}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${typeColors[type as ItemType]}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-xs text-muted-foreground">{typeLabels[type as ItemType]}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Filters Row */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            {Object.entries(typeLabels).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={periodFilter} onValueChange={setPeriodFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os períodos</SelectItem>
            <SelectItem value="7">Últimos 7 dias</SelectItem>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
            <SelectItem value="90">Últimos 90 dias</SelectItem>
            <SelectItem value="old">Mais de 90 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk Actions */}
      {selectedItems.size > 0 && (
        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-primary" />
              <span className="font-medium">{selectedItems.size} item(ns) selecionado(s)</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleBulkRestore} disabled={restoreItem.isPending}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Restaurar Selecionados
              </Button>
              {canDeletePermanently && (
                <Button variant="destructive" size="sm" onClick={() => setBulkDeleteConfirm(true)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir Permanentemente
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Items List */}
      {filteredItems.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          <Archive className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Nenhum item arquivado</p>
          {(typeFilter !== 'all' || periodFilter !== 'all' || searchTerm) && (
            <Button 
              variant="link" 
              onClick={() => {
                setTypeFilter('all');
                setPeriodFilter('all');
                setSearchTerm('');
              }}
            >
              Limpar filtros
            </Button>
          )}
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-secondary/50">
                  <th className="py-4 px-4 w-10">
                    <Checkbox 
                      checked={selectedItems.size === filteredItems.length && filteredItems.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">Item</th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">Tipo</th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">Arquivado</th>
                  <th className="text-right py-4 px-6 text-sm font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => {
                  const Icon = typeIcons[item.item_type];
                  const isSelected = selectedItems.has(item.id);
                  
                  return (
                    <tr 
                      key={`${item.item_type}-${item.id}`} 
                      className={`border-b transition-colors ${
                        isSelected ? 'bg-primary/5' : 'hover:bg-secondary/30'
                      }`}
                    >
                      <td className="py-4 px-4">
                        <Checkbox 
                          checked={isSelected}
                          onCheckedChange={() => toggleSelectItem(item.id)}
                        />
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${typeColors[item.item_type]}`}>
                            <Icon className="h-4 w-4" />
                          </div>
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
                      <td className="py-4 px-4">
                        <Badge className={typeColors[item.item_type]}>
                          {typeLabels[item.item_type]}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <span className="text-sm">{getTimeAgoText(item.daysArchived)}</span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(item.archived_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setPreviewItem(item)}
                            title="Visualizar detalhes"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
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
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir permanentemente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O item "{deleteConfirm?.name}" será excluído permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation */}
      <AlertDialog open={bulkDeleteConfirm} onOpenChange={setBulkDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {selectedItems.size} item(ns)?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Todos os itens selecionados serão excluídos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBulkDelete} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir Todos
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Preview Dialog */}
      <ArchivedItemPreviewDialog
        open={!!previewItem}
        onOpenChange={() => setPreviewItem(null)}
        item={previewItem}
        onRestore={handleRestore}
        isRestoring={restoreItem.isPending}
      />
    </div>
  );
}
