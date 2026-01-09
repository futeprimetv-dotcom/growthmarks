import { useState } from "react";
import { Search, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { maskCNPJ, cleanCNPJ, validateCNPJ } from "@/lib/cnpjUtils";

interface Props {
  onSearch: (cnpj: string) => void;
  onClear: () => void;
  isLoading: boolean;
  hasResult: boolean;
}

export function CNPJSearchInput({ onSearch, onClear, isLoading, hasResult }: Props) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = maskCNPJ(e.target.value);
    setValue(masked);
    setError(null);
  };
  
  const handleSearch = () => {
    const cleaned = cleanCNPJ(value);
    
    if (cleaned.length !== 14) {
      setError("Digite os 14 dígitos do CNPJ");
      return;
    }
    
    if (!validateCNPJ(cleaned)) {
      setError("CNPJ inválido");
      return;
    }
    
    setError(null);
    onSearch(cleaned);
  };
  
  const handleClear = () => {
    setValue("");
    setError(null);
    onClear();
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <div className="relative">
          <Input
            placeholder="00.000.000/0000-00"
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            className={`w-[200px] font-mono ${error ? "border-destructive" : ""}`}
            maxLength={18}
          />
          {hasResult && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
              onClick={handleClear}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
        <Button 
          onClick={handleSearch} 
          disabled={isLoading || cleanCNPJ(value).length !== 14}
          size="default"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Search className="h-4 w-4 mr-2" />
          )}
          Consultar CNPJ
        </Button>
      </div>
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}
