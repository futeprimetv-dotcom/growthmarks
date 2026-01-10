import { Search, FileSpreadsheet, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CNPJSearchInput } from "./CNPJSearchInput";
import { CNPJResultCard } from "./CNPJResultCard";
import type { CNPJLookupResult } from "@/hooks/useCNPJLookup";

interface CNPJSearchModeProps {
  cnpjResult: CNPJLookupResult | null;
  cnpjLoading: boolean;
  cnpjError: string | null;
  onSearch: (cnpj: string) => void;
  onClear: () => void;
  onAddToProspects: () => void;
  onSendToLeads: () => void;
  onSendToFunnel: () => void;
  onOpenBatchDialog: () => void;
  isAdding: boolean;
}

export function CNPJSearchMode({
  cnpjResult,
  cnpjLoading,
  cnpjError,
  onSearch,
  onClear,
  onAddToProspects,
  onSendToLeads,
  onSendToFunnel,
  onOpenBatchDialog,
  isAdding,
}: CNPJSearchModeProps) {
  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <Search className="h-4 w-4" />
          Consulte empresas diretamente pelo CNPJ usando a BrasilAPI
        </span>
      </div>
      
      <div className="flex items-center gap-4">
        <CNPJSearchInput
          onSearch={onSearch}
          onClear={onClear}
          isLoading={cnpjLoading}
          hasResult={!!cnpjResult}
        />
        <Button 
          variant="outline" 
          onClick={onOpenBatchDialog}
          className="shrink-0"
        >
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Consulta em Lote
        </Button>
      </div>
      
      {cnpjResult && (
        <CNPJResultCard
          data={cnpjResult}
          onAddToProspects={onAddToProspects}
          onSendToLeads={onSendToLeads}
          onSendToFunnel={onSendToFunnel}
          isAdding={isAdding}
        />
      )}
      
      {cnpjError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{cnpjError}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
