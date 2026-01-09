import { useState, useEffect } from "react";
import { Settings2, Plus, X, RotateCcw, Save, Target, MapPin, Building2, DollarSign, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useICPSettings, useUpdateICPSettings, useResetICPSettings, DEFAULT_ICP } from "@/hooks/useICPSettings";
import type { ICPConfig } from "@/hooks/useAIProspecting";

const BRAZILIAN_STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", 
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", 
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

const COMPANY_SIZES = [
  { value: "MEI", label: "MEI - Microempreendedor Individual" },
  { value: "ME", label: "ME - Microempresa" },
  { value: "EPP", label: "EPP - Empresa de Pequeno Porte" },
  { value: "Médio", label: "Médio Porte" },
  { value: "Grande", label: "Grande Porte" },
];

const TONE_OPTIONS = [
  { value: "formal", label: "Formal e Profissional" },
  { value: "casual", label: "Descontraído e Amigável" },
  { value: "technical", label: "Técnico e Detalhado" },
  { value: "consultative", label: "Consultivo e Educativo" },
];

export function ICPSettingsDialog() {
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState<ICPConfig>(DEFAULT_ICP);
  const [newSegment, setNewSegment] = useState("");
  
  const { data: savedConfig, isLoading } = useICPSettings();
  const updateICP = useUpdateICPSettings();
  const resetICP = useResetICPSettings();

  useEffect(() => {
    if (savedConfig) {
      setConfig(savedConfig);
    }
  }, [savedConfig]);

  const handleAddSegment = () => {
    if (newSegment.trim() && !config.targetSegments.includes(newSegment.trim())) {
      setConfig(prev => ({
        ...prev,
        targetSegments: [...prev.targetSegments, newSegment.trim()]
      }));
      setNewSegment("");
    }
  };

  const handleRemoveSegment = (segment: string) => {
    setConfig(prev => ({
      ...prev,
      targetSegments: prev.targetSegments.filter(s => s !== segment)
    }));
  };

  const handleToggleState = (state: string) => {
    setConfig(prev => ({
      ...prev,
      targetStates: prev.targetStates.includes(state)
        ? prev.targetStates.filter(s => s !== state)
        : [...prev.targetStates, state]
    }));
  };

  const handleToggleSize = (size: string) => {
    setConfig(prev => ({
      ...prev,
      preferredSizes: prev.preferredSizes.includes(size)
        ? prev.preferredSizes.filter(s => s !== size)
        : [...prev.preferredSizes, size]
    }));
  };

  const handleSave = () => {
    updateICP.mutate(config, {
      onSuccess: () => setOpen(false)
    });
  };

  const handleReset = () => {
    resetICP.mutate(undefined, {
      onSuccess: () => {
        setConfig(DEFAULT_ICP);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings2 className="h-4 w-4" />
          Configurar ICP
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Perfil de Cliente Ideal (ICP)
          </DialogTitle>
          <DialogDescription>
            Configure os critérios que a IA usará para analisar e classificar prospects.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4 py-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Segmentos */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-base font-medium">
                <Target className="h-4 w-4" />
                Segmentos Prioritários
              </Label>
              <p className="text-sm text-muted-foreground">
                Defina os setores/nichos de mercado mais interessantes para sua empresa.
              </p>
              <div className="flex flex-wrap gap-2">
                {config.targetSegments.map((segment) => (
                  <Badge 
                    key={segment} 
                    variant="secondary" 
                    className="gap-1 pr-1"
                  >
                    {segment}
                    <button
                      onClick={() => handleRemoveSegment(segment)}
                      className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Ex: Educação, Saúde, Restaurantes..."
                  value={newSegment}
                  onChange={(e) => setNewSegment(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddSegment()}
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="icon"
                  onClick={handleAddSegment}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Separator />

            {/* Estados */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-base font-medium">
                <MapPin className="h-4 w-4" />
                Estados Alvo
              </Label>
              <p className="text-sm text-muted-foreground">
                Selecione os estados onde você deseja encontrar clientes.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {BRAZILIAN_STATES.map((state) => (
                  <Badge
                    key={state}
                    variant={config.targetStates.includes(state) ? "default" : "outline"}
                    className="cursor-pointer transition-colors"
                    onClick={() => handleToggleState(state)}
                  >
                    {state}
                  </Badge>
                ))}
              </div>
            </div>

            <Separator />

            {/* Porte */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-base font-medium">
                <Building2 className="h-4 w-4" />
                Porte Preferido
              </Label>
              <p className="text-sm text-muted-foreground">
                Defina os tamanhos de empresa mais adequados.
              </p>
              <div className="flex flex-wrap gap-2">
                {COMPANY_SIZES.map((size) => (
                  <Badge
                    key={size.value}
                    variant={config.preferredSizes.includes(size.value) ? "default" : "outline"}
                    className="cursor-pointer transition-colors"
                    onClick={() => handleToggleSize(size.value)}
                  >
                    {size.label}
                  </Badge>
                ))}
              </div>
            </div>

            <Separator />

            {/* Ticket Mínimo */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-base font-medium">
                <DollarSign className="h-4 w-4" />
                Ticket Mínimo
              </Label>
              <p className="text-sm text-muted-foreground">
                Valor mínimo mensal de contrato desejado.
              </p>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">R$</span>
                <Input
                  type="number"
                  min={0}
                  step={100}
                  value={config.minTicket}
                  onChange={(e) => setConfig(prev => ({ 
                    ...prev, 
                    minTicket: parseInt(e.target.value) || 0 
                  }))}
                  className="max-w-[150px]"
                />
                <span className="text-muted-foreground">/mês</span>
              </div>
            </div>

            <Separator />

            {/* Tom de Comunicação */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-base font-medium">
                <MessageSquare className="h-4 w-4" />
                Tom de Comunicação
              </Label>
              <p className="text-sm text-muted-foreground">
                Como a IA deve formular as sugestões de abordagem.
              </p>
              <Select
                value={config.toneOfVoice}
                onValueChange={(value) => setConfig(prev => ({ 
                  ...prev, 
                  toneOfVoice: value as ICPConfig["toneOfVoice"]
                }))}
              >
                <SelectTrigger className="max-w-[300px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TONE_OPTIONS.map((tone) => (
                    <SelectItem key={tone.value} value={tone.value}>
                      {tone.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={handleReset}
            disabled={resetICP.isPending}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Restaurar Padrão
          </Button>
          <div className="flex-1" />
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={updateICP.isPending}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            Salvar Configurações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
