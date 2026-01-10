import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useProspects, useSendToLeadsBase, useAddProspectFromCNPJ, type ProspectFilters } from "@/hooks/useProspects";
import { useSavedSearches, useDeleteSavedSearch } from "@/hooks/useSavedSearches";
import { useCNPJLookupManual, type CNPJLookupResult } from "@/hooks/useCNPJLookup";
import { useCompanySearch, type CompanySearchResult } from "@/hooks/useCompanySearch";
import { useStreamingSearch } from "@/hooks/useStreamingSearch";
import { useSearchCache } from "@/hooks/useSearchCache";
import { useBrowserNotification } from "@/hooks/useBrowserNotification";
import { useNotifications } from "@/contexts/NotificationContext";
import { useBackgroundSearch } from "@/contexts/BackgroundSearchContext";
import { toast } from "@/hooks/use-toast";
import { saveRecentProspeccaoFilters } from "@/components/prospeccao/RecentFiltersSelect";
import type { SearchDebugStats } from "@/components/prospeccao/SearchStatsPanel";

export type SearchMode = "internet" | "cnpj" | "database" | "pull-cnpjs";

export function useProspeccaoState() {
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
  const [isSearchMinimized, setIsSearchMinimized] = useState(false);
  const [searchMode, setSearchMode] = useState<SearchMode>("internet");
  
  // API Search results
  const [apiResults, setApiResults] = useState<CompanySearchResult[]>([]);
  const [apiTotal, setApiTotal] = useState(0);
  const [searchStats, setSearchStats] = useState<SearchDebugStats | null>(null);
  
  // CNPJ Lookup State
  const [cnpjResult, setCnpjResult] = useState<CNPJLookupResult | null>(null);
  const [cnpjLoading, setCnpjLoading] = useState(false);
  const [cnpjError, setCnpjError] = useState<string | null>(null);
  const [batchAdding, setBatchAdding] = useState(false);

  // Hooks
  // For database mode, always fetch (auto-filter without search button)
  const { data: prospects = [], isLoading: dbLoading, isError, refetch } = useProspects(filters, searchMode === "database");
  const streamingSearch = useStreamingSearch();
  const companySearch = useCompanySearch();
  const { findCached, addToCache, getRecentSearches, clearCache } = useSearchCache();
  const { permission, requestPermission, sendNotification } = useBrowserNotification();
  const { addNotification } = useNotifications();
  const { activeSearch, isSearching: isBackgroundSearching, startBackgroundSearch, cancelSearch: cancelBackgroundSearch, clearSearch } = useBackgroundSearch();
  const { data: savedSearches = [] } = useSavedSearches();
  const deleteSavedSearch = useDeleteSavedSearch();
  const sendToLeadsBase = useSendToLeadsBase();
  const addProspectFromCNPJ = useAddProspectFromCNPJ();
  const { lookup } = useCNPJLookupManual();

  const handleDeleteSavedSearch = useCallback((searchId: string) => {
    deleteSavedSearch.mutate(searchId);
  }, [deleteSavedSearch]);

  // Check for completed background search results on mount
  useEffect(() => {
    if (activeSearch?.status === "completed" && activeSearch.results) {
      setApiResults(activeSearch.results);
      setApiTotal(activeSearch.total || 0);
      setHasSearched(true);
      setShowResultsPanel(true);
      if (activeSearch.stats) {
        setSearchStats(activeSearch.stats);
      }
      clearSearch();
    }
  }, [activeSearch, clearSearch]);

  // Sync filters with URL params - only on mount
  useEffect(() => {
    const urlFilters: ProspectFilters = {};
    
    const search = searchParams.get("search");
    if (search) urlFilters.search = search;
    
    const segments = searchParams.get("segments");
    if (segments) {
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
    
    if (Object.keys(urlFilters).length > 0) {
      setHasSearched(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (filters.search) params.set("search", filters.search);
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
  }, [filters, setSearchParams]);

  // Watch streaming search for completion
  useEffect(() => {
    if (!streamingSearch.isSearching && streamingSearch.companies.length > 0) {
      setApiResults(streamingSearch.companies);
      setApiTotal(streamingSearch.stats?.totalCNPJsFound || streamingSearch.companies.length);
      setShowResultsPanel(true);
      
      if (streamingSearch.stats) {
        setSearchStats(streamingSearch.stats);
      }
      
      if (streamingSearch.companies.length > 0) {
        addToCache(filters, streamingSearch.companies, streamingSearch.stats?.totalCNPJsFound || streamingSearch.companies.length, pageSize);
      }
      
      const timeInfo = streamingSearch.stats?.processingTimeMs 
        ? ` em ${(streamingSearch.stats.processingTimeMs / 1000).toFixed(1)}s`
        : "";
      
      toast({
        title: "Busca concluída",
        description: `${streamingSearch.companies.length} empresa(s) encontrada(s)${timeInfo}.`,
      });
    }
  }, [streamingSearch.isSearching, streamingSearch.companies, streamingSearch.stats, addToCache, filters]);

  // Handlers
  const handleMinimizeToBackground = useCallback(async () => {
    companySearch.cancel();
    
    try {
      await startBackgroundSearch(filters, pageSize);
      toast({
        title: "Busca em segundo plano",
        description: "A busca continuará mesmo se você navegar para outras páginas.",
      });
    } catch (error) {
      // Error handled by context
    }
  }, [companySearch, startBackgroundSearch, filters, pageSize]);

  const handleSearch = useCallback(async () => {
    saveRecentProspeccaoFilters(filters);
    setHasSearched(true);
    setApiResults([]);
    setApiTotal(0);
    setSearchStats(null);
    setIsSearchMinimized(false);
    
    if (searchMode === "internet") {
      // Only use cache if same filters AND same pageSize
      const cached = findCached(filters, pageSize);
      if (cached) {
        setApiResults(cached.results);
        setApiTotal(cached.total);
        setShowResultsPanel(true);
        toast({
          title: "Resultados do cache",
          description: `${cached.results.length} empresa(s) carregadas do histórico.`,
        });
        return;
      }

      streamingSearch.startSearch(filters, pageSize);
    } else {
      refetch();
    }
  }, [filters, searchMode, findCached, streamingSearch, pageSize, refetch]);

  const handleViewStreamingResults = useCallback(() => {
    setApiResults(streamingSearch.companies);
    setApiTotal(streamingSearch.progress.total);
    setShowResultsPanel(true);
  }, [streamingSearch.companies, streamingSearch.progress.total]);

  const handleApplyCachedSearch = useCallback((cachedFilters: ProspectFilters, results: CompanySearchResult[], total: number) => {
    setFilters(cachedFilters);
    setApiResults(results);
    setApiTotal(total);
    setHasSearched(true);
    setShowResultsPanel(true);
    toast({
      title: "Busca restaurada",
      description: `${results.length} empresa(s) carregadas do histórico.`,
    });
  }, []);

  const handleApplyTemplate = useCallback((templateFilters: ProspectFilters) => {
    setFilters(templateFilters);
    toast({
      title: "Template aplicado",
      description: "Clique em Buscar para ver os resultados.",
    });
  }, []);

  const handleCancelSearch = useCallback(() => {
    streamingSearch.cancelSearch();
    companySearch.cancel();
    toast({
      title: "Busca cancelada",
      description: "A busca foi interrompida.",
    });
  }, [streamingSearch, companySearch]);

  const handleClearFilters = useCallback(() => {
    setFilters({});
    setHasSearched(false);
    setShowResultsPanel(false);
    setSelectedIds([]);
    setApiResults([]);
    setApiTotal(0);
  }, []);

  const handleBackFromResults = useCallback(() => {
    setShowResultsPanel(false);
  }, []);

  const handleLoadSavedSearch = useCallback((searchId: string) => {
    const search = savedSearches.find(s => s.id === searchId);
    if (search) {
      setFilters(search.filters);
      setHasSearched(true);
      toast({
        title: "Pesquisa carregada",
        description: `Filtros da pesquisa "${search.name}" aplicados.`
      });
    }
  }, [savedSearches]);

  const handleExport = useCallback(() => {
    const dataToExport = searchMode === "internet" ? apiResults : prospects;
    const selectedData = dataToExport.filter(p => selectedIds.includes(p.id || p.cnpj));
    
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
  }, [searchMode, apiResults, prospects, selectedIds]);

  const handleSendToLeadsBase = useCallback(async () => {
    if (searchMode === "internet") {
      const selectedCompanies = apiResults.filter(c => selectedIds.includes(c.id || c.cnpj));
      
      for (const company of selectedCompanies) {
        try {
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
  }, [searchMode, apiResults, prospects, selectedIds, sendToLeadsBase]);

  const handleAddToMyBase = useCallback(async () => {
    const selectedCompanies = apiResults.filter(c => selectedIds.includes(c.id || c.cnpj));
    let successCount = 0;
    
    for (const company of selectedCompanies) {
      try {
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
  }, [apiResults, selectedIds, addProspectFromCNPJ]);

  // CNPJ Lookup handlers
  const handleCNPJSearch = useCallback(async (cnpj: string) => {
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
  }, [lookup]);
  
  const handleCNPJClear = useCallback(() => {
    setCnpjResult(null);
    setCnpjError(null);
  }, []);
  
  const handleAddCNPJToProspects = useCallback(() => {
    if (!cnpjResult) return;
    
    addProspectFromCNPJ.mutate(cnpjResult, {
      onSuccess: () => {
        toast({
          title: "Prospecto adicionado",
          description: `${cnpjResult.nomeFantasia || cnpjResult.razaoSocial} foi adicionado à lista.`
        });
      }
    });
  }, [cnpjResult, addProspectFromCNPJ]);
  
  const handleSendCNPJToLeads = useCallback(() => {
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
  }, [cnpjResult, addProspectFromCNPJ, sendToLeadsBase]);

  // Batch handlers
  const handleBatchAddToProspects = useCallback(async (results: CNPJLookupResult[]) => {
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
  }, [addProspectFromCNPJ]);

  const handleBatchSendToLeads = useCallback(async (results: CNPJLookupResult[]) => {
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
  }, [addProspectFromCNPJ, sendToLeadsBase]);

  // Transform API results to the same format as prospects for the table
  const displayData = searchMode === "internet" ? apiResults.map(c => ({
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

  const isLoading = searchMode === "internet" ? companySearch.isPending : dbLoading;

  return {
    // State
    filters,
    setFilters,
    selectedIds,
    setSelectedIds,
    page,
    setPage,
    pageSize,
    setPageSize,
    saveSearchOpen,
    setSaveSearchOpen,
    sendToFunnelOpen,
    setSendToFunnelOpen,
    sendCNPJToFunnelOpen,
    setSendCNPJToFunnelOpen,
    batchDialogOpen,
    setBatchDialogOpen,
    hasSearched,
    showResultsPanel,
    isSearchMinimized,
    setIsSearchMinimized,
    searchMode,
    setSearchMode,
    apiResults,
    apiTotal,
    searchStats,
    cnpjResult,
    cnpjLoading,
    cnpjError,
    batchAdding,
    
    // Data
    prospects,
    displayData,
    savedSearches,
    isLoading,
    isError,
    
    // Search state
    streamingSearch,
    companySearch,
    
    // Cache
    getRecentSearches,
    clearCache,
    
    // Mutations
    sendToLeadsBase,
    addProspectFromCNPJ,
    
    // Handlers
    handleMinimizeToBackground,
    handleSearch,
    handleViewStreamingResults,
    handleApplyCachedSearch,
    handleApplyTemplate,
    handleCancelSearch,
    handleClearFilters,
    handleBackFromResults,
    handleLoadSavedSearch,
    handleDeleteSavedSearch,
    handleExport,
    handleSendToLeadsBase,
    handleAddToMyBase,
    handleCNPJSearch,
    handleCNPJClear,
    handleAddCNPJToProspects,
    handleSendCNPJToLeads,
    handleBatchAddToProspects,
    handleBatchSendToLeads,
    
    // Refetch
    refetch,
  };
}
