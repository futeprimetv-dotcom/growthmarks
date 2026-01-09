import { useEffect, useMemo, useState } from "react";
import { History, Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { ProspectFilters } from "@/hooks/useProspects";

const STORAGE_KEY = "prospeccao_recent_filters_v1";

type RecentFilterEntry = {
  id: string;
  label: string;
  filters: ProspectFilters;
  createdAt: string;
};

function safeJsonParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function loadRecentProspeccaoFilters(): RecentFilterEntry[] {
  const parsed = safeJsonParse<RecentFilterEntry[]>(localStorage.getItem(STORAGE_KEY));
  return Array.isArray(parsed) ? parsed : [];
}

export function saveRecentProspeccaoFilters(filters: ProspectFilters) {
  const recent = loadRecentProspeccaoFilters();

  const labelParts: string[] = [];
  if (filters.states?.length) labelParts.push(`UF: ${filters.states.join(",")}`);
  if (filters.cities?.length) labelParts.push(`Cidade: ${filters.cities.join(",")}`);
  if (filters.segments?.length) labelParts.push(`Nicho: ${filters.segments[0]}`);
  if (filters.companySizes?.length) labelParts.push(`Porte: ${filters.companySizes[0]}`);
  if (filters.hasWebsite) labelParts.push("com site");
  if (filters.hasPhone) labelParts.push("com telefone");
  if (filters.hasEmail) labelParts.push("com email");
  if (filters.search) labelParts.push(`"${filters.search}"`);

  const label = labelParts.length ? labelParts.join(" • ") : "Filtros";

  // avoid storing empty filter sets
  if (!Object.keys(filters).length) return;

  const entry: RecentFilterEntry = {
    id: crypto.randomUUID(),
    label,
    filters,
    createdAt: new Date().toISOString(),
  };

  // de-dupe by same label+filters (stringified)
  const fingerprint = JSON.stringify(filters);
  const next = [entry, ...recent.filter(r => JSON.stringify(r.filters) !== fingerprint)].slice(0, 10);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function RecentFiltersSelect({
  onApply,
}: {
  onApply: (filters: ProspectFilters) => void;
}) {
  const [items, setItems] = useState<RecentFilterEntry[]>([]);

  useEffect(() => {
    setItems(loadRecentProspeccaoFilters());
  }, []);

  const hasItems = items.length > 0;

  const placeholder = useMemo(() => {
    if (!hasItems) return "Sem recentes";
    return "Recentes";
  }, [hasItems]);

  return (
    <div className="flex items-center gap-2">
      <Select
        disabled={!hasItems}
        onValueChange={(value) => {
          const found = items.find(i => i.id === value);
          if (!found) return;
          onApply(found.filters);
        }}
      >
        <SelectTrigger className="w-[220px]">
          <History className="h-4 w-4 mr-2" />
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {items.map((item) => (
            <SelectItem key={item.id} value={item.id}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        type="button"
        variant="outline"
        size="icon"
        className="shrink-0"
        disabled={!hasItems}
        onClick={() => {
          localStorage.removeItem(STORAGE_KEY);
          setItems([]);
        }}
        aria-label="Limpar buscas recentes"
        title="Limpar recentes"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
