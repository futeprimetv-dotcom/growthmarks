import { useState, useMemo } from "react";
import { Check, ChevronsUpDown, MapPin, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { brazilianCities, allCitiesWithState } from "@/data/brazilianCities";

interface Props {
  selectedState?: string;
  selectedCity?: string;
  onCityChange: (city: string | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  recentCities?: string[];
}

export function CityCombobox({ 
  selectedState, 
  selectedCity, 
  onCityChange,
  placeholder = "Buscar cidade...",
  disabled = false,
  recentCities = [],
}: Props) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  // Get available cities based on selected state
  const availableCities = useMemo(() => {
    if (selectedState && brazilianCities[selectedState]) {
      return brazilianCities[selectedState].map(city => ({
        city,
        state: selectedState,
        label: city
      }));
    }
    // If no state selected, show all cities with state suffix
    return allCitiesWithState;
  }, [selectedState]);

  // Get recent cities that are in the available list
  const recentAvailableCities = useMemo(() => {
    return recentCities
      .filter(city => availableCities.some(ac => ac.city === city))
      .slice(0, 5);
  }, [recentCities, availableCities]);

  // Filter cities based on search, excluding recent ones when no search
  const filteredCities = useMemo(() => {
    const search = searchValue.toLowerCase();
    
    let cities = availableCities;
    
    // If no search, exclude recent cities from main list
    if (!searchValue && recentAvailableCities.length > 0) {
      cities = availableCities.filter(
        item => !recentAvailableCities.includes(item.city)
      );
    }
    
    if (!searchValue) return cities.slice(0, 50);
    
    return cities
      .filter(item => item.city.toLowerCase().startsWith(search) || item.city.toLowerCase().includes(search))
      .slice(0, 50);
  }, [availableCities, searchValue, recentAvailableCities]);

  const displayValue = selectedCity 
    ? (selectedState ? selectedCity : `${selectedCity}`)
    : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[180px] justify-between font-normal"
          disabled={disabled}
        >
          <div className="flex items-center gap-2 truncate">
            <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="truncate">
              {displayValue || placeholder}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Digite o nome da cidade..." 
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            <CommandEmpty>Nenhuma cidade encontrada.</CommandEmpty>
            
            {selectedCity && (
              <CommandGroup>
                <CommandItem
                  value="_clear"
                  onSelect={() => {
                    onCityChange(undefined);
                    setOpen(false);
                    setSearchValue("");
                  }}
                  className="text-muted-foreground"
                >
                  Limpar seleção
                </CommandItem>
              </CommandGroup>
            )}

            {/* Recent cities */}
            {!searchValue && recentAvailableCities.length > 0 && (
              <>
                <CommandGroup heading={
                  <span className="flex items-center gap-1.5 text-xs">
                    <Clock className="h-3 w-3" />
                    Recentes
                  </span>
                }>
                  {recentAvailableCities.map((city) => (
                    <CommandItem
                      key={`recent-${city}`}
                      value={city}
                      onSelect={() => {
                        onCityChange(city);
                        setOpen(false);
                        setSearchValue("");
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedCity === city ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {city}
                    </CommandItem>
                  ))}
                </CommandGroup>
                <CommandSeparator />
              </>
            )}

            {/* All cities */}
            <CommandGroup heading={!searchValue && recentAvailableCities.length > 0 ? "Todas" : undefined}>
              {filteredCities.map((item) => (
                <CommandItem
                  key={`${item.city}-${item.state}`}
                  value={item.city}
                  onSelect={() => {
                    onCityChange(item.city);
                    setOpen(false);
                    setSearchValue("");
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedCity === item.city ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {selectedState ? item.city : item.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
