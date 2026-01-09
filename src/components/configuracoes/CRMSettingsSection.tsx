import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Target, Plus, X, Save, RotateCcw } from "lucide-react";
import { useCRMSettings, useUpdateCRMSettings } from "@/hooks/useCRMSettings";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

const DEFAULT_ORIGINS = [
  'instagram', 'whatsapp', 'site', 'indicacao', 'trafego_pago', 'prospeccao', 'outro'
];

const DEFAULT_SERVICES = [
  'Gestão de Tráfego', 'Social Media', 'Site/Landing Page', 'Branding', 'CRM/Automação'
];

const DEFAULT_STATUSES = [
  { value: 'novo', label: 'Novo' },
  { value: 'lead_frio', label: 'Lead Frio' },
  { value: 'em_contato', label: 'Em Contato' },
  { value: 'em_qualificacao', label: 'Em Qualificação' },
  { value: 'reuniao_agendada', label: 'Reunião Agendada' },
  { value: 'proposta_enviada', label: 'Proposta Enviada' },
  { value: 'negociacao', label: 'Negociação' },
  { value: 'fechamento', label: 'Fechamento' },
  { value: 'perdido', label: 'Perdido' },
];

const DEFAULT_SCORE_WEIGHTS = {
  temperature: 30,
  estimated_value: 25,
  urgency: 20,
  closing_probability: 15,
  invests_in_marketing: 10,
};

