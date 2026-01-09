import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar, 
  BadgeCheck, 
  AlertTriangle,
  Users,
  Briefcase,
  DollarSign,
  Send,
  Plus
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatCNPJ } from "@/lib/cnpjUtils";
import type { CNPJLookupResult } from "@/hooks/useCNPJLookup";

interface Props {
  data: CNPJLookupResult;
  onAddToProspects: () => void;
  onSendToLeads: () => void;
  onSendToFunnel: () => void;
  isAdding?: boolean;
}

export function CNPJResultCard({ 
  data, 
  onAddToProspects, 
  onSendToLeads,
  onSendToFunnel,
  isAdding 
}: Props) {
  const isActive = data.situacaoCadastral === "ATIVA";
  
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const [year, month, day] = dateStr.split("-");
    return `${day}/${month}/${year}`;
  };
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(value);
  };
  
  const getPorteLabel = (porte: string) => {
    const portes: Record<string, string> = {
      "MICRO EMPRESA": "Microempresa (ME)",
      "EMPRESA DE PEQUENO PORTE": "Pequeno Porte (EPP)",
      "DEMAIS": "Médio/Grande Porte"
    };
    return portes[porte] || porte;
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant={isActive ? "default" : "destructive"} className="gap-1">
                {isActive ? (
                  <BadgeCheck className="h-3 w-3" />
                ) : (
                  <AlertTriangle className="h-3 w-3" />
                )}
                {data.situacaoCadastral}
              </Badge>
              <Badge variant="outline">{getPorteLabel(data.porte)}</Badge>
            </div>
            <CardTitle className="text-xl">
              {data.nomeFantasia || data.razaoSocial}
            </CardTitle>
            {data.nomeFantasia && (
              <p className="text-sm text-muted-foreground mt-1">
                {data.razaoSocial}
              </p>
            )}
            <p className="text-sm font-mono text-muted-foreground mt-1">
              CNPJ: {formatCNPJ(data.cnpj)}
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={onAddToProspects}
              disabled={isAdding}
            >
              <Plus className="h-4 w-4 mr-1" />
              Adicionar à Lista
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={onSendToLeads}
              disabled={isAdding}
            >
              <Send className="h-4 w-4 mr-1" />
              Enviar p/ Leads
            </Button>
            <Button 
              size="sm"
              onClick={onSendToFunnel}
              disabled={isAdding}
            >
              <Send className="h-4 w-4 mr-1" />
              Enviar p/ Funil
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Main Info Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">{data.cidade} - {data.uf}</p>
              <p className="text-muted-foreground">{data.bairro}</p>
              <p className="text-muted-foreground text-xs">{data.endereco}</p>
              <p className="text-muted-foreground text-xs">CEP: {data.cep}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <Briefcase className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">CNAE Principal</p>
              <p className="text-muted-foreground">{data.cnaeFiscal}</p>
              <p className="text-muted-foreground text-xs line-clamp-2">
                {data.cnaeFiscalDescricao}
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">Capital Social</p>
              <p className="text-muted-foreground">
                {formatCurrency(data.capitalSocial)}
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">Início Atividade</p>
              <p className="text-muted-foreground">
                {formatDate(data.dataInicioAtividade)}
              </p>
            </div>
          </div>
        </div>
        
        <Separator />
        
        {/* Contact Info */}
        <div className="flex flex-wrap gap-6">
          {(data.telefone1 || data.telefone2) && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm">
                {data.telefone1 && <span>{data.telefone1}</span>}
                {data.telefone1 && data.telefone2 && <span className="mx-1">•</span>}
                {data.telefone2 && <span>{data.telefone2}</span>}
              </div>
            </div>
          )}
          
          {data.email && (
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{data.email.toLowerCase()}</span>
            </div>
          )}
          
          {!data.telefone1 && !data.telefone2 && !data.email && (
            <p className="text-sm text-muted-foreground">
              Nenhum contato disponível na base da Receita Federal
            </p>
          )}
        </div>
        
        {/* Sócios */}
        {data.socios.length > 0 && (
          <>
            <Separator />
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">Quadro Societário</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {data.socios.slice(0, 4).map((socio, index) => (
                  <div key={index} className="text-sm">
                    <p className="font-medium">{socio.nome}</p>
                    <p className="text-muted-foreground text-xs">{socio.qualificacao}</p>
                  </div>
                ))}
                {data.socios.length > 4 && (
                  <p className="text-sm text-muted-foreground">
                    +{data.socios.length - 4} sócio(s)
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
