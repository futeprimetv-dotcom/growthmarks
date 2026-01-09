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
  Plus,
  Copy,
  Check,
  ExternalLink
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatCNPJ } from "@/lib/cnpjUtils";
import type { CNPJLookupResult } from "@/hooks/useCNPJLookup";
import { useState } from "react";
import { toast } from "sonner";
import whatsappIcon from "@/assets/whatsapp-icon.png";

interface Props {
  data: CNPJLookupResult;
  onAddToProspects: () => void;
  onSendToLeads: () => void;
  onSendToFunnel: () => void;
  isAdding?: boolean;
}

// Helper: format phone with Brazil code for WhatsApp
const formatWhatsAppUrl = (phone: string) => {
  const cleaned = phone.replace(/\D/g, '');
  // Add 55 if not already starting with it
  const withCountryCode = cleaned.startsWith('55') ? cleaned : `55${cleaned}`;
  return `https://wa.me/${withCountryCode}`;
};

export function CNPJResultCard({ 
  data, 
  onAddToProspects, 
  onSendToLeads,
  onSendToFunnel,
  isAdding 
}: Props) {
  const [copiedCNPJ, setCopiedCNPJ] = useState(false);
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

  const handleCopyCNPJ = () => {
    navigator.clipboard.writeText(data.cnpj);
    setCopiedCNPJ(true);
    toast.success("CNPJ copiado!");
    setTimeout(() => setCopiedCNPJ(false), 2000);
  };

  const primaryPhone = data.telefone1 || data.telefone2;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Status Badges */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
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
            
            {/* Company Name */}
            <CardTitle className="text-xl leading-tight">
              {data.nomeFantasia || data.razaoSocial}
            </CardTitle>
            {data.nomeFantasia && (
              <p className="text-sm text-muted-foreground mt-1 truncate">
                {data.razaoSocial}
              </p>
            )}
            
            {/* CNPJ with copy */}
            <div className="flex items-center gap-2 mt-2">
              <p className="text-sm font-mono text-muted-foreground">
                CNPJ: {formatCNPJ(data.cnpj)}
              </p>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6"
                onClick={handleCopyCNPJ}
              >
                {copiedCNPJ ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              </Button>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex flex-col gap-2 shrink-0">
            <Button 
              variant="outline" 
              size="sm"
              onClick={onAddToProspects}
              disabled={isAdding || !isActive}
            >
              <Plus className="h-4 w-4 mr-1" />
              Adicionar
            </Button>
            <Button 
              size="sm"
              onClick={onSendToFunnel}
              disabled={isAdding || !isActive}
            >
              <Send className="h-4 w-4 mr-1" />
              Enviar p/ Funil
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Quick Contact - WhatsApp Priority */}
        {primaryPhone && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <img src={whatsappIcon} alt="WhatsApp" className="h-8 w-8" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-green-700 dark:text-green-400">
                {data.telefone1}
                {data.telefone1 && data.telefone2 && " • "}
                {data.telefone2}
              </p>
              {data.email && (
                <p className="text-xs text-muted-foreground truncate">{data.email.toLowerCase()}</p>
              )}
            </div>
            <Button 
              size="sm"
              className="bg-green-600 hover:bg-green-700 gap-2 shrink-0"
              onClick={() => window.open(formatWhatsAppUrl(primaryPhone), '_blank')}
            >
              <img src={whatsappIcon} alt="" className="h-4 w-4" />
              WhatsApp
            </Button>
          </div>
        )}

        {!primaryPhone && data.email && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm flex-1">{data.email.toLowerCase()}</span>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open(`mailto:${data.email}`, '_blank')}
            >
              Enviar Email
            </Button>
          </div>
        )}

        <Separator />

        {/* Info Grid - Cleaner Layout */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">Localização</span>
            </div>
            <p className="text-sm font-medium">{data.cidade} - {data.uf}</p>
            <p className="text-xs text-muted-foreground">{data.bairro}</p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Briefcase className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">CNAE</span>
            </div>
            <p className="text-sm font-medium">{data.cnaeFiscal}</p>
            <p className="text-xs text-muted-foreground line-clamp-1">
              {data.cnaeFiscalDescricao}
            </p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <DollarSign className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">Capital Social</span>
            </div>
            <p className="text-sm font-medium">
              {formatCurrency(data.capitalSocial)}
            </p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">Abertura</span>
            </div>
            <p className="text-sm font-medium">
              {formatDate(data.dataInicioAtividade)}
            </p>
          </div>
        </div>
        
        {/* Sócios - Compact */}
        {data.socios.length > 0 && (
          <>
            <Separator />
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">Sócios ({data.socios.length})</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {data.socios.slice(0, 4).map((socio, index) => (
                  <Badge key={index} variant="secondary" className="font-normal">
                    {socio.nome.split(' ').slice(0, 2).join(' ')}
                    <span className="text-muted-foreground ml-1 text-xs">
                      ({socio.qualificacao.split(' ').slice(0, 1).join('')})
                    </span>
                  </Badge>
                ))}
                {data.socios.length > 4 && (
                  <Badge variant="outline">+{data.socios.length - 4}</Badge>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