export function CRMSettingsSection() {
  const { data: settings, isLoading } = useCRMSettings();
  const updateSettings = useUpdateCRMSettings();

  const [origins, setOrigins] = useState<string[]>(DEFAULT_ORIGINS);
  const [services, setServices] = useState<string[]>(DEFAULT_SERVICES);
  const [scoreWeights, setScoreWeights] = useState(DEFAULT_SCORE_WEIGHTS);
  const [newOrigin, setNewOrigin] = useState('');
  const [newService, setNewService] = useState('');

  useEffect(() => {
    if (settings) {
      if (settings.lead_origins) setOrigins(settings.lead_origins);
      if (settings.service_interests) setServices(settings.service_interests);
      if (settings.lead_score_weights) setScoreWeights(settings.lead_score_weights);
    }
  }, [settings]);

  const handleAddOrigin = () => {
    if (newOrigin.trim() && !origins.includes(newOrigin.trim().toLowerCase())) {
      const updated = [...origins, newOrigin.trim().toLowerCase()];
      setOrigins(updated);
      updateSettings.mutate({ lead_origins: updated });
      setNewOrigin('');
    }
  };

  const handleRemoveOrigin = (origin: string) => {
    const updated = origins.filter(o => o !== origin);
    setOrigins(updated);
    updateSettings.mutate({ lead_origins: updated });
  };

  const handleAddService = () => {
    if (newService.trim() && !services.includes(newService.trim())) {
      const updated = [...services, newService.trim()];
      setServices(updated);
      updateSettings.mutate({ service_interests: updated });
      setNewService('');
    }
  };

  const handleRemoveService = (service: string) => {
    const updated = services.filter(s => s !== service);
    setServices(updated);
    updateSettings.mutate({ service_interests: updated });
  };

  const handleWeightChange = (key: keyof typeof scoreWeights, value: number[]) => {
    const newWeights = { ...scoreWeights, [key]: value[0] };
    setScoreWeights(newWeights);
  };

  const handleSaveWeights = () => {
    const total = Object.values(scoreWeights).reduce((a, b) => a + b, 0);
    if (total !== 100) {
      toast.error(`Os pesos devem somar 100%. Atualmente: ${total}%`);
      return;
    }
    updateSettings.mutate({ lead_score_weights: scoreWeights });
    toast.success("Pesos do Lead Score salvos!");
  };

  const handleResetWeights = () => {
    setScoreWeights(DEFAULT_SCORE_WEIGHTS);
    updateSettings.mutate({ lead_score_weights: DEFAULT_SCORE_WEIGHTS });
    toast.success("Pesos resetados para padrão");
  };

  const totalWeight = Object.values(scoreWeights).reduce((a, b) => a + b, 0);

  if (isLoading) {
    return (
      <Card className="p-6">
        <Skeleton className="h-6 w-48 mb-6" />
        <div className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Target className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Configurações do CRM</h2>
      </div>

      <div className="space-y-8">
        {/* Lead Origins */}
        <div>
          <Label className="text-base font-medium">Origens de Lead</Label>
          <p className="text-sm text-muted-foreground mb-3">
            Configure as origens disponíveis para classificar leads
          </p>
          <div className="flex flex-wrap gap-2 mb-3">
            {origins.map((origin) => (
              <Badge key={origin} variant="secondary" className="gap-1 px-3 py-1">
                {origin}
                <button
                  onClick={() => handleRemoveOrigin(origin)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newOrigin}
              onChange={(e) => setNewOrigin(e.target.value)}
              placeholder="Nova origem..."
              className="max-w-xs"
              onKeyDown={(e) => e.key === 'Enter' && handleAddOrigin()}
            />
            <Button size="sm" onClick={handleAddOrigin}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Service Interests */}
        <div>
          <Label className="text-base font-medium">Serviços de Interesse</Label>
          <p className="text-sm text-muted-foreground mb-3">
            Serviços que podem ser oferecidos aos leads
          </p>
          <div className="flex flex-wrap gap-2 mb-3">
            {services.map((service) => (
              <Badge key={service} variant="secondary" className="gap-1 px-3 py-1">
                {service}
                <button
                  onClick={() => handleRemoveService(service)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newService}
              onChange={(e) => setNewService(e.target.value)}
              placeholder="Novo serviço..."
              className="max-w-xs"
              onKeyDown={(e) => e.key === 'Enter' && handleAddService()}
            />
            <Button size="sm" onClick={handleAddService}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Pipeline Statuses - Read Only */}
        <div>
          <Label className="text-base font-medium">Status do Pipeline</Label>
          <p className="text-sm text-muted-foreground mb-3">
            Etapas do funil de vendas (pré-configuradas)
          </p>
          <div className="flex flex-wrap gap-2">
            {DEFAULT_STATUSES.map((status) => (
              <Badge key={status.value} variant="outline" className="px-3 py-1">
                {status.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Lead Score Weights */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <Label className="text-base font-medium">Pesos do Lead Score</Label>
              <p className="text-sm text-muted-foreground">
                Configure a importância de cada fator no cálculo do score (total deve ser 100%)
              </p>
            </div>
            <Badge variant={totalWeight === 100 ? "default" : "destructive"}>
              Total: {totalWeight}%
            </Badge>
          </div>

          <div className="space-y-4 bg-muted/30 rounded-lg p-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Temperatura do Lead</span>
                <span className="font-medium">{scoreWeights.temperature}%</span>
              </div>
              <Slider
                value={[scoreWeights.temperature]}
                onValueChange={(v) => handleWeightChange('temperature', v)}
                max={100}
                step={5}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Valor Estimado</span>
                <span className="font-medium">{scoreWeights.estimated_value}%</span>
              </div>
              <Slider
                value={[scoreWeights.estimated_value]}
                onValueChange={(v) => handleWeightChange('estimated_value', v)}
                max={100}
                step={5}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Urgência</span>
                <span className="font-medium">{scoreWeights.urgency}%</span>
              </div>
              <Slider
                value={[scoreWeights.urgency]}
                onValueChange={(v) => handleWeightChange('urgency', v)}
                max={100}
                step={5}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Probabilidade de Fechamento</span>
                <span className="font-medium">{scoreWeights.closing_probability}%</span>
              </div>
              <Slider
                value={[scoreWeights.closing_probability]}
                onValueChange={(v) => handleWeightChange('closing_probability', v)}
                max={100}
                step={5}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Investe em Marketing</span>
                <span className="font-medium">{scoreWeights.invests_in_marketing}%</span>
              </div>
              <Slider
                value={[scoreWeights.invests_in_marketing]}
                onValueChange={(v) => handleWeightChange('invests_in_marketing', v)}
                max={100}
                step={5}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={handleSaveWeights} disabled={totalWeight !== 100}>
                <Save className="h-4 w-4 mr-2" />
                Salvar Pesos
              </Button>
              <Button variant="outline" onClick={handleResetWeights}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Resetar
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
