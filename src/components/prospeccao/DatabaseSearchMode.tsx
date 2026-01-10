import { Database } from "lucide-react";
import { DatabaseFilters } from "./DatabaseFilters";
import type { ProspectFilters } from "@/hooks/useProspects";

interface DatabaseSearchModeProps {
  filters: ProspectFilters;
  onFiltersChange: (filters: ProspectFilters) => void;
  onClear: () => void;
  onSaveSearch: () => void;
}

export function DatabaseSearchMode({
  filters,
  onFiltersChange,
  onClear,
  onSaveSearch,
}: DatabaseSearchModeProps) {
  return (
    <>
      <div className="mb-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <Database className="h-4 w-4" />
          Busca apenas nos prospectos que você já salvou na sua base local
        </span>
      </div>

      <DatabaseFilters
        filters={filters}
        onFiltersChange={onFiltersChange}
        onClear={onClear}
        onSaveSearch={onSaveSearch}
      />
    </>
  );
}
