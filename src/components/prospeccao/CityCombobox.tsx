import { useState, useMemo } from "react";
import { Check, ChevronsUpDown, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
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
}

export function CityCombobox({ 
  selectedState, 
  selectedCity, 
  onCityChange,
  placeholder = "Buscar cidade..." 
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

  // Filter cities based on search
  const filteredCities = useMemo(() => {
    if (!searchValue) return availableCities.slice(0, 50); // Limit initial display
    
    const search = searchValue.toLowerCase();
    return availableCities
      .filter(item => item.city.toLowerCase().startsWith(search) || item.city.toLowerCase().includes(search))
      .slice(0, 50);
  }, [availableCities, searchValue]);

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
            <CommandGroup>
              {selectedCity && (
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
              )}
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
