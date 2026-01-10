import { Globe } from "lucide-react";
import { ProspeccaoFilters } from "./ProspeccaoFilters";
import type { ProspectFilters } from "@/hooks/useProspects";

interface InternetSearchModeProps {
  filters: ProspectFilters;
  onFiltersChange: (filters: ProspectFilters) => void;
  onSearch: () => void;
  onClear: () => void;
  onSaveSearch: () => void;
  isLoading: boolean;
}

export function InternetSearchMode({
  filters,
  onFiltersChange,
  onSearch,
  onClear,
  onSaveSearch,
  isLoading,
}: InternetSearchModeProps) {
  return (
    <>
      <div className="mb-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <Globe className="h-4 w-4" />
          Busca empresas ativas via web scraping inteligente (Firecrawl + BrasilAPI)
        </span>
      </div>

      <ProspeccaoFilters
        filters={filters}
        onFiltersChange={onFiltersChange}
        onSearch={onSearch}
        onClear={onClear}
        onSaveSearch={onSaveSearch}
        isLoading={isLoading}
      />
    </>
  );
}
