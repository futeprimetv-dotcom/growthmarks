import { Settings2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

interface Props {
  value: number;
  onChange: (value: number) => void;
}

const limits = [
  { value: 10, label: "10 empresas", description: "Rápido (~30s)" },
  { value: 25, label: "25 empresas", description: "Moderado (~1min)" },
  { value: 50, label: "50 empresas", description: "Lento (~2min)" },
  { value: 100, label: "100 empresas", description: "Muito lento (~5min)" },
];

export function SearchLimitSelector({ value, onChange }: Props) {
  const selectedLimit = limits.find(l => l.value === value) || limits[0];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings2 className="h-4 w-4" />
          <span className="hidden sm:inline">{selectedLimit.label}</span>
          <span className="sm:hidden">{selectedLimit.value}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64" align="end">
        <div className="space-y-3">
          <div>
            <h4 className="font-medium text-sm">Limite de resultados</h4>
            <p className="text-xs text-muted-foreground">
              Quanto menor, mais rápida a busca
            </p>
          </div>
          
          <RadioGroup
            value={String(value)}
            onValueChange={(v) => onChange(Number(v))}
            className="gap-2"
          >
            {limits.map((limit) => (
              <div
                key={limit.value}
                className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer"
              >
                <RadioGroupItem value={String(limit.value)} id={`limit-${limit.value}`} />
                <Label
                  htmlFor={`limit-${limit.value}`}
                  className="flex-1 cursor-pointer flex justify-between items-center"
                >
                  <span className="font-medium">{limit.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {limit.description}
                  </span>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      </PopoverContent>
    </Popover>
  );
}
