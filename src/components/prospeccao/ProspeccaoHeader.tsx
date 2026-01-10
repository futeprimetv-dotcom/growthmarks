import { Search, BookmarkCheck, Globe, Database, FileText } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RecentFiltersSelect } from "./RecentFiltersSelect";
import { SearchLimitSelector } from "./SearchLimitSelector";
import { SearchTemplates } from "./SearchTemplates";
import { SearchHistory } from "./SearchHistory";
import { ICPSettingsDialog } from "./ICPSettingsDialog";
import { ICPIndicator } from "./ICPIndicator";
import type { ProspectFilters } from "@/hooks/useProspects";
import type { CompanySearchResult } from "@/hooks/useCompanySearch";
import type { CachedSearch } from "@/hooks/useSearchCache";
import { toast } from "@/hooks/use-toast";

export type SearchMode = "internet" | "cnpj" | "database" | "pull-cnpjs";

interface SavedSearch {
  id: string;
  name: string;
  filters: ProspectFilters;
  results_count: number | null;
}

interface ProspeccaoHeaderProps {
  searchMode: SearchMode;
  onSearchModeChange: (mode: SearchMode) => void;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  savedSearches: SavedSearch[];
  onLoadSavedSearch: (searchId: string) => void;
  onApplyTemplate: (filters: ProspectFilters) => void;
  onApplyCachedSearch: (filters: ProspectFilters, results: CompanySearchResult[], total: number) => void;
  onApplyRecentFilters: (filters: ProspectFilters) => void;
  getRecentSearches: () => CachedSearch[];
  clearCache: () => void;
}

export function ProspeccaoHeader({
  searchMode,
  onSearchModeChange,
  pageSize,
  onPageSizeChange,
  savedSearches,
  onLoadSavedSearch,
  onApplyTemplate,
  onApplyCachedSearch,
  onApplyRecentFilters,
  getRecentSearches,
  clearCache,
}: ProspeccaoHeaderProps) {
  return (
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
        
        <div className="flex items-center gap-2 flex-wrap">
          <ICPIndicator />

          {searchMode === "internet" && (
            <>
              <SearchLimitSelector 
                value={pageSize} 
                onChange={onPageSizeChange} 
              />
              <SearchTemplates onApply={onApplyTemplate} />
              <SearchHistory 
                recentSearches={getRecentSearches()}
                onApply={onApplyCachedSearch}
                onClearHistory={clearCache}
              />
              <ICPSettingsDialog />
            </>
          )}

          <RecentFiltersSelect
            onApply={(recent) => {
              onApplyRecentFilters(recent);
              toast({
                title: "Filtros recentes aplicados",
                description: "Clique em Buscar para ver os resultados.",
              });
            }}
          />

          {savedSearches.length > 0 && (
            <Select onValueChange={onLoadSavedSearch}>
              <SelectTrigger className="w-[180px]">
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

      <Tabs value={searchMode} onValueChange={(v) => onSearchModeChange(v as SearchMode)} className="mb-4">
        <TabsList className="grid w-full grid-cols-4 max-w-2xl">
          <TabsTrigger value="internet" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">Buscar na</span> Internet
          </TabsTrigger>
          <TabsTrigger value="cnpj" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Consulta CNPJ
          </TabsTrigger>
          <TabsTrigger value="pull-cnpjs" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Puxar CNPJs
          </TabsTrigger>
          <TabsTrigger value="database" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Minha Base
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}
