import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, BookmarkCheck, AlertCircle, FileSpreadsheet, Globe, Database, ArrowLeft } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProspeccaoFilters } from "@/components/prospeccao/ProspeccaoFilters";
import { ProspeccaoTable } from "@/components/prospeccao/ProspeccaoTable";
import { ProspeccaoActions } from "@/components/prospeccao/ProspeccaoActions";
import { SaveSearchDialog } from "@/components/prospeccao/SaveSearchDialog";
import { SendToFunnelDialog } from "@/components/prospeccao/SendToFunnelDialog";
import { CNPJSearchInput } from "@/components/prospeccao/CNPJSearchInput";
import { CNPJResultCard } from "@/components/prospeccao/CNPJResultCard";
import { CNPJBatchDialog } from "@/components/prospeccao/CNPJBatchDialog";
import { RecentFiltersSelect, saveRecentProspeccaoFilters } from "@/components/prospeccao/RecentFiltersSelect";
import { SearchResultsPanel } from "@/components/prospeccao/SearchResultsPanel";
import { SearchLoadingOverlay } from "@/components/prospeccao/SearchLoadingOverlay";
import { useProspects, useSendToLeadsBase, useAddProspectFromCNPJ, type ProspectFilters } from "@/hooks/useProspects";
import { useSavedSearches } from "@/hooks/useSavedSearches";
import { useCNPJLookupManual, type CNPJLookupResult } from "@/hooks/useCNPJLookup";
import { useCompanySearch, type CompanySearchResult } from "@/hooks/useCompanySearch";
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
  const [showResultsPanel, setShowResultsPanel] = useState(false);
  const [searchMode, setSearchMode] = useState<"api" | "database">("api");
  
  // API Search results
  const [apiResults, setApiResults] = useState<CompanySearchResult[]>([]);
  const [apiTotal, setApiTotal] = useState(0);
  
  // CNPJ Lookup State
  const [cnpjResult, setCnpjResult] = useState<CNPJLookupResult | null>(null);
  const [cnpjLoading, setCnpjLoading] = useState(false);
  const [cnpjError, setCnpjError] = useState<string | null>(null);
  const [batchAdding, setBatchAdding] = useState(false);

  // Database query (for "Minha Base")
  const { data: prospects = [], isLoading: dbLoading, isError, refetch } = useProspects(filters, hasSearched && searchMode === "database");
  
  // API search mutation
  const companySearch = useCompanySearch();
  
  const { data: savedSearches = [] } = useSavedSearches();
  const sendToLeadsBase = useSendToLeadsBase();
  const addProspectFromCNPJ = useAddProspectFromCNPJ();
  const { lookup } = useCNPJLookupManual();

  // Sync filters with URL params - only on mount
  useEffect(() => {
    const urlFilters: ProspectFilters = {};
    
    const search = searchParams.get("search");
    if (search) urlFilters.search = search;
    
    const segments = searchParams.get("segments");
    if (segments) {
      // Remove duplicates using Set
      urlFilters.segments = [...new Set(segments.split(",").filter(Boolean))];
    }
    
    const states = searchParams.get("states");
    if (states) {
      urlFilters.states = [...new Set(states.split(",").filter(Boolean))];
    }
    
    const cities = searchParams.get("cities");
    if (cities) {
      urlFilters.cities = [...new Set(cities.split(",").filter(Boolean))];
    }
    
    const sizes = searchParams.get("sizes");
    if (sizes) {
      urlFilters.companySizes = [...new Set(sizes.split(",").filter(Boolean))];
    }
    
    if (searchParams.get("hasWebsite") === "true") urlFilters.hasWebsite = true;
    if (searchParams.get("hasPhone") === "true") urlFilters.hasPhone = true;
    if (searchParams.get("hasEmail") === "true") urlFilters.hasEmail = true;

    setFilters(urlFilters);
    
    // Auto-search if URL has filters
    if (Object.keys(urlFilters).length > 0) {
      setHasSearched(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update URL when filters change (but don't reset hasSearched)
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (filters.search) params.set("search", filters.search);
    // Ensure unique values when setting URL params
    if (filters.segments?.length) {
      params.set("segments", [...new Set(filters.segments)].join(","));
    }
    if (filters.states?.length) {
      params.set("states", [...new Set(filters.states)].join(","));
    }
    if (filters.cities?.length) {
      params.set("cities", [...new Set(filters.cities)].join(","));
    }
    if (filters.companySizes?.length) {
      params.set("sizes", [...new Set(filters.companySizes)].join(","));
    }
    if (filters.hasWebsite) params.set("hasWebsite", "true");
    if (filters.hasPhone) params.set("hasPhone", "true");
    if (filters.hasEmail) params.set("hasEmail", "true");

    setSearchParams(params, { replace: true });
    setPage(1);
    setSelectedIds([]);
  }, [filters, setSearchParams, pageSize]);

  const handleSearch = async () => {
    saveRecentProspeccaoFilters(filters);
    setHasSearched(true);
    setApiResults([]);
    setApiTotal(0);
    
    if (searchMode === "api") {
      // Search via API (Firecrawl + BrasilAPI)
      try {
        const result = await companySearch.mutateAsync({
          filters,
          page: 1,
          pageSize,
        });
        
        setApiResults(result.companies);
        setApiTotal(result.total);
        setShowResultsPanel(true); // Show results panel after search
        
        if (result.error) {
          toast({
            title: "Aviso",
            description: result.error,
            variant: "destructive",
          });
        } else if (result.companies.length === 0) {
          toast({
            title: "Nenhum resultado",
            description: "Tente ajustar os filtros para encontrar empresas.",
          });
        } else {
          toast({
            title: "Busca concluída",
            description: `${result.companies.length} empresa(s) encontrada(s).`,
          });
        }
      } catch (error) {
        console.error("Search error:", error);
        toast({
          title: "Erro na busca",
          description: error instanceof Error ? error.message : "Erro ao buscar empresas",
          variant: "destructive",
        });
      }
    } else {
      // Search in database
      refetch();
    }
  };

  const handleCancelSearch = () => {
    companySearch.cancel();
    toast({
      title: "Busca cancelada",
      description: "A busca foi interrompida.",
    });
  };

  const handleClearFilters = () => {
    setFilters({});
    setHasSearched(false);
    setShowResultsPanel(false);
    setSelectedIds([]);
    setApiResults([]);
    setApiTotal(0);
  };

  const handleBackFromResults = () => {
    setShowResultsPanel(false);
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
    const dataToExport = searchMode === "api" ? apiResults : prospects;
    const selectedData = dataToExport.filter(p => selectedIds.includes(p.id || p.cnpj));
    
    // Create CSV content
    const headers = ["Nome", "CNPJ", "Segmento", "Cidade", "Estado", "Emails", "Telefones"];
    const rows = selectedData.map(p => [
      p.name,
      p.cnpj || "",
      p.segment || "",
      p.city || "",
      p.state || "",
      (p.emails || []).join("; "),
      (p.phones || []).join("; "),
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
      description: `${selectedData.length} prospecto(s) exportados.`
    });
  };

  const handleSendToLeadsBase = async () => {
    if (searchMode === "api") {
      // Convert API results to prospects first
      const selectedCompanies = apiResults.filter(c => selectedIds.includes(c.id || c.cnpj));
      
      for (const company of selectedCompanies) {
        try {
          // Create prospect-like object
          const prospectData = {
            id: company.cnpj,
            name: company.name,
            cnpj: company.cnpj,
            segment: company.segment,
            cnae_code: company.cnae_code,
            cnae_description: company.cnae_description,
            company_size: company.company_size,
            city: company.city,
            state: company.state,
            neighborhood: company.neighborhood,
            has_website: company.has_website,
            website_url: undefined,
            has_phone: company.has_phone,
            has_email: company.has_email,
            emails_count: company.emails.length,
            phones_count: company.phones.length,
            data_revealed: true,
            emails: company.emails,
            phones: company.phones,
            social_links: undefined,
            status: "novo" as const,
            tags: ["api-search"],
            source: "casadosdados",
          };
          
          await sendToLeadsBase.mutateAsync([prospectData as any]);
        } catch (error) {
          console.error("Error sending to leads:", error);
        }
      }
      
      setSelectedIds([]);
    } else {
      const selectedProspects = prospects.filter(p => selectedIds.includes(p.id));
      sendToLeadsBase.mutate(selectedProspects, {
        onSuccess: () => {
          setSelectedIds([]);
        }
      });
    }
  };

  // Add API results to local prospects database
  const handleAddToMyBase = async () => {
    const selectedCompanies = apiResults.filter(c => selectedIds.includes(c.id || c.cnpj));
    let successCount = 0;
    
    for (const company of selectedCompanies) {
      try {
        // Convert to CNPJ lookup format for the hook
        const cnpjData: CNPJLookupResult = {
          cnpj: company.cnpj,
          razaoSocial: company.razao_social || company.name,
          nomeFantasia: company.name,
          situacaoCadastral: company.situacao || "ATIVA",
          cnaeFiscal: parseInt(company.cnae_code.replace(/\D/g, "")) || 0,
          cnaeFiscalDescricao: company.cnae_description,
          uf: company.state,
          cidade: company.city,
          bairro: company.neighborhood || "",
          cep: company.zip_code || "",
          endereco: [company.address, company.number, company.complement].filter(Boolean).join(" "),
          telefone1: company.phones[0] || null,
          telefone2: company.phones[1] || null,
          email: company.emails[0] || null,
          porte: company.company_size,
          naturezaJuridica: "",
          capitalSocial: company.capital_social || 0,
          dataSituacaoCadastral: "",
          dataInicioAtividade: company.data_abertura || "",
          socios: [],
        };
        
        await addProspectFromCNPJ.mutateAsync(cnpjData);
        successCount++;
      } catch (error) {
        console.error("Error adding to base:", error);
      }
    }
    
    toast({
      title: "Adicionados à base",
      description: `${successCount} de ${selectedCompanies.length} empresa(s) adicionadas à sua base.`,
    });
    
    setSelectedIds([]);
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

  // Transform API results to the same format as prospects for the table
  const displayData = searchMode === "api" ? apiResults.map(c => ({
    id: c.id || c.cnpj,
    name: c.name,
    cnpj: c.cnpj,
    segment: c.segment,
    cnae_code: c.cnae_code,
    cnae_description: c.cnae_description,
    company_size: c.company_size,
    city: c.city,
    state: c.state,
    neighborhood: c.neighborhood,
    has_website: c.has_website,
    website_url: undefined,
    has_phone: c.has_phone,
    has_email: c.has_email,
    emails_count: c.emails.length,
    phones_count: c.phones.length,
    data_revealed: true,
    emails: c.emails,
    phones: c.phones,
    social_links: undefined,
    status: "novo" as const,
    tags: [],
    source: "casadosdados",
  })) : prospects;

  const isLoading = searchMode === "api" ? companySearch.isPending : dbLoading;
  const totalResults = searchMode === "api" ? apiTotal : prospects.length;

  // If showing results panel (API search), render a clean view
  if (showResultsPanel && searchMode === "api") {
    return (
      <>
        <SearchLoadingOverlay isVisible={companySearch.isPending} filters={filters} onCancel={handleCancelSearch} />
        <div className="flex flex-col h-[calc(100vh-4rem)]">
        {/* Results Header with Actions */}
        <div className="px-6 py-3 border-b shrink-0 flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={handleBackFromResults}>
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

            {selectedIds.length > 0 && (
              <Button
                variant="outline"
                onClick={handleAddToMyBase}
                disabled={addProspectFromCNPJ.isPending}
              >
                <Database className="h-4 w-4 mr-2" />
                Salvar na Minha Base
              </Button>
            )}

            <ProspeccaoActions
              selectedCount={selectedIds.length}
              onSendToFunnel={() => setSendToFunnelOpen(true)}
              onSendToLeadsBase={handleSendToLeadsBase}
              onExport={handleExport}
              isSendingToBase={sendToLeadsBase.isPending}
            />
          </div>
        </div>

        {/* Results Panel */}
        <SearchResultsPanel
          results={apiResults}
          isLoading={companySearch.isPending}
          selectedIds={selectedIds}
          onSelectChange={setSelectedIds}
          onBack={handleBackFromResults}
          totalResults={apiTotal}
        />

        {/* Dialogs */}
        <SendToFunnelDialog
          open={sendToFunnelOpen}
          onOpenChange={setSendToFunnelOpen}
          selectedProspects={selectedIds}
          onSuccess={() => setSelectedIds([])}
        />
        </div>
      </>
    );
  }

  // Default view with filters
  return (
    <>
      <SearchLoadingOverlay isVisible={companySearch.isPending} filters={filters} onCancel={handleCancelSearch} />
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
              Encontre empresas ativas para prospectar e envie para sua base de leads
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <RecentFiltersSelect
              onApply={(recent) => {
                setFilters(recent);
                toast({
                  title: "Filtros recentes aplicados",
                  description: "Clique em Buscar para ver os resultados.",
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

        {/* Search Mode Tabs */}
        <Tabs value={searchMode} onValueChange={(v) => setSearchMode(v as "api" | "database")} className="mb-4">
          <TabsList>
            <TabsTrigger value="api" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Buscar na Internet
            </TabsTrigger>
            <TabsTrigger value="database" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Minha Base
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Search Mode Description */}
        <div className="mb-4 text-sm text-muted-foreground">
          {searchMode === "api" ? (
            <span className="flex items-center gap-1">
              <Globe className="h-4 w-4" />
              Busca empresas ativas via web scraping inteligente (Firecrawl + BrasilAPI)
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <Database className="h-4 w-4" />
              Busca apenas nos prospectos que você já salvou na sua base local
            </span>
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

      {/* Results Header - Only for database mode */}
      {hasSearched && searchMode === "database" && (
        <div className="px-6 py-3 border-b shrink-0 flex items-center justify-between bg-muted/30">
          <div className="text-sm text-muted-foreground">
            {selectedIds.length > 0 && (
              <span className="font-medium text-foreground">
                {selectedIds.length} selecionado(s) •
              </span>
            )}{" "}
            {displayData.length} resultado(s) encontrado(s)
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
        {isError && searchMode === "database" ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Erro ao carregar os prospectos.{" "}
              <Button variant="link" className="p-0 h-auto" onClick={() => refetch()}>
                Tentar novamente
              </Button>
            </AlertDescription>
          </Alert>
        ) : !hasSearched || searchMode === "api" ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Search className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold">Encontre empresas para prospectar</h3>
            <p className="text-muted-foreground mt-1 max-w-md">
              {searchMode === "api" 
                ? "Utilize os filtros acima e clique em Buscar para encontrar empresas ativas."
                : "Consulte um CNPJ específico ou utilize os filtros para encontrar empresas na sua base."}
            </p>
          </div>
        ) : (
          <ProspeccaoTable
            prospects={displayData}
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
        resultsCount={displayData.length}
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
    </>
  );
}
