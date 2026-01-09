import { History, Clock, Building2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { CachedSearch } from "@/hooks/useSearchCache";
import type { ProspectFilters } from "@/hooks/useProspects";
import type { CompanySearchResult } from "@/hooks/useCompanySearch";

interface Props {
  recentSearches: CachedSearch[];
  onApply: (filters: ProspectFilters, results: CompanySearchResult[], total: number) => void;
  onClearHistory: () => void;
}

function getFiltersSummary(filters: ProspectFilters): string {
  const parts: string[] = [];
  
  if (filters.segments?.length) {
    parts.push(filters.segments[0]);
  }
  if (filters.cities?.length) {
    parts.push(filters.cities[0]);
  } else if (filters.states?.length) {
    parts.push(filters.states[0]);
  }
  
  return parts.join(" • ") || "Busca sem filtros";
}

export function SearchHistory({ recentSearches, onApply, onClearHistory }: Props) {
  if (recentSearches.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <History className="h-4 w-4" />
          <span className="hidden sm:inline">Histórico</span>
          <Badge variant="secondary" className="h-5 px-1.5 text-xs">
            {recentSearches.length}
          </Badge>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            Buscas Recentes
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClearHistory();
            }}
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Limpar
          </Button>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {recentSearches.map((search) => (
          <DropdownMenuItem
            key={search.id}
            className="flex items-start gap-3 p-3 cursor-pointer"
            onClick={() => onApply(search.filters, search.results, search.total)}
          >
            <Building2 className="h-5 w-5 mt-0.5 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium truncate">
                  {getFiltersSummary(search.filters)}
                </p>
                <Badge variant="outline" className="shrink-0">
                  {search.results.length} empresas
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <Clock className="h-3 w-3" />
                {formatDistanceToNow(search.timestamp, { 
                  addSuffix: true, 
                  locale: ptBR 
                })}
              </p>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
