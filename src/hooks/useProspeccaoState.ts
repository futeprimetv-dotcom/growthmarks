import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useProspects, useSendToLeadsBase, useAddProspectFromCNPJ, useAddProspectsFromInternet, type ProspectFilters } from "@/hooks/useProspects";
import { useSavedSearches, useDeleteSavedSearch } from "@/hooks/useSavedSearches";
import { useCNPJLookupManual, type CNPJLookupResult } from "@/hooks/useCNPJLookup";
import { useCompanySearch, type CompanySearchResult } from "@/hooks/useCompanySearch";
import { useSearchCache } from "@/hooks/useSearchCache";
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
  const [sendToLeadsConfirmOpen, setSendToLeadsConfirmOpen] = useState(false);
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showResultsPanel, setShowResultsPanel] = useState(false);
  const [searchMode, setSearchModeInternal] = useState<SearchMode>("internet");

  // Wrapper to clear segment filter when switching to database mode
  // (internet search segments don't match database CNAE descriptions)
  const setSearchMode = useCallback((mode: SearchMode) => {
    if (mode === "database") {
      // Clear segment filter since internet segments don't match DB segments
      setFilters(prev => ({
        ...prev,
        segments: undefined
      }));
    }
    setSearchModeInternal(mode);
  }, []);
  
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
  const companySearch = useCompanySearch();
  const { findCached, addToCache, getRecentSearches, clearCache } = useSearchCache();
  const { activeSearch, isSearching: isBackgroundSearching, startBackgroundSearch, cancelSearch: cancelBackgroundSearch, clearSearch } = useBackgroundSearch();
  const { data: savedSearches = [] } = useSavedSearches();
  const deleteSavedSearch = useDeleteSavedSearch();
  const sendToLeadsBase = useSendToLeadsBase();
  const addProspectFromCNPJ = useAddProspectFromCNPJ();
  const addProspectsFromInternet = useAddProspectsFromInternet();
  const { lookup } = useCNPJLookupManual();

  const handleDeleteSavedSearch = useCallback((searchId: string) => {
    deleteSavedSearch.mutate(searchId);
  }, [deleteSavedSearch]);

  // Sync results with active background search in real-time
  useEffect(() => {
    if (activeSearch && activeSearch.status === "running" && activeSearch.results.length > 0) {
      // Update results in real-time as they come in
      setApiResults(activeSearch.results);
      setApiTotal(activeSearch.results.length);
      setHasSearched(true);
      // Automatically show results panel when first results arrive
      if (!showResultsPanel && activeSearch.results.length > 0) {
        setShowResultsPanel(true);
      }
    }
  }, [activeSearch?.results, activeSearch?.status, showResultsPanel]);

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
  }, [activeSearch?.status, clearSearch]);

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

  // Watch background search for completion
  useEffect(() => {
    if (activeSearch?.status === "completed" && activeSearch.results.length > 0) {
      setApiResults(activeSearch.results);
      setApiTotal(activeSearch.results.length);
      setShowResultsPanel(true);
      
      if (activeSearch.stats) {
        setSearchStats(activeSearch.stats);
      }
      
      addToCache(filters, activeSearch.results, activeSearch.results.length, pageSize);
      
      const timeInfo = activeSearch.stats?.processingTimeMs 
        ? ` em ${(activeSearch.stats.processingTimeMs / 1000).toFixed(1)}s`
        : "";
      
      toast({
        title: "Busca concluída",
        description: `${activeSearch.results.length} empresa(s) encontrada(s)${timeInfo}.`,
      });
      
      clearSearch();
    }
  }, [activeSearch?.status, activeSearch?.results, activeSearch?.stats, addToCache, filters, pageSize, clearSearch]);

  // Handlers - removed handleMinimizeToBackground as search always runs in background

  const handleSearch = useCallback(async () => {
    saveRecentProspeccaoFilters(filters);
    setHasSearched(true);
    setApiResults([]);
    setApiTotal(0);
    setSearchStats(null);
    
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

      // Start background search - persists across navigation
      try {
        await startBackgroundSearch(filters, pageSize);
      } catch (error) {
        // Error handled by context
      }
    } else {
      refetch();
    }
  }, [filters, searchMode, findCached, pageSize, refetch, startBackgroundSearch]);

  const handleViewStreamingResults = useCallback(() => {
    if (activeSearch) {
      setApiResults(activeSearch.results);
      setApiTotal(activeSearch.results.length);
      setShowResultsPanel(true);
    }
  }, [activeSearch]);

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
    cancelBackgroundSearch();
    companySearch.cancel();
    toast({
      title: "Busca cancelada",
      description: "A busca foi interrompida.",
    });
  }, [cancelBackgroundSearch, companySearch]);

  const handleClearFilters = useCallback(() => {
    setFilters({});
    setHasSearched(false);
    setShowResultsPanel(false);
    setSelectedIds([]);
    setApiResults([]);
    setApiTotal(0);
  }, []);

  const handleClearStats = useCallback(() => {
    setSearchStats(null);
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

  // Open confirmation dialog before sending to leads
  const handleOpenSendToLeadsConfirm = useCallback(() => {
    if (selectedIds.length === 0) {
      toast({
        title: "Nenhum prospect selecionado",
        description: "Selecione ao menos um prospect para enviar.",
        variant: "destructive",
      });
      return;
    }
    setSendToLeadsConfirmOpen(true);
  }, [selectedIds.length]);

  // Get selected prospects for confirmation dialog
  const getSelectedProspectsForLeads = useCallback(() => {
    if (searchMode === "internet") {
      return apiResults.filter(c => selectedIds.includes(c.id || c.cnpj)).map(c => ({
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
        tags: ["api-search"],
        source: "casadosdados",
      })) as any[];
    } else {
      return prospects.filter(p => selectedIds.includes(p.id));
    }
  }, [searchMode, apiResults, prospects, selectedIds]);

  const handleSendToLeadsBase = useCallback(async () => {
    const selectedProspects = getSelectedProspectsForLeads();
    
    if (selectedProspects.length === 0) return;
    
    try {
      await sendToLeadsBase.mutateAsync(selectedProspects);
      setSelectedIds([]);
      setSendToLeadsConfirmOpen(false);
    } catch (error) {
      console.error("Error sending to leads:", error);
    }
  }, [getSelectedProspectsForLeads, sendToLeadsBase]);

  const handleAddToMyBase = useCallback(async () => {
    const selectedCompanies = apiResults.filter(c => selectedIds.includes(c.id || c.cnpj));
    
    if (selectedCompanies.length === 0) {
      toast({
        title: "Nenhuma empresa selecionada",
        description: "Selecione ao menos uma empresa para adicionar.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await addProspectsFromInternet.mutateAsync(selectedCompanies);
      setSelectedIds([]);
    } catch (error) {
      console.error("Error adding to base:", error);
    }
  }, [apiResults, selectedIds, addProspectsFromInternet]);

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
    sendToLeadsConfirmOpen,
    setSendToLeadsConfirmOpen,
    batchDialogOpen,
    setBatchDialogOpen,
    hasSearched,
    showResultsPanel,
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
    
    // Search state - expose background search for banner
    activeSearch,
    isBackgroundSearching,
    companySearch,
    
    // Cache
    getRecentSearches,
    clearCache,
    
    // Mutations
    sendToLeadsBase,
    addProspectFromCNPJ,
    
    // Handlers
    handleSearch,
    handleViewStreamingResults,
    handleApplyCachedSearch,
    handleApplyTemplate,
    handleCancelSearch,
    handleClearFilters,
    handleClearStats,
    handleBackFromResults,
    handleLoadSavedSearch,
    handleDeleteSavedSearch,
    handleExport,
    handleOpenSendToLeadsConfirm,
    handleSendToLeadsBase,
    getSelectedProspectsForLeads,
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
