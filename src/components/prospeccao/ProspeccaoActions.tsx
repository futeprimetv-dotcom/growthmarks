import { Download, Send, UserPlus, Loader2, ArrowRightCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Props {
  selectedCount: number;
  onSendToFunnel: () => void;
  onSendToLeadsBase: () => void;
  onExport: () => void;
  isSendingToBase?: boolean;
  showSendToLeads?: boolean;
}

export function ProspeccaoActions({ 
  selectedCount, 
  onSendToFunnel, 
  onSendToLeadsBase, 
  onExport,
  isSendingToBase,
  showSendToLeads = true,
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

      {showSendToLeads && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                onClick={onSendToLeadsBase}
                disabled={selectedCount === 0 || isSendingToBase}
                className="bg-primary hover:bg-primary/90"
              >
                {isSendingToBase ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ArrowRightCircle className="h-4 w-4 mr-2" />
                )}
                Enviar para Leads
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Cria leads diretamente a partir dos prospects selecionados</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}
