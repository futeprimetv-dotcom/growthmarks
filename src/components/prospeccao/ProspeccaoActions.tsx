import { Download, List, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSalesFunnels } from "@/hooks/useSalesFunnels";

interface Props {
  selectedCount: number;
  onSendToFunnel: () => void;
  onAddToList: () => void;
  onExport: () => void;
}

export function ProspeccaoActions({ selectedCount, onSendToFunnel, onAddToList, onExport }: Props) {
  const { data: funnels } = useSalesFunnels();

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={onAddToList}
        disabled={selectedCount === 0}
      >
        <List className="h-4 w-4 mr-2" />
        Adicionar à Lista
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={onExport}
        disabled={selectedCount === 0}
      >
        <Download className="h-4 w-4 mr-2" />
        Exportar CSV
      </Button>

      <Button
        size="sm"
        onClick={onSendToFunnel}
        disabled={selectedCount === 0}
      >
        <Send className="h-4 w-4 mr-2" />
        Enviar para Funil
      </Button>
    </div>
  );
}
