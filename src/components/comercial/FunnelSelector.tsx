import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { ChevronDown, Plus, Settings, Star, Trash2, Edit2 } from "lucide-react";
import { useSalesFunnels, useDeleteFunnel, useSetDefaultFunnel, SalesFunnel } from "@/hooks/useSalesFunnels";
import { FunnelFormDialog } from "./FunnelFormDialog";
import { cn } from "@/lib/utils";

interface FunnelSelectorProps {
  selectedFunnelId: string | null;
  onSelectFunnel: (funnelId: string | null) => void;
}

export function FunnelSelector({ selectedFunnelId, onSelectFunnel }: FunnelSelectorProps) {
  const { data: funnels = [], isLoading } = useSalesFunnels();
  const deleteFunnel = useDeleteFunnel();
  const setDefaultFunnel = useSetDefaultFunnel();

  const [formOpen, setFormOpen] = useState(false);
  const [editingFunnel, setEditingFunnel] = useState<SalesFunnel | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<SalesFunnel | null>(null);

  const selectedFunnel = funnels.find((f) => f.id === selectedFunnelId);

  const handleEdit = (funnel: SalesFunnel) => {
    setEditingFunnel(funnel);
    setFormOpen(true);
  };

  const handleFormClose = (open: boolean) => {
    setFormOpen(open);
    if (!open) setEditingFunnel(null);
  };

  if (isLoading) {
    return <div className="h-9 w-40 bg-muted animate-pulse rounded-md" />;
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Funnel tabs */}
        <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
          <Button
            variant={selectedFunnelId === null ? "secondary" : "ghost"}
            size="sm"
            onClick={() => onSelectFunnel(null)}
            className="h-8"
          >
            Todos
          </Button>
          {funnels.map((funnel) => (
            <Button
              key={funnel.id}
              variant={selectedFunnelId === funnel.id ? "secondary" : "ghost"}
              size="sm"
              onClick={() => onSelectFunnel(funnel.id)}
              className="h-8 gap-2"
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: funnel.color }}
              />
              {funnel.name}
              {funnel.is_default && (
                <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
              )}
            </Button>
          ))}
        </div>

        {/* Settings dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="h-8 w-8">
              <Settings className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Funil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {funnels.map((funnel) => (
              <div key={funnel.id} className="px-2 py-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: funnel.color }}
                    />
                    <span className="text-sm">{funnel.name}</span>
                    {funnel.is_default && (
                      <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {!funnel.is_default && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => setDefaultFunnel.mutate(funnel.id)}
                        title="Definir como padrão"
                      >
                        <Star className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleEdit(funnel)}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    {!funnel.is_default && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive hover:text-destructive"
                        onClick={() => setDeleteConfirm(funnel)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <FunnelFormDialog
        open={formOpen}
        onOpenChange={handleFormClose}
        funnel={editingFunnel}
      />

      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Funil</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o funil "{deleteConfirm?.name}"? 
              Os leads deste funil precisam ser movidos antes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteConfirm) deleteFunnel.mutate(deleteConfirm.id);
                setDeleteConfirm(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
