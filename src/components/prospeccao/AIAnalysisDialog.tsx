import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  Sparkles, 
  Target, 
  FileText, 
  MessageSquare, 
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Lightbulb,
  Copy,
  Check,
  Loader2,
  Phone,
  Mail,
  MessageCircle,
  Globe,
  Instagram,
  Facebook,
  Linkedin,
  ExternalLink,
  Building2,
  MapPin,
  Users,
  Banknote
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { 
  FitAnalysis, 
  CompanySummary, 
  ApproachSuggestion, 
  ContactScript,
  CompanyData,
  DigitalPresenceAnalysis,
  useGenerateScript,
  useSuggestApproach,
  useDigitalPresence
} from "@/hooks/useAIProspecting";
import { AIFitBadge } from "./AIFitBadge";
import { useICPSettings } from "@/hooks/useICPSettings";
import whatsappIcon from "@/assets/whatsapp-icon.png";

// Helper: format phone with Brazil code for WhatsApp
const formatWhatsAppUrl = (phone: string) => {
  const cleaned = phone.replace(/\D/g, '');
  // Add 55 if not already starting with it
  const withCountryCode = cleaned.startsWith('55') ? cleaned : `55${cleaned}`;
  return `https://wa.me/${withCountryCode}`;
};

interface AIAnalysisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: CompanyData;
  fitAnalysis?: FitAnalysis;
  summary?: CompanySummary;
  isLoading?: boolean;
}

