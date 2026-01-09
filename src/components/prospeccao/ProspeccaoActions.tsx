import { Download, Send, UserPlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  selectedCount: number;
  onSendToFunnel: () => void;
  onSendToLeadsBase: () => void;
  onExport: () => void;
  isSendingToBase?: boolean;
}

export function ProspeccaoActions({ 
  selectedCount, 
  onSendToFunnel, 
  onSendToLeadsBase, 
  onExport,
  isSendingToBase 
}: Props) {
  return (
    <div className="flex items-center gap-2">
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
        variant="outline"
        size="sm"
        onClick={onSendToFunnel}
        disabled={selectedCount === 0}
      >
        <Send className="h-4 w-4 mr-2" />
        Enviar para Funil
      </Button>

      <Button
        size="sm"
        onClick={onSendToLeadsBase}
        disabled={selectedCount === 0 || isSendingToBase}
      >
        {isSendingToBase ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <UserPlus className="h-4 w-4 mr-2" />
        )}
        Enviar para Base de Leads
      </Button>
    </div>
  );
}
