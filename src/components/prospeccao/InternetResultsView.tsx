import { ArrowLeft, Database, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { SearchResultsPanel } from "./SearchResultsPanel";
import { SearchStatsPanel, type SearchDebugStats } from "./SearchStatsPanel";
import { ProspeccaoActions } from "./ProspeccaoActions";
import { SendToFunnelDialog } from "./SendToFunnelDialog";
import type { CompanySearchResult } from "@/hooks/useCompanySearch";

interface InternetResultsViewProps {
  apiResults: CompanySearchResult[];
  apiTotal: number;
  searchStats: SearchDebugStats | null;
  selectedIds: string[];
  onSelectChange: (ids: string[]) => void;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  isLoading: boolean;
  onBack: () => void;
  onAddToMyBase: () => void;
  onSendToLeadsBase: () => void;
  onExport: () => void;
  sendToFunnelOpen: boolean;
  onSendToFunnelOpenChange: (open: boolean) => void;
  isAddingToBase: boolean;
  isSendingToBase: boolean;
  displayData: any[];
  onClearStats?: () => void;
}

export function InternetResultsView({
  apiResults,
  apiTotal,
  searchStats,
  selectedIds,
  onSelectChange,
  pageSize,
  onPageSizeChange,
  isLoading,
  onBack,
  onAddToMyBase,
  onSendToLeadsBase,
  onExport,
  sendToFunnelOpen,
  onSendToFunnelOpenChange,
  isAddingToBase,
  isSendingToBase,
  displayData,
  onClearStats,
}: InternetResultsViewProps) {
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="px-6 py-3 border-b shrink-0 flex items-center justify-between bg-muted/30">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar aos filtros
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <div className="text-sm text-muted-foreground">
            {selectedIds.length > 0 && (
              <span className="font-medium text-foreground">
                {selectedIds.length} selecionado(s) •{" "}
              </span>
            )}
            {apiResults.length} resultado(s) encontrado(s)
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Resultados" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={onAddToMyBase}
            disabled={selectedIds.length === 0 || isAddingToBase}
          >
            {isAddingToBase ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Database className="h-4 w-4 mr-2" />
            )}
            Salvar na Minha Base
          </Button>

          <ProspeccaoActions
            selectedCount={selectedIds.length}
            onSendToFunnel={() => onSendToFunnelOpenChange(true)}
            onSendToLeadsBase={onSendToLeadsBase}
            onExport={onExport}
            isSendingToBase={isSendingToBase}
          />
        </div>
      </div>

      <div className="px-6 pt-4">
        <SearchStatsPanel stats={searchStats} isVisible={!isLoading && searchStats !== null} onClose={onClearStats} />
      </div>

      <SearchResultsPanel
        results={apiResults}
        isLoading={isLoading}
        selectedIds={selectedIds}
        onSelectChange={onSelectChange}
        onBack={onBack}
        totalResults={apiTotal}
      />

      <SendToFunnelDialog
        open={sendToFunnelOpen}
        onOpenChange={onSendToFunnelOpenChange}
        selectedProspects={selectedIds}
        prospects={displayData}
        onSuccess={() => onSelectChange([])}
      />
    </div>
  );
}
