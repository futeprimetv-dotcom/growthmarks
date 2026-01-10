import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useProspects, type ProspectFilters } from "@/hooks/useProspects";
import { useSalesFunnels } from "@/hooks/useSalesFunnels";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { 
  Search, 
  Database, 
  ArrowDownToLine, 
  Loader2, 
  Building2, 
  MapPin, 
  Phone, 
  Mail,
  Filter
} from "lucide-react";

const STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

const COMPANY_SIZES = [
  { value: "MEI", label: "MEI" },
  { value: "ME", label: "ME - Microempresa" },
  { value: "EPP", label: "EPP - Pequeno Porte" },
];

interface PullLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PullLeadDialog({ open, onOpenChange }: PullLeadDialogProps) {
  const [filters, setFilters] = useState<ProspectFilters>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedFunnel, setSelectedFunnel] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  const { data: prospects = [], isLoading } = useProspects(filters, open);
  const { data: funnels = [] } = useSalesFunnels();
  const queryClient = useQueryClient();

  // Reset when dialog closes
  useEffect(() => {
    if (!open) {
      setFilters({});
      setSelectedIds([]);
      setSelectedFunnel("");
      setShowFilters(false);
    }
  }, [open]);

  const handleSelectAll = () => {
    if (selectedIds.length === prospects.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(prospects.map(p => p.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  const handlePullLeads = async () => {
    if (selectedIds.length === 0) {
      toast({
        title: "Nenhum prospecto selecionado",
        description: "Selecione ao menos um prospecto para puxar como lead.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const selectedProspects = prospects.filter(p => selectedIds.includes(p.id));
      let successCount = 0;
      let duplicateCount = 0;

      for (const prospect of selectedProspects) {
        // Check if lead already exists with same company/name
        const { data: existingLead } = await supabase
          .from("leads")
          .select("id")
          .or(`company.eq.${prospect.name},name.eq.${prospect.name}`)
          .maybeSingle();

        if (existingLead) {
          duplicateCount++;
          continue;
        }

        const { error } = await supabase.from("leads").insert({
          name: prospect.name,
          company: prospect.name,
          email: prospect.emails?.[0] || null,
          phone: prospect.phones?.[0] || null,
          whatsapp: prospect.phones?.[0] || null,
          city: prospect.city,
          state: prospect.state,
          segment: prospect.segment,
          funnel_id: selectedFunnel || null,
          status: "novo",
          temperature: "cold",
          origin: "prospeccao_ativa",
          tags: [...(prospect.tags || []), "puxado-da-base"],
          notes: `Importado da Minha Base em ${new Date().toLocaleDateString('pt-BR')}. CNPJ: ${prospect.cnpj || 'N/A'}. Segmento: ${prospect.segment || 'N/A'}.`
        });

        if (error) {
          console.error("Error creating lead:", error);
        } else {
          successCount++;
        }
      }

      queryClient.invalidateQueries({ queryKey: ["leads"] });
      
      let message = `${successCount} lead(s) criado(s) com sucesso.`;
      if (duplicateCount > 0) {
        message += ` ${duplicateCount} já existiam na base.`;
      }
      
      toast({
        title: "Leads importados",
        description: message
      });

      onOpenChange(false);
    } catch (error) {
      console.error("Error pulling leads:", error);
      toast({
        title: "Erro",
        description: "Não foi possível importar os leads.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Puxar Leads da Minha Base
          </DialogTitle>
          <DialogDescription>
            Selecione prospectos da sua base de dados para adicionar como leads
          </DialogDescription>
        </DialogHeader>

        {/* Filters */}
        <div className="space-y-4 border-b pb-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou CNPJ..."
                value={filters.search || ""}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10"
              />
            </div>
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? "bg-accent" : ""}
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div>
                <Label className="text-xs text-muted-foreground">Estado</Label>
                <Select
                  value={filters.states?.[0] || "all"}
                  onValueChange={(value) => setFilters(prev => ({ 
                    ...prev, 
                    states: value === "all" ? undefined : [value] 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os estados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os estados</SelectItem>
                    {STATES.map(state => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Porte</Label>
                <Select
                  value={filters.companySizes?.[0] || "all"}
                  onValueChange={(value) => setFilters(prev => ({ 
                    ...prev, 
                    companySizes: value === "all" ? undefined : [value] 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os portes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os portes</SelectItem>
                    {COMPANY_SIZES.map(size => (
                      <SelectItem key={size.value} value={size.value}>{size.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Funil de Destino</Label>
                <Select value={selectedFunnel} onValueChange={setSelectedFunnel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Nenhum (sem funil)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhum (sem funil)</SelectItem>
                    {funnels.map(funnel => (
                      <SelectItem key={funnel.id} value={funnel.id}>
                        {funnel.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        {/* Results count and select all */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{prospects.length} prospecto(s) encontrado(s)</span>
            {selectedIds.length > 0 && (
              <Badge variant="secondary">{selectedIds.length} selecionado(s)</Badge>
            )}
          </div>
          {prospects.length > 0 && (
            <Button variant="ghost" size="sm" onClick={handleSelectAll}>
              {selectedIds.length === prospects.length ? "Desmarcar todos" : "Selecionar todos"}
            </Button>
          )}
        </div>

        {/* Prospects list */}
        <ScrollArea className="flex-1 border rounded-lg min-h-[300px]">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : prospects.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
              <Database className="h-12 w-12 mb-2 opacity-50" />
              <p>Nenhum prospecto encontrado na sua base</p>
              <p className="text-sm">Use a Prospecção para adicionar empresas</p>
            </div>
          ) : (
            <div className="divide-y">
              {prospects.map((prospect) => (
                <div 
                  key={prospect.id} 
                  className={`p-3 flex items-start gap-3 hover:bg-accent/50 cursor-pointer transition-colors ${
                    selectedIds.includes(prospect.id) ? "bg-accent" : ""
                  }`}
                  onClick={() => handleToggleSelect(prospect.id)}
                >
                  <Checkbox 
                    checked={selectedIds.includes(prospect.id)}
                    onCheckedChange={() => handleToggleSelect(prospect.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="font-medium truncate">{prospect.name}</span>
                      {prospect.company_size && (
                        <Badge variant="outline" className="shrink-0">{prospect.company_size}</Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                      {(prospect.city || prospect.state) && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {[prospect.city, prospect.state].filter(Boolean).join(" - ")}
                        </span>
                      )}
                      {prospect.phones?.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {prospect.phones[0]}
                        </span>
                      )}
                      {prospect.emails?.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {prospect.emails[0]}
                        </span>
                      )}
                    </div>
                    {prospect.segment && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {prospect.segment}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handlePullLeads}
            disabled={selectedIds.length === 0 || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Importando...
              </>
            ) : (
              <>
                <ArrowDownToLine className="h-4 w-4 mr-2" />
                Puxar {selectedIds.length > 0 ? `${selectedIds.length} Lead(s)` : "Leads"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
