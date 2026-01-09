import { useState } from "react";
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Globe,
  Calendar,
  DollarSign,
  Tag,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  Briefcase,
  Users,
  Copy,
  Check,
  MessageCircle,
  Search,
  Loader2,
  Instagram,
  Linkedin,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import type { CompanySearchResult } from "@/hooks/useCompanySearch";
import { useEnrichCompany, type EnrichedData } from "@/hooks/useEnrichCompany";

interface Props {
  results: CompanySearchResult[];
  isLoading: boolean;
  selectedIds: string[];
  onSelectChange: (ids: string[]) => void;
  onBack: () => void;
  totalResults: number;
}

// Store enriched data for each company
const enrichedCache = new Map<string, EnrichedData>();

function formatCNPJ(cnpj: string): string {
  if (!cnpj) return "-";
  const clean = cnpj.replace(/\D/g, "");
  if (clean.length !== 14) return cnpj;
  return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
}

function formatCurrency(value: number | null): string {
  if (!value) return "-";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  try {
    return new Date(dateStr).toLocaleDateString("pt-BR");
  } catch {
    return dateStr;
  }
}

function formatPhone(phone: string): string {
  if (!phone) return phone;
  const clean = phone.replace(/\D/g, "");
  if (clean.length === 11) {
    return clean.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  } else if (clean.length === 10) {
    return clean.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  }
  return phone;
}

