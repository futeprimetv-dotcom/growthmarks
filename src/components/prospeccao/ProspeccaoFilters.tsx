import { useState } from "react";
import { Search, X, Save, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { segments, companySizes, brazilianStates } from "@/data/mockProspects";
import type { ProspectFilters } from "@/hooks/useProspects";

interface Props {
  filters: ProspectFilters;
  onFiltersChange: (filters: ProspectFilters) => void;
  onSaveSearch: () => void;
  resultsCount: number;
}

export function ProspeccaoFilters({ filters, onFiltersChange, onSaveSearch, resultsCount }: Props) {
  const [isSegmentsOpen, setIsSegmentsOpen] = useState(true);
  const [isStatesOpen, setIsStatesOpen] = useState(true);
  const [isSizesOpen, setIsSizesOpen] = useState(false);

  const updateFilter = <K extends keyof ProspectFilters>(key: K, value: ProspectFilters[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleArrayFilter = (key: 'segments' | 'states' | 'companySizes', value: string) => {
    const current = filters[key] || [];
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    updateFilter(key, updated.length > 0 ? updated : undefined);
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const activeFiltersCount = [
    filters.search,
    filters.segments?.length,
    filters.states?.length,
    filters.companySizes?.length,
    filters.hasWebsite,
    filters.hasPhone,
    filters.hasEmail
  ].filter(Boolean).length;

  return (
    <div className="w-80 border-r bg-card flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold">Filtros</h3>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary">{activeFiltersCount}</Badge>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />
            Limpar
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="CNPJ ou nome da empresa"
            className="pl-9"
            value={filters.search || ""}
            onChange={(e) => updateFilter("search", e.target.value || undefined)}
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Segmentos */}
          <Collapsible open={isSegmentsOpen} onOpenChange={setIsSegmentsOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-2">
              <Label className="cursor-pointer">Segmento de mercado</Label>
              <Badge variant="outline">{filters.segments?.length || 0}</Badge>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                {segments.slice(0, 15).map((segment) => (
                  <div key={segment} className="flex items-center space-x-2">
                    <Checkbox
                      id={`segment-${segment}`}
                      checked={filters.segments?.includes(segment) || false}
                      onCheckedChange={() => toggleArrayFilter("segments", segment)}
                    />
                    <label
                      htmlFor={`segment-${segment}`}
                      className="text-sm cursor-pointer"
                    >
                      {segment}
                    </label>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Estados */}
          <Collapsible open={isStatesOpen} onOpenChange={setIsStatesOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-2">
              <Label className="cursor-pointer">Localização (UF)</Label>
              <Badge variant="outline">{filters.states?.length || 0}</Badge>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                {brazilianStates.map((state) => (
                  <div key={state.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`state-${state.value}`}
                      checked={filters.states?.includes(state.value) || false}
                      onCheckedChange={() => toggleArrayFilter("states", state.value)}
                    />
                    <label
                      htmlFor={`state-${state.value}`}
                      className="text-sm cursor-pointer"
                    >
                      {state.label}
                    </label>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Porte */}
          <Collapsible open={isSizesOpen} onOpenChange={setIsSizesOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-2">
              <Label className="cursor-pointer">Porte da empresa</Label>
              <Badge variant="outline">{filters.companySizes?.length || 0}</Badge>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-2 space-y-2">
                {companySizes.map((size) => (
                  <div key={size.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`size-${size.value}`}
                      checked={filters.companySizes?.includes(size.value) || false}
                      onCheckedChange={() => toggleArrayFilter("companySizes", size.value)}
                    />
                    <label
                      htmlFor={`size-${size.value}`}
                      className="text-sm cursor-pointer"
                    >
                      {size.label}
                    </label>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Toggles */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <Label htmlFor="has-website">Possui site</Label>
              <Switch
                id="has-website"
                checked={filters.hasWebsite || false}
                onCheckedChange={(checked) => updateFilter("hasWebsite", checked || undefined)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="has-phone">Possui telefone</Label>
              <Switch
                id="has-phone"
                checked={filters.hasPhone || false}
                onCheckedChange={(checked) => updateFilter("hasPhone", checked || undefined)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="has-email">Possui email</Label>
              <Switch
                id="has-email"
                checked={filters.hasEmail || false}
                onCheckedChange={(checked) => updateFilter("hasEmail", checked || undefined)}
              />
            </div>
          </div>
        </div>
      </ScrollArea>

      <div className="p-4 border-t space-y-2">
        <div className="text-sm text-muted-foreground text-center">
          {resultsCount} resultado(s) encontrado(s)
        </div>
        <Button onClick={onSaveSearch} variant="outline" className="w-full">
          <Save className="h-4 w-4 mr-2" />
          Salvar pesquisa
        </Button>
      </div>
    </div>
  );
}
