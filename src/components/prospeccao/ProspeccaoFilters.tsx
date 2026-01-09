import { useState } from "react";
import { Search, X, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Toggle } from "@/components/ui/toggle";
import { CityCombobox } from "./CityCombobox";
import { segments, companySizes, brazilianStates } from "@/data/mockProspects";
import type { ProspectFilters } from "@/hooks/useProspects";

interface Props {
  filters: ProspectFilters;
  onFiltersChange: (filters: ProspectFilters) => void;
  onSearch: () => void;
  onClear: () => void;
  onSaveSearch: () => void;
  isLoading: boolean;
}

export function ProspeccaoFilters({ 
  filters, 
  onFiltersChange, 
  onSearch, 
  onClear, 
  onSaveSearch,
  isLoading 
}: Props) {
  const updateFilter = <K extends keyof ProspectFilters>(key: K, value: ProspectFilters[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const handleStateChange = (value: string) => {
    if (value === "_all") {
      // Clear both state and city when "all" is selected
      onFiltersChange({ ...filters, states: undefined, cities: undefined });
    } else {
      // Clear city when state changes
      onFiltersChange({ ...filters, states: [value], cities: undefined });
    }
  };

  const handleCityChange = (city: string | undefined) => {
    updateFilter("cities", city ? [city] : undefined);
  };

  const activeFiltersCount = [
    filters.search,
    filters.segments?.length,
    filters.states?.length,
    filters.cities?.length,
    filters.companySizes?.length,
    filters.hasWebsite,
    filters.hasPhone,
    filters.hasEmail
  ].filter(Boolean).length;

  return (
    <div className="space-y-3">
      {/* First Row: Search + Dropdowns */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[250px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou CNPJ..."
            className="pl-9"
            value={filters.search || ""}
            onChange={(e) => updateFilter("search", e.target.value || undefined)}
            onKeyDown={(e) => e.key === "Enter" && onSearch()}
          />
        </div>

        <Select
          value={filters.segments?.[0] || "_all"}
          onValueChange={(value) => updateFilter("segments", value === "_all" ? undefined : [value])}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Segmento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">Todos os segmentos</SelectItem>
            {segments.slice(0, 20).map((segment) => (
              <SelectItem key={segment} value={segment}>
                {segment}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.states?.[0] || "_all"}
          onValueChange={handleStateChange}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="UF" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">Todos os estados</SelectItem>
            {brazilianStates.map((state) => (
              <SelectItem key={state.value} value={state.value}>
                {state.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <CityCombobox
          selectedState={filters.states?.[0]}
          selectedCity={filters.cities?.[0]}
          onCityChange={handleCityChange}
          placeholder="Cidade"
        />

        <Select
          value={filters.companySizes?.[0] || "_all"}
          onValueChange={(value) => updateFilter("companySizes", value === "_all" ? undefined : [value])}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Porte" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">Todos os portes</SelectItem>
            {companySizes.map((size) => (
              <SelectItem key={size.value} value={size.value}>
                {size.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Second Row: Toggles + Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Toggle
            pressed={filters.hasWebsite || false}
            onPressedChange={(pressed) => updateFilter("hasWebsite", pressed || undefined)}
            variant="outline"
            size="sm"
          >
            Possui site
          </Toggle>
          <Toggle
            pressed={filters.hasPhone || false}
            onPressedChange={(pressed) => updateFilter("hasPhone", pressed || undefined)}
            variant="outline"
            size="sm"
          >
            Possui telefone
          </Toggle>
          <Toggle
            pressed={filters.hasEmail || false}
            onPressedChange={(pressed) => updateFilter("hasEmail", pressed || undefined)}
            variant="outline"
            size="sm"
          >
            Possui email
          </Toggle>
          
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activeFiltersCount} filtro(s)
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            disabled={activeFiltersCount === 0}
          >
            <X className="h-4 w-4 mr-1" />
            Limpar
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onSaveSearch}
          >
            <Save className="h-4 w-4 mr-1" />
            Salvar pesquisa
          </Button>

          <Button
            onClick={onSearch}
            disabled={isLoading}
          >
            <Search className="h-4 w-4 mr-2" />
            Buscar
          </Button>
        </div>
      </div>
    </div>
  );
}
