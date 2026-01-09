import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, BookmarkCheck, AlertCircle, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ProspeccaoFilters } from "@/components/prospeccao/ProspeccaoFilters";
import { ProspeccaoTable } from "@/components/prospeccao/ProspeccaoTable";
import { ProspeccaoActions } from "@/components/prospeccao/ProspeccaoActions";
import { SaveSearchDialog } from "@/components/prospeccao/SaveSearchDialog";
import { SendToFunnelDialog } from "@/components/prospeccao/SendToFunnelDialog";
import { CNPJSearchInput } from "@/components/prospeccao/CNPJSearchInput";
import { CNPJResultCard } from "@/components/prospeccao/CNPJResultCard";
import { CNPJBatchDialog } from "@/components/prospeccao/CNPJBatchDialog";
import { RecentFiltersSelect, saveRecentProspeccaoFilters } from "@/components/prospeccao/RecentFiltersSelect";
import { useProspects, useSendToLeadsBase, useAddProspectFromCNPJ, type ProspectFilters } from "@/hooks/useProspects";
import { useSavedSearches } from "@/hooks/useSavedSearches";
import { useCNPJLookupManual, type CNPJLookupResult } from "@/hooks/useCNPJLookup";
import { toast } from "@/hooks/use-toast";

export default function Prospeccao() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<ProspectFilters>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [saveSearchOpen, setSaveSearchOpen] = useState(false);
  const [sendToFunnelOpen, setSendToFunnelOpen] = useState(false);
  const [sendCNPJToFunnelOpen, setSendCNPJToFunnelOpen] = useState(false);
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  // CNPJ Lookup State
  const [cnpjResult, setCnpjResult] = useState<CNPJLookupResult | null>(null);
  const [cnpjLoading, setCnpjLoading] = useState(false);
  const [cnpjError, setCnpjError] = useState<string | null>(null);
  const [batchAdding, setBatchAdding] = useState(false);

  const { data: prospects = [], isLoading, isError, refetch } = useProspects(filters, hasSearched);
  const { data: savedSearches = [] } = useSavedSearches();
  const sendToLeadsBase = useSendToLeadsBase();
  const addProspectFromCNPJ = useAddProspectFromCNPJ();
  const { lookup } = useCNPJLookupManual();

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
  }, [filters, setSearchParams, pageSize]);

  const handleSearch = () => {
    saveRecentProspeccaoFilters(filters);
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

  // CNPJ Lookup handlers
  const handleCNPJSearch = async (cnpj: string) => {
    setCnpjLoading(true);
    setCnpjError(null);
    setCnpjResult(null);
    
    try {
      const result = await lookup(cnpj);
      setCnpjResult(result);
    } catch (error) {
      setCnpjError(error instanceof Error ? error.message : "Erro ao consultar CNPJ");
      toast({
        title: "Erro na consulta",
        description: error instanceof Error ? error.message : "Erro ao consultar CNPJ",
        variant: "destructive"
      });
    } finally {
      setCnpjLoading(false);
    }
  };
  
  const handleCNPJClear = () => {
    setCnpjResult(null);
    setCnpjError(null);
  };
  
  const handleAddCNPJToProspects = () => {
    if (!cnpjResult) return;
    
    addProspectFromCNPJ.mutate(cnpjResult, {
      onSuccess: () => {
        toast({
          title: "Prospecto adicionado",
          description: `${cnpjResult.nomeFantasia || cnpjResult.razaoSocial} foi adicionado à lista.`
        });
      }
    });
  };
  
  const handleSendCNPJToLeads = () => {
    if (!cnpjResult) return;
    
    addProspectFromCNPJ.mutate(cnpjResult, {
      onSuccess: (prospect) => {
        sendToLeadsBase.mutate([prospect], {
          onSuccess: () => {
            toast({
              title: "Lead criado",
              description: `${cnpjResult.nomeFantasia || cnpjResult.razaoSocial} foi enviado para a base de leads.`
            });
          }
        });
      }
    });
  };

  // Batch handlers
  const handleBatchAddToProspects = async (results: CNPJLookupResult[]) => {
    setBatchAdding(true);
    let successCount = 0;
    
    for (const data of results) {
      try {
        await addProspectFromCNPJ.mutateAsync(data);
        successCount++;
      } catch (error) {
        console.error("Error adding prospect:", error);
      }
    }
    
    setBatchAdding(false);
    toast({
      title: "Prospectos adicionados",
      description: `${successCount} de ${results.length} empresa(s) adicionadas à lista.`
    });
  };

  const handleBatchSendToLeads = async (results: CNPJLookupResult[]) => {
    setBatchAdding(true);
    let successCount = 0;
    
    for (const data of results) {
      try {
        const prospect = await addProspectFromCNPJ.mutateAsync(data);
        await sendToLeadsBase.mutateAsync([prospect]);
        successCount++;
      } catch (error) {
        console.error("Error sending to leads:", error);
      }
    }
    
    setBatchAdding(false);
    toast({
      title: "Leads criados",
      description: `${successCount} de ${results.length} lead(s) adicionados à base.`
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
          
          <div className="flex items-center gap-3">
            <RecentFiltersSelect
              onApply={(recent) => {
                setFilters(recent);
                setHasSearched(true);
                toast({
                  title: "Filtros recentes aplicados",
                  description: "Você pode clicar em Buscar para atualizar os resultados.",
                });
              }}
            />

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
        </div>

        {/* CNPJ Search */}
        <div className="mb-4">
          <p className="text-sm font-medium mb-2">Consultar empresa por CNPJ (BrasilAPI)</p>
          <div className="flex items-center gap-4">
            <CNPJSearchInput
              onSearch={handleCNPJSearch}
              onClear={handleCNPJClear}
              isLoading={cnpjLoading}
              hasResult={!!cnpjResult}
            />
            <Button 
              variant="outline" 
              onClick={() => setBatchDialogOpen(true)}
              className="shrink-0"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Consulta em Lote
            </Button>
          </div>
        </div>
        
        {/* CNPJ Result */}
        {cnpjResult && (
          <div className="mb-4">
            <CNPJResultCard
              data={cnpjResult}
              onAddToProspects={handleAddCNPJToProspects}
              onSendToLeads={handleSendCNPJToLeads}
              onSendToFunnel={() => setSendCNPJToFunnelOpen(true)}
              isAdding={addProspectFromCNPJ.isPending || sendToLeadsBase.isPending}
            />
          </div>
        )}
        
        {cnpjError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{cnpjError}</AlertDescription>
          </Alert>
        )}

        <Separator className="my-4" />

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

          <div className="flex items-center gap-3">
            <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
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

            <ProspeccaoActions
              selectedCount={selectedIds.length}
              onSendToFunnel={() => setSendToFunnelOpen(true)}
              onSendToLeadsBase={handleSendToLeadsBase}
              onExport={handleExport}
              isSendingToBase={sendToLeadsBase.isPending}
            />
          </div>
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
              Consulte um CNPJ específico acima ou utilize os filtros e clique em "Buscar" para encontrar empresas.
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
            pageSize={pageSize}
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
      
      {/* Dialog for sending CNPJ result to funnel */}
      {cnpjResult && (
        <SendToFunnelDialog
          open={sendCNPJToFunnelOpen}
          onOpenChange={setSendCNPJToFunnelOpen}
          selectedProspects={[cnpjResult.cnpj]}
          cnpjData={cnpjResult}
          onSuccess={() => {
            toast({
              title: "Enviado para funil",
              description: `${cnpjResult.nomeFantasia || cnpjResult.razaoSocial} foi enviado para o funil.`
            });
          }}
        />
      )}

      {/* Batch CNPJ Dialog */}
      <CNPJBatchDialog
        open={batchDialogOpen}
        onOpenChange={setBatchDialogOpen}
        onAddToProspects={handleBatchAddToProspects}
        onSendToLeads={handleBatchSendToLeads}
        isAdding={batchAdding}
      />
    </div>
  );
}
