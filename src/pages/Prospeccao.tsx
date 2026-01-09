import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, BookmarkCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProspeccaoFilters } from "@/components/prospeccao/ProspeccaoFilters";
import { ProspeccaoTable } from "@/components/prospeccao/ProspeccaoTable";
import { ProspeccaoActions } from "@/components/prospeccao/ProspeccaoActions";
import { SaveSearchDialog } from "@/components/prospeccao/SaveSearchDialog";
import { SendToFunnelDialog } from "@/components/prospeccao/SendToFunnelDialog";
import { useProspects, useSendToLeadsBase, type ProspectFilters } from "@/hooks/useProspects";
import { useSavedSearches } from "@/hooks/useSavedSearches";
import { toast } from "@/hooks/use-toast";

export default function Prospeccao() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<ProspectFilters>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [saveSearchOpen, setSaveSearchOpen] = useState(false);
  const [sendToFunnelOpen, setSendToFunnelOpen] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const { data: prospects = [], isLoading, isError, refetch } = useProspects(filters, hasSearched);
  const { data: savedSearches = [] } = useSavedSearches();
  const sendToLeadsBase = useSendToLeadsBase();

  // Sync filters with URL params
  useEffect(() => {
    const urlFilters: ProspectFilters = {};
    
    const search = searchParams.get("search");
    if (search) urlFilters.search = search;
    
    const segments = searchParams.get("segments");
    if (segments) urlFilters.segments = segments.split(",");
    
    const states = searchParams.get("states");
    if (states) urlFilters.states = states.split(",");
    
    const cities = searchParams.get("cities");
    if (cities) urlFilters.cities = cities.split(",");
    
    const sizes = searchParams.get("sizes");
    if (sizes) urlFilters.companySizes = sizes.split(",");
    
    if (searchParams.get("hasWebsite") === "true") urlFilters.hasWebsite = true;
    if (searchParams.get("hasPhone") === "true") urlFilters.hasPhone = true;
    if (searchParams.get("hasEmail") === "true") urlFilters.hasEmail = true;

    setFilters(urlFilters);
    
    // Auto-search if URL has filters
    if (Object.keys(urlFilters).length > 0) {
      setHasSearched(true);
    }
  }, []);

  // Update URL when filters change (but don't reset hasSearched)
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (filters.search) params.set("search", filters.search);
    if (filters.segments?.length) params.set("segments", filters.segments.join(","));
    if (filters.states?.length) params.set("states", filters.states.join(","));
    if (filters.cities?.length) params.set("cities", filters.cities.join(","));
    if (filters.companySizes?.length) params.set("sizes", filters.companySizes.join(","));
    if (filters.hasWebsite) params.set("hasWebsite", "true");
    if (filters.hasPhone) params.set("hasPhone", "true");
    if (filters.hasEmail) params.set("hasEmail", "true");

    setSearchParams(params, { replace: true });
    setPage(1);
    setSelectedIds([]);
  }, [filters, setSearchParams]);

  const handleSearch = () => {
    setHasSearched(true);
    refetch();
  };

  const handleClearFilters = () => {
    setFilters({});
    setHasSearched(false);
    setSelectedIds([]);
  };

  const handleLoadSavedSearch = (searchId: string) => {
    const search = savedSearches.find(s => s.id === searchId);
    if (search) {
      setFilters(search.filters);
      setHasSearched(true);
      toast({
        title: "Pesquisa carregada",
        description: `Filtros da pesquisa "${search.name}" aplicados.`
      });
    }
  };

  const handleExport = () => {
    const selectedProspects = prospects.filter(p => selectedIds.includes(p.id));
    
    // Create CSV content
    const headers = ["Nome", "CNPJ", "Segmento", "Cidade", "Estado", "Emails", "Telefones", "Status"];
    const rows = selectedProspects.map(p => [
      p.name,
      p.cnpj || "",
      p.segment,
      p.city,
      p.state,
      p.emails?.join("; ") || "",
      p.phones?.join("; ") || "",
      p.status
    ]);
    
    const csv = [headers.join(","), ...rows.map(r => r.map(cell => `"${cell}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `prospectos-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    
    toast({
      title: "Exportação concluída",
      description: `${selectedProspects.length} prospecto(s) exportados.`
    });
  };

  const handleSendToLeadsBase = () => {
    const selectedProspects = prospects.filter(p => selectedIds.includes(p.id));
    sendToLeadsBase.mutate(selectedProspects, {
      onSuccess: () => {
        setSelectedIds([]);
      }
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="p-6 border-b shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Search className="h-6 w-6" />
              Prospecção
            </h1>
            <p className="text-muted-foreground">
              Encontre empresas para prospectar e envie para sua base de leads
            </p>
          </div>
          
          {savedSearches.length > 0 && (
            <Select onValueChange={handleLoadSavedSearch}>
              <SelectTrigger className="w-[220px]">
                <BookmarkCheck className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Pesquisas salvas" />
              </SelectTrigger>
              <SelectContent>
                {savedSearches.map((search) => (
                  <SelectItem key={search.id} value={search.id}>
                    {search.name} ({search.results_count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Filters - Horizontal Bar */}
        <ProspeccaoFilters
          filters={filters}
          onFiltersChange={setFilters}
          onSearch={handleSearch}
          onClear={handleClearFilters}
          onSaveSearch={() => setSaveSearchOpen(true)}
          isLoading={isLoading}
        />
      </div>

      {/* Results Header */}
      {hasSearched && (
        <div className="px-6 py-3 border-b shrink-0 flex items-center justify-between bg-muted/30">
          <div className="text-sm text-muted-foreground">
            {selectedIds.length > 0 && (
              <span className="font-medium text-foreground">
                {selectedIds.length} selecionado(s) • 
              </span>
            )}{" "}
            {prospects.length} resultado(s) encontrado(s)
          </div>
          <ProspeccaoActions
            selectedCount={selectedIds.length}
            onSendToFunnel={() => setSendToFunnelOpen(true)}
            onSendToLeadsBase={handleSendToLeadsBase}
            onExport={handleExport}
            isSendingToBase={sendToLeadsBase.isPending}
          />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {isError ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Erro ao carregar os prospectos.{" "}
              <Button variant="link" className="p-0 h-auto" onClick={() => refetch()}>
                Tentar novamente
              </Button>
            </AlertDescription>
          </Alert>
        ) : !hasSearched ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Search className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold">Encontre empresas para prospectar</h3>
            <p className="text-muted-foreground mt-1 max-w-md">
              Utilize os filtros acima e clique em "Buscar" para encontrar empresas que correspondem ao seu perfil de cliente ideal.
            </p>
          </div>
        ) : (
          <ProspeccaoTable
            prospects={prospects}
            isLoading={isLoading}
            selectedIds={selectedIds}
            onSelectChange={setSelectedIds}
            page={page}
            onPageChange={setPage}
          />
        )}
      </div>

      <SaveSearchDialog
        open={saveSearchOpen}
        onOpenChange={setSaveSearchOpen}
        filters={filters}
        resultsCount={prospects.length}
      />

      <SendToFunnelDialog
        open={sendToFunnelOpen}
        onOpenChange={setSendToFunnelOpen}
        selectedProspects={selectedIds}
        onSuccess={() => setSelectedIds([])}
      />
    </div>
  );
}