function CompanyCard({
  company,
  isSelected,
  onSelect,
}: {
  company: CompanySearchResult;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [enrichedData, setEnrichedData] = useState<EnrichedData | null>(
    enrichedCache.get(company.id || company.cnpj) || null
  );
  const [isEnriching, setIsEnriching] = useState(false);

  const enrichMutation = useEnrichCompany();

  const handleCopy = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleEnrich = async () => {
    setIsEnriching(true);
    try {
      const data = await enrichMutation.mutateAsync({
        cnpj: company.cnpj,
        companyName: company.name || company.razao_social,
        city: company.city,
        state: company.state,
      });
      
      setEnrichedData(data);
      enrichedCache.set(company.id || company.cnpj, data);
      setExpanded(true);
      toast.success("Dados enriquecidos com sucesso!");
    } catch (error) {
      console.error("Enrich error:", error);
      toast.error("Erro ao buscar detalhes. Tente novamente.");
    } finally {
      setIsEnriching(false);
    }
  };

  const isActive = company.situacao === "ATIVA";
  const isWeb = company.situacao === "WEB";
  const isInactive = company.situacao && ["BAIXADA", "SUSPENSA", "INAPTA", "NULA"].includes(company.situacao);
  const hasPartialData = !company.cnpj || !company.situacao;
  
  // Merge original data with enriched data
  const allPhones = [...new Set([
    ...(company.phones || []),
    ...(enrichedData?.phones || [])
  ])];
  
  const allEmails = [...new Set([
    ...(company.emails || []),
    ...(enrichedData?.emails || [])
  ])];

  const whatsappNumbers = enrichedData?.whatsapp || 
    allPhones.filter(p => {
      const clean = p.replace(/\D/g, "");
      return clean.length === 11 && clean[2] === "9";
    });

  const hasContactInfo = allPhones.length > 0 || allEmails.length > 0;

  return (
    <Card className={cn(
      "transition-all duration-200",
      isSelected && "ring-2 ring-primary",
      isInactive && "opacity-60"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-4">
          <Checkbox
            checked={isSelected}
            onCheckedChange={onSelect}
            className="mt-1"
          />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-semibold text-lg truncate">
                    {company.name}
                  </h3>
                  {isActive ? (
                    <Badge variant="outline" className="text-green-600 border-green-600 shrink-0" title="Empresa com CNPJ ativo na Receita Federal">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Ativa
                    </Badge>
                  ) : isWeb ? (
                    <Badge variant="outline" className="text-blue-600 border-blue-600 shrink-0" title="Empresa encontrada na web, CNPJ não verificado">
                      <Globe className="h-3 w-3 mr-1" />
                      Web
                    </Badge>
                  ) : hasPartialData ? (
                    <Badge variant="outline" className="text-amber-600 border-amber-600 shrink-0" title="Apenas informações básicas disponíveis">
                      <Search className="h-3 w-3 mr-1" />
                      Dados Parciais
                    </Badge>
                  ) : isInactive ? (
                    <Badge variant="outline" className="text-destructive border-destructive shrink-0" title="Empresa com situação irregular na Receita Federal">
                      <XCircle className="h-3 w-3 mr-1" />
                      {company.situacao}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground shrink-0">
                      {company.situacao}
                    </Badge>
                  )}
                  {enrichedData && (
                    <Badge className="bg-primary/10 text-primary border-primary shrink-0">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Enriquecido
                    </Badge>
                  )}
                </div>
                {company.razao_social && company.razao_social !== company.name && (
                  <p className="text-sm text-muted-foreground truncate">
                    {company.razao_social}
                  </p>
                )}
              </div>

              {/* Enrich Button */}
              <Button
                variant={enrichedData ? "outline" : "default"}
                size="sm"
                onClick={handleEnrich}
                disabled={isEnriching}
                className="shrink-0"
              >
                {isEnriching ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Buscando...
                  </>
                ) : enrichedData ? (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Atualizar
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Buscar Detalhes
                  </>
                )}
              </Button>
            </div>

            {/* Key Info Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              {/* CNPJ */}
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium uppercase">CNPJ</p>
                <div className="flex items-center gap-1">
                  <p className="text-sm font-mono">{formatCNPJ(company.cnpj)}</p>
                  {company.cnpj && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleCopy(company.cnpj, "cnpj")}
                    >
                      {copiedField === "cnpj" ? (
                        <Check className="h-3 w-3 text-green-600" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  )}
                </div>
              </div>

              {/* Location */}
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium uppercase">Localização</p>
                <div className="flex items-center gap-1 text-sm">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span>{company.city}/{company.state}</span>
                </div>
              </div>

              {/* Company Size */}
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium uppercase">Porte</p>
                <div className="flex items-center gap-1 text-sm">
                  <Users className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span>{company.company_size || "-"}</span>
                </div>
              </div>

              {/* Capital Social */}
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium uppercase">Capital Social</p>
                <div className="flex items-center gap-1 text-sm">
                  <DollarSign className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span>{formatCurrency(company.capital_social)}</span>
                </div>
              </div>
            </div>

            {/* Contact Row */}
            <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t">
              {/* Emails */}
              {allEmails.length > 0 ? (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  <div className="flex flex-wrap gap-2">
                    {allEmails.slice(0, 2).map((email, i) => (
                      <a
                        key={i}
                        href={`mailto:${email}`}
                        className="text-sm text-primary hover:underline"
                      >
                        {email}
                      </a>
                    ))}
                    {allEmails.length > 2 && (
                      <span className="text-xs text-muted-foreground">
                        +{allEmails.length - 2}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span className="text-sm">Sem email</span>
                </div>
              )}

              <Separator orientation="vertical" className="h-4" />

              {/* Phones */}
              {allPhones.length > 0 ? (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" />
                  <div className="flex flex-wrap items-center gap-2">
                    {allPhones.slice(0, 2).map((phone, i) => (
                      <a
                        key={i}
                        href={`tel:${phone.replace(/\D/g, "")}`}
                        className="text-sm text-primary hover:underline"
                      >
                        {formatPhone(phone)}
                      </a>
                    ))}
                    {allPhones.length > 2 && (
                      <span className="text-xs text-muted-foreground">
                        +{allPhones.length - 2}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span className="text-sm">Sem telefone</span>
                </div>
              )}

              {/* WhatsApp Button */}
              {whatsappNumbers.length > 0 && (
                <>
                  <Separator orientation="vertical" className="h-4" />
                  <a
                    href={`https://wa.me/55${whatsappNumbers[0].replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors"
                  >
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </a>
                </>
              )}

              {/* Instagram */}
              {enrichedData?.instagram && enrichedData.instagram.length > 0 && (
                <>
                  <Separator orientation="vertical" className="h-4" />
                  <a
                    href={`https://instagram.com/${enrichedData.instagram[0]}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-sm font-medium transition-colors"
                  >
                    <Instagram className="h-4 w-4" />
                    @{enrichedData.instagram[0]}
                  </a>
                </>
              )}

              {/* LinkedIn */}
              {enrichedData?.linkedin && (
                <>
                  <Separator orientation="vertical" className="h-4" />
                  <a
                    href={enrichedData.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
                  >
                    <Linkedin className="h-4 w-4" />
                    LinkedIn
                  </a>
                </>
              )}

              {/* Website */}
              {(enrichedData?.website || company.website_url) && (
                <>
                  <Separator orientation="vertical" className="h-4" />
                  <a
                    href={enrichedData?.website || company.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 text-sm font-medium transition-colors"
                  >
                    <Globe className="h-4 w-4" />
                    Site
                  </a>
                </>
              )}
            </div>

            {/* Quick hint when no contact */}
            {!hasContactInfo && !enrichedData && (
              <p className="text-xs text-muted-foreground mt-2 italic">
                💡 Clique em "Buscar Detalhes" para encontrar telefone, email e redes sociais
              </p>
            )}
          </div>
        </div>
      </CardHeader>

      {/* Expandable Details */}
      <Collapsible open={expanded} onOpenChange={setExpanded}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full flex items-center justify-center gap-2 rounded-none border-t h-10"
          >
            {expanded ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Menos detalhes
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Ver mais detalhes
              </>
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              {/* CNAE */}
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium uppercase flex items-center gap-1">
                  <Briefcase className="h-3 w-3" />
                  Atividade Principal (CNAE)
                </p>
                <p className="text-sm">
                  {company.cnae_code && (
                    <span className="font-mono text-muted-foreground mr-2">
                      {company.cnae_code}
                    </span>
                  )}
                  {company.cnae_description || "-"}
                </p>
              </div>

              {/* Segment */}
              {company.segment && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium uppercase flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    Segmento
                  </p>
                  <p className="text-sm">{company.segment}</p>
                </div>
              )}

              {/* Opening Date */}
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium uppercase flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Data de Abertura
                </p>
                <p className="text-sm">{formatDate(company.data_abertura)}</p>
              </div>

              {/* All phones when enriched */}
              {allPhones.length > 2 && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium uppercase flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    Todos os Telefones
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {allPhones.map((phone, i) => (
                      <a
                        key={i}
                        href={`tel:${phone.replace(/\D/g, "")}`}
                        className="text-sm text-primary hover:underline"
                      >
                        {formatPhone(phone)}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* Full Address */}
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium uppercase flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Endereço Completo
                </p>
                <p className="text-sm">
                  {enrichedData?.address || 
                    [
                      company.address,
                      company.number,
                      company.complement,
                      company.neighborhood,
                    ]
                      .filter(Boolean)
                      .join(", ") || "-"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {company.city}/{company.state}
                  {company.zip_code && ` - CEP: ${company.zip_code}`}
                </p>
              </div>

              {/* All Instagram handles */}
              {enrichedData?.instagram && enrichedData.instagram.length > 1 && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium uppercase flex items-center gap-1">
                    <Instagram className="h-3 w-3" />
                    Instagram
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {enrichedData.instagram.map((handle, i) => (
                      <a
                        key={i}
                        href={`https://instagram.com/${handle}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        @{handle}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* All emails when enriched */}
              {allEmails.length > 2 && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium uppercase flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    Todos os Emails
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {allEmails.map((email, i) => (
                      <a
                        key={i}
                        href={`mailto:${email}`}
                        className="text-sm text-primary hover:underline"
                      >
                        {email}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Website */}
              {(enrichedData?.website || company.website_url) && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium uppercase flex items-center gap-1">
                    <Globe className="h-3 w-3" />
                    Website
                  </p>
                  <a
                    href={enrichedData?.website || company.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    {enrichedData?.website || company.website_url} <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <div className="flex items-start gap-4">
              <Skeleton className="h-5 w-5" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="grid grid-cols-4 gap-4 mt-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}

export function SearchResultsPanel({
  results,
  isLoading,
  selectedIds,
  onSelectChange,
  onBack,
  totalResults,
}: Props) {
  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectChange(selectedIds.filter((i) => i !== id));
    } else {
      onSelectChange([...selectedIds, id]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === results.length) {
      onSelectChange([]);
    } else {
      onSelectChange(results.map((c) => c.id || c.cnpj));
    }
  };

  return (
    <div className="flex-1 overflow-auto p-4">
      {isLoading ? (
        <LoadingSkeleton />
      ) : results.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Building2 className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold">Nenhuma empresa encontrada</h3>
          <p className="text-muted-foreground mt-1 max-w-md">
            Tente ajustar os filtros para encontrar mais resultados.
          </p>
          <Button variant="outline" className="mt-4" onClick={onBack}>
            Voltar aos filtros
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2">
            <Button variant="outline" size="sm" onClick={toggleSelectAll}>
              {selectedIds.length === results.length
                ? "Desmarcar todos"
                : `Selecionar todos (${results.length})`}
            </Button>
            <p className="text-sm text-muted-foreground">
              💡 Use "Buscar Detalhes" para encontrar contatos das empresas
            </p>
          </div>
          {results.map((company) => (
            <CompanyCard
              key={company.id || company.cnpj}
              company={company}
              isSelected={selectedIds.includes(company.id || company.cnpj)}
              onSelect={() => toggleSelect(company.id || company.cnpj)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