export function AIAnalysisDialog({
  open,
  onOpenChange,
  company,
  fitAnalysis,
  summary,
  isLoading,
}: AIAnalysisDialogProps) {
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<string>("whatsapp");
  const [approach, setApproach] = useState<ApproachSuggestion | null>(null);
  const [script, setScript] = useState<ContactScript | null>(null);
  const [digitalPresence, setDigitalPresence] = useState<DigitalPresenceAnalysis | null>(null);
  
  const { data: icpConfig } = useICPSettings();
  const generateScript = useGenerateScript();
  const suggestApproach = useSuggestApproach();
  const digitalPresenceAnalysis = useDigitalPresence();

  // Auto-fetch digital presence when dialog opens
  useEffect(() => {
    if (open && !digitalPresence && !digitalPresenceAnalysis.isPending) {
      handleAnalyzeDigitalPresence();
    }
  }, [open]);

  const handleAnalyzeDigitalPresence = async () => {
    const result = await digitalPresenceAnalysis.mutateAsync({ company });
    setDigitalPresence(result);
  };

  const handleGenerateScript = async () => {
    const result = await generateScript.mutateAsync({ 
      company, 
      channel: selectedChannel,
      icpConfig 
    });
    setScript(result);
  };

  const handleSuggestApproach = async () => {
    const result = await suggestApproach.mutateAsync({ company, icpConfig });
    setApproach(result);
  };

  const copyToClipboard = (text: string, type: "script" | "whatsapp" = "script") => {
    navigator.clipboard.writeText(text);
    if (type === "whatsapp") {
      setCopiedWhatsApp(true);
      toast.success("WhatsApp copiado!");
      setTimeout(() => setCopiedWhatsApp(false), 2000);
    } else {
      setCopiedScript(true);
      toast.success("Script copiado!");
      setTimeout(() => setCopiedScript(false), 2000);
    }
  };

  const getConfidenceBadge = (confidence: "alta" | "média" | "baixa") => {
    const colors = {
      alta: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      média: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      baixa: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
    };
    return <Badge className={colors[confidence]}>{confidence}</Badge>;
  };

  const getMaturityColor = (level: string) => {
    const colors: Record<string, string> = {
      alta: "text-green-600",
      média: "text-yellow-600",
      baixa: "text-orange-600",
      inexistente: "text-red-600"
    };
    return colors[level] || "text-muted-foreground";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Análise de IA - {company.name}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground">Analisando empresa com IA...</p>
          </div>
        ) : (
          <Tabs defaultValue="digital" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="digital" className="flex items-center gap-1">
                <Globe className="h-4 w-4" />
                <span className="hidden sm:inline">Digital</span>
              </TabsTrigger>
              <TabsTrigger value="fit" className="flex items-center gap-1">
                <Target className="h-4 w-4" />
                <span className="hidden sm:inline">Fit</span>
              </TabsTrigger>
              <TabsTrigger value="summary" className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Resumo</span>
              </TabsTrigger>
              <TabsTrigger value="approach" className="flex items-center gap-1">
                <Lightbulb className="h-4 w-4" />
                <span className="hidden sm:inline">Abordagem</span>
              </TabsTrigger>
              <TabsTrigger value="script" className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Script</span>
              </TabsTrigger>
            </TabsList>

            {/* DIGITAL PRESENCE TAB - PRIORITY */}
            <TabsContent value="digital" className="mt-4 space-y-4">
              {digitalPresenceAnalysis.isPending ? (
                <div className="flex flex-col items-center justify-center py-8 gap-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-muted-foreground">Buscando presença digital...</p>
                </div>
              ) : digitalPresence ? (
                <>
                  {/* WhatsApp - PRIORITY */}
                  <Card className="border-2 border-green-500/50 bg-gradient-to-r from-green-50/50 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-950/20">
                    <CardContent className="py-4">
                      {digitalPresence.whatsapp.found && digitalPresence.whatsapp.number ? (
                        <div className="flex items-center gap-4">
                          <div className="shrink-0">
                            <img src={whatsappIcon} alt="WhatsApp" className="h-10 w-10" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xl font-bold text-green-700 dark:text-green-400">
                              {digitalPresence.whatsapp.number}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-xs text-muted-foreground">{digitalPresence.whatsapp.source}</p>
                              {getConfidenceBadge(digitalPresence.whatsapp.confidence)}
                            </div>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <Button 
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(digitalPresence.whatsapp.number!, "whatsapp")}
                            >
                              {copiedWhatsApp ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </Button>
                            <Button 
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 gap-2"
                              onClick={() => window.open(formatWhatsAppUrl(digitalPresence.whatsapp.number!), '_blank')}
                            >
                              <img src={whatsappIcon} alt="WhatsApp" className="h-4 w-4" />
                              Abrir
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-4">
                          <div className="shrink-0 opacity-40">
                            <img src={whatsappIcon} alt="WhatsApp" className="h-10 w-10" />
                          </div>
                          <p className="text-muted-foreground text-sm">
                            WhatsApp não identificado. {digitalPresence.contactSuggestions?.[0] || "Tente buscar no site da empresa."}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Website */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Website
                        {digitalPresence.website.found && getConfidenceBadge(digitalPresence.website.confidence)}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {digitalPresence.website.found && digitalPresence.website.url ? (
                        <div className="flex items-center justify-between">
                          <div>
                            <a 
                              href={digitalPresence.website.url.startsWith('http') ? digitalPresence.website.url : `https://${digitalPresence.website.url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline flex items-center gap-1"
                            >
                              {digitalPresence.website.url}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                            <p className="text-xs text-muted-foreground">{digitalPresence.website.notes}</p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-sm">Website não identificado</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Data Quality Warnings */}
                  {digitalPresence.dataQualityWarnings && digitalPresence.dataQualityWarnings.length > 0 && (
                    <Card className="border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-950/20">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
                          <AlertCircle className="h-4 w-4" />
                          Alertas de Qualidade dos Dados
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-1">
                          {digitalPresence.dataQualityWarnings.map((warning, i) => (
                            <li key={i} className="text-sm text-yellow-700 dark:text-yellow-400 flex items-start gap-2">
                              <span>⚠️</span>
                              {warning}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {/* Social Media */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Redes Sociais</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-3">
                        {digitalPresence.socialMedia.instagram ? (
                          <div className="space-y-1">
                            <a 
                              href={digitalPresence.socialMedia.instagram.startsWith('http') ? digitalPresence.socialMedia.instagram : `https://instagram.com/${digitalPresence.socialMedia.instagram.replace('@', '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 p-2 rounded-md bg-gradient-to-r from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 transition-colors"
                            >
                              <Instagram className="h-5 w-5 text-pink-600" />
                              <span className="text-sm truncate">{digitalPresence.socialMedia.instagram}</span>
                              {digitalPresence.socialMedia.instagramValidated && (
                                <Check className="h-4 w-4 text-green-500" />
                              )}
                            </a>
                            {digitalPresence.socialMedia.instagramNote && (
                              <p className="text-xs text-muted-foreground px-2">{digitalPresence.socialMedia.instagramNote}</p>
                            )}
                          </div>
                        ) : digitalPresence.socialMedia.instagramNote ? (
                          <div className="flex items-center gap-2 p-2 rounded-md bg-yellow-500/10 col-span-2">
                            <AlertCircle className="h-4 w-4 text-yellow-600" />
                            <span className="text-sm text-yellow-700 dark:text-yellow-400">{digitalPresence.socialMedia.instagramNote}</span>
                          </div>
                        ) : null}
                        {digitalPresence.socialMedia.facebook && (
                          <a 
                            href={digitalPresence.socialMedia.facebook.startsWith('http') ? digitalPresence.socialMedia.facebook : `https://facebook.com/${digitalPresence.socialMedia.facebook}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-2 rounded-md bg-blue-500/10 hover:bg-blue-500/20 transition-colors"
                          >
                            <Facebook className="h-5 w-5 text-blue-600" />
                            <span className="text-sm truncate">{digitalPresence.socialMedia.facebook}</span>
                          </a>
                        )}
                        {digitalPresence.socialMedia.linkedin && (
                          <a 
                            href={digitalPresence.socialMedia.linkedin.startsWith('http') ? digitalPresence.socialMedia.linkedin : `https://linkedin.com/company/${digitalPresence.socialMedia.linkedin}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-2 rounded-md bg-blue-700/10 hover:bg-blue-700/20 transition-colors"
                          >
                            <Linkedin className="h-5 w-5 text-blue-700" />
                            <span className="text-sm truncate">{digitalPresence.socialMedia.linkedin}</span>
                          </a>
                        )}
                        {digitalPresence.socialMedia.tiktok && (
                          <a 
                            href={digitalPresence.socialMedia.tiktok.startsWith('http') ? digitalPresence.socialMedia.tiktok : `https://tiktok.com/${digitalPresence.socialMedia.tiktok}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-2 rounded-md bg-slate-500/10 hover:bg-slate-500/20 transition-colors"
                          >
                            <span className="text-lg">🎵</span>
                            <span className="text-sm truncate">{digitalPresence.socialMedia.tiktok}</span>
                          </a>
                        )}
                        {!digitalPresence.socialMedia.instagram && !digitalPresence.socialMedia.facebook && 
                         !digitalPresence.socialMedia.linkedin && !digitalPresence.socialMedia.tiktok && 
                         !digitalPresence.socialMedia.instagramNote && (
                          <p className="text-muted-foreground text-sm col-span-2">Nenhuma rede social identificada</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Digital Maturity */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center justify-between">
                        <span>Maturidade Digital</span>
                        <Badge variant="outline" className={getMaturityColor(digitalPresence.digitalMaturity.level)}>
                          {digitalPresence.digitalMaturity.level.toUpperCase()} ({digitalPresence.digitalMaturity.score}/100)
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{digitalPresence.digitalMaturity.analysis}</p>
                    </CardContent>
                  </Card>

                  {/* Contact Suggestions */}
                  {digitalPresence.contactSuggestions?.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Lightbulb className="h-4 w-4" />
                          Sugestões para Encontrar Contatos
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-1">
                          {digitalPresence.contactSuggestions.map((suggestion, i) => (
                            <li key={i} className="text-sm flex items-start gap-2">
                              <span className="text-primary">•</span>
                              {suggestion}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      setDigitalPresence(null);
                      handleAnalyzeDigitalPresence();
                    }}
                    disabled={digitalPresenceAnalysis.isPending}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Reanalisar Presença Digital
                  </Button>
                </>
              ) : (
                <div className="text-center py-8">
                  <Globe className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Descubra website, redes sociais e WhatsApp desta empresa
                  </p>
                  <Button onClick={handleAnalyzeDigitalPresence} disabled={digitalPresenceAnalysis.isPending}>
                    {digitalPresenceAnalysis.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Analisando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Analisar Presença Digital
                      </>
                    )}
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="fit" className="mt-4 space-y-4">
              {fitAnalysis ? (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">Análise de Fit com ICP</h3>
                      <p className="text-sm text-muted-foreground">Compatibilidade com seu perfil de cliente ideal</p>
                    </div>
                    <AIFitBadge 
                      score={fitAnalysis.score} 
                      recommendation={fitAnalysis.recommendation}
                    />
                  </div>

                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-sm">{fitAnalysis.justification}</p>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2 text-green-600">
                          <TrendingUp className="h-4 w-4" />
                          Pontos Fortes
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-1">
                          {fitAnalysis.strengths.map((strength, i) => (
                            <li key={i} className="text-sm flex items-start gap-2">
                              <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                              {strength}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2 text-yellow-600">
                          <AlertCircle className="h-4 w-4" />
                          Pontos de Atenção
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-1">
                          {fitAnalysis.concerns.map((concern, i) => (
                            <li key={i} className="text-sm flex items-start gap-2">
                              <TrendingDown className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                              {concern}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Análise de fit não disponível
                </p>
              )}
            </TabsContent>

            <TabsContent value="summary" className="mt-4 space-y-4">
              {summary ? (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Resumo Executivo</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm whitespace-pre-line">{summary.summary}</p>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Pontos-Chave</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-1">
                          {summary.keyPoints.map((point, i) => (
                            <li key={i} className="text-sm">• {point}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Oportunidades</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-1">
                          {summary.opportunities.map((opp, i) => (
                            <li key={i} className="text-sm">• {opp}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Serviços Sugeridos</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {summary.suggestedServices.map((service, i) => (
                          <Badge key={i} variant="secondary">{service}</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Resumo não disponível
                </p>
              )}
            </TabsContent>

            <TabsContent value="approach" className="mt-4 space-y-4">
              {!approach ? (
                <div className="text-center py-8">
                  <Lightbulb className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Gere uma sugestão de abordagem personalizada para este prospect
                  </p>
                  <Button onClick={handleSuggestApproach} disabled={suggestApproach.isPending}>
                    {suggestApproach.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Sugerir Abordagem
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Canal Recomendado</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Badge variant="outline" className="text-base">
                          {approach.channel === "whatsapp" && <MessageCircle className="h-4 w-4 mr-1" />}
                          {approach.channel === "email" && <Mail className="h-4 w-4 mr-1" />}
                          {approach.channel === "telefone" && <Phone className="h-4 w-4 mr-1" />}
                          {approach.channel.charAt(0).toUpperCase() + approach.channel.slice(1)}
                        </Badge>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Melhor Momento</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">{approach.timing}</p>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Ângulo de Abordagem</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{approach.approach}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Pitch Sugerido</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm italic">"{approach.pitch}"</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Frase de Abertura</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center justify-between gap-2">
                      <p className="text-sm">"{approach.icebreaker}"</p>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => copyToClipboard(approach.icebreaker)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            <TabsContent value="script" className="mt-4 space-y-4">
              <div className="flex gap-2 mb-4">
                <Button 
                  variant={selectedChannel === "whatsapp" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedChannel("whatsapp")}
                >
                  <MessageCircle className="h-4 w-4 mr-1" />
                  WhatsApp
                </Button>
                <Button 
                  variant={selectedChannel === "email" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedChannel("email")}
                >
                  <Mail className="h-4 w-4 mr-1" />
                  Email
                </Button>
                <Button 
                  variant={selectedChannel === "telefone" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedChannel("telefone")}
                >
                  <Phone className="h-4 w-4 mr-1" />
                  Telefone
                </Button>
              </div>

              {!script ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Gere um script de primeiro contato via {selectedChannel}
                  </p>
                  <Button onClick={handleGenerateScript} disabled={generateScript.isPending}>
                    {generateScript.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Gerar Script
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <>
                  <Card>
                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                      <CardTitle className="text-sm">Script de Contato</CardTitle>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => copyToClipboard(script.script)}
                      >
                        {copiedScript ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        {copiedScript ? "Copiado!" : "Copiar"}
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm whitespace-pre-line bg-muted p-3 rounded-md">
                        {script.script}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Follow-up Sugerido</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{script.followUp}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Objeções Comuns</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {script.objections.map((obj, i) => (
                        <div key={i} className="space-y-1">
                          <p className="text-sm font-medium text-muted-foreground">
                            "{obj.objection}"
                          </p>
                          <p className="text-sm pl-4 border-l-2 border-primary">
                            {obj.response}
                          </p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setScript(null)}
                  >
                    Gerar Novo Script
                  </Button>
                </>
              )}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
