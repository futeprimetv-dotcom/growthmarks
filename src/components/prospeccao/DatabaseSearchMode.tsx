import { Database } from "lucide-react";
import { ProspeccaoFilters } from "./ProspeccaoFilters";
import type { ProspectFilters } from "@/hooks/useProspects";

interface DatabaseSearchModeProps {
  filters: ProspectFilters;
  onFiltersChange: (filters: ProspectFilters) => void;
  onSearch: () => void;
  onClear: () => void;
  onSaveSearch: () => void;
  isLoading: boolean;
}

export function DatabaseSearchMode({
  filters,
  onFiltersChange,
  onSearch,
  onClear,
  onSaveSearch,
  isLoading,
}: DatabaseSearchModeProps) {
  return (
    <>
      <div className="mb-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <Database className="h-4 w-4" />
          Busca apenas nos prospectos que você já salvou na sua base local
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
