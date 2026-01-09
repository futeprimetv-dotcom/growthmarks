import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateSavedSearch } from "@/hooks/useSavedSearches";
import type { ProspectFilters } from "@/hooks/useProspects";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: ProspectFilters;
  resultsCount: number;
}

export function SaveSearchDialog({ open, onOpenChange, filters, resultsCount }: Props) {
  const [name, setName] = useState("");
  const createMutation = useCreateSavedSearch();

  const handleSubmit = async () => {
    if (!name.trim()) return;
    
    await createMutation.mutateAsync({
      name: name.trim(),
      filters,
      resultsCount
    });
    
    onOpenChange(false);
    setName("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Salvar Pesquisa</DialogTitle>
          <DialogDescription>
            Salve os filtros atuais para acessar rapidamente no futuro.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="search-name">Nome da pesquisa</Label>
            <Input
              id="search-name"
              placeholder="Ex: Empresas de tecnologia em SP"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="text-sm text-muted-foreground">
            Esta pesquisa retorna {resultsCount} resultado(s).
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || createMutation.isPending}>
            {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Salvar Pesquisa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
