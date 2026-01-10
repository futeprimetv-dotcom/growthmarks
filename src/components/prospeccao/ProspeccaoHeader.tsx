import { Search, BookmarkCheck, Globe, Database, FileText, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RecentFiltersSelect } from "./RecentFiltersSelect";
import { SearchLimitSelector } from "./SearchLimitSelector";
import { SearchTemplates } from "./SearchTemplates";
import { SearchHistory } from "./SearchHistory";
import { ICPSettingsDialog } from "./ICPSettingsDialog";
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
  onDeleteSavedSearch?: (searchId: string) => void;
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
  onDeleteSavedSearch,
  onApplyTemplate,
  onApplyCachedSearch,
  onApplyRecentFilters,
  getRecentSearches,
  clearCache,
}: ProspeccaoHeaderProps) {
  return (
    <div className="p-6 border-b shrink-0">
      <div className="flex items-start justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Search className="h-6 w-6" />
          Prospecção
        </h1>
        
        {/* Actions - simplified and organized */}
        <div className="flex items-center gap-2">
          {searchMode === "internet" && (
            <>
              <ICPSettingsDialog />
              <div className="w-px h-6 bg-border" />
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
              <div className="w-px h-6 bg-border" />
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <BookmarkCheck className="h-4 w-4" />
                  Salvas
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {savedSearches.map((search) => (
                  <DropdownMenuItem 
                    key={search.id} 
                    className="flex items-center justify-between group cursor-pointer"
                    onClick={() => onLoadSavedSearch(search.id)}
                  >
                    <span className="truncate">
                      {search.name} ({search.results_count})
                    </span>
                    {onDeleteSavedSearch && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSavedSearch(search.id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <Tabs value={searchMode} onValueChange={(v) => onSearchModeChange(v as SearchMode)}>
        <TabsList className="inline-flex h-10 p-1 bg-muted/50 rounded-lg">
          <TabsTrigger 
            value="internet" 
            className="flex items-center gap-2 px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md"
          >
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">Buscar na</span> Internet
          </TabsTrigger>
          <TabsTrigger 
            value="cnpj" 
            className="flex items-center gap-2 px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md"
          >
            <Search className="h-4 w-4" />
            Consulta CNPJ
          </TabsTrigger>
          <TabsTrigger 
            value="pull-cnpjs" 
            className="flex items-center gap-2 px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md"
          >
            <FileText className="h-4 w-4" />
            Puxar CNPJs
          </TabsTrigger>
          <TabsTrigger 
            value="database" 
            className="flex items-center gap-2 px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md"
          >
            <Database className="h-4 w-4" />
            Minha Base
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}
