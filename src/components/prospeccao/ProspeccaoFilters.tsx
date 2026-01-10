import { Search, X, Save, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
} from "@/components/ui/select";
import { Toggle } from "@/components/ui/toggle";
import { CityCombobox } from "./CityCombobox";
import { segments, companySizes, brazilianStates } from "@/data/mockProspects";
import { useRecentLocations } from "@/hooks/useRecentLocations";
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
  const { recentStates, recentCities, addRecentState, addRecentCity } = useRecentLocations();

  const updateFilter = <K extends keyof ProspectFilters>(key: K, value: ProspectFilters[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const handleStateChange = (value: string) => {
    if (value === "_all") {
      onFiltersChange({ ...filters, states: undefined, cities: undefined });
    } else {
      addRecentState(value);
      onFiltersChange({ ...filters, states: [value], cities: undefined });
    }
  };

  const handleCityChange = (city: string | undefined) => {
    if (city) {
      addRecentCity(city);
    }
    updateFilter("cities", city ? [city] : undefined);
  };

  // Count active filters
  const activeFiltersCount = [
    filters.search ? 1 : 0,
    filters.segments?.length ? 1 : 0,
    filters.states?.length ? 1 : 0,
    filters.cities?.length ? 1 : 0,
    filters.companySizes?.length ? 1 : 0,
    filters.hasWebsite === true ? 1 : 0,
    filters.hasPhone === true ? 1 : 0,
    filters.hasEmail === true ? 1 : 0
  ].reduce((sum, val) => sum + val, 0);

  // Filter out recent states from the alphabetical list to avoid duplicates
  const alphabeticalStates = brazilianStates.filter(
    state => !recentStates.includes(state.value)
  );

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
            
            {recentStates.length > 0 && (
              <>
                <SelectGroup>
                  <SelectLabel className="flex items-center gap-1.5 text-xs">
                    <Clock className="h-3 w-3" />
                    Recentes
                  </SelectLabel>
                  {recentStates.map((stateValue) => {
                    const stateData = brazilianStates.find(s => s.value === stateValue);
                    return stateData ? (
                      <SelectItem key={`recent-${stateValue}`} value={stateValue}>
                        {stateData.label}
                      </SelectItem>
                    ) : null;
                  })}
                </SelectGroup>
                <SelectSeparator />
              </>
            )}
            
            <SelectGroup>
              <SelectLabel className="text-xs">Todos</SelectLabel>
              {alphabeticalStates.map((state) => (
                <SelectItem key={state.value} value={state.value}>
                  {state.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        <CityCombobox
          selectedState={filters.states?.[0]}
          selectedCity={filters.cities?.[0]}
          onCityChange={handleCityChange}
          placeholder="Cidade"
          recentCities={recentCities}
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
