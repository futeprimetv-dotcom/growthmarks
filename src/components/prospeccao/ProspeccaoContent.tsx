import { Search, Globe, Database, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ProspeccaoTable } from "./ProspeccaoTable";
import type { SearchMode } from "./ProspeccaoHeader";

interface ProspeccaoContentProps {
  searchMode: SearchMode;
  hasSearched: boolean;
  isLoading: boolean;
  isError: boolean;
  cnpjResult: any;
  cnpjError: string | null;
  displayData: any[];
  selectedIds: string[];
  onSelectChange: (ids: string[]) => void;
  page: number;
  onPageChange: (page: number) => void;
  pageSize: number;
  refetch: () => void;
}

export function ProspeccaoContent({
  searchMode,
  hasSearched,
  isLoading,
  isError,
  cnpjResult,
  cnpjError,
  displayData,
  selectedIds,
  onSelectChange,
  page,
  onPageChange,
  pageSize,
  refetch,
}: ProspeccaoContentProps) {
  if (searchMode === "cnpj") {
    if (!cnpjResult && !cnpjError) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Search className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold">Consulte empresas pelo CNPJ</h3>
          <p className="text-muted-foreground mt-1 max-w-md">
            Digite um CNPJ no campo acima ou use a consulta em lote para buscar múltiplas empresas de uma vez.
          </p>
        </div>
      );
    }
    return null;
  }

  if (searchMode === "database") {
    if (isError) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Erro ao carregar os prospectos.{" "}
            <Button variant="link" className="p-0 h-auto" onClick={() => refetch()}>
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      );
    }

    // Show empty state when no data and not loading
    if (!isLoading && displayData.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Database className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold">Sua base de prospectos</h3>
          <p className="text-muted-foreground mt-1 max-w-md">
            Utilize os filtros acima para encontrar empresas que você já salvou.
          </p>
        </div>
      );
    }

    return (
      <ProspeccaoTable
        prospects={displayData}
        isLoading={isLoading}
        selectedIds={selectedIds}
        onSelectChange={onSelectChange}
        page={page}
        onPageChange={onPageChange}
        pageSize={pageSize}
      />
    );
  }

  // Internet mode - show empty state
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Globe className="h-16 w-16 text-muted-foreground/30 mb-4" />
      <h3 className="text-lg font-semibold">Encontre empresas na internet</h3>
      <p className="text-muted-foreground mt-1 max-w-md">
        Configure os filtros acima e clique em Buscar para encontrar empresas ativas.
      </p>
    </div>
  );
}
