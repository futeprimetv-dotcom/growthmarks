import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  MessageCircle
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { 
  FitAnalysis, 
  CompanySummary, 
  ApproachSuggestion, 
  ContactScript,
  CompanyData,
  useGenerateScript,
  useSuggestApproach
} from "@/hooks/useAIProspecting";
import { AIFitBadge } from "./AIFitBadge";
import { useICPSettings } from "@/hooks/useICPSettings";

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
  const [selectedChannel, setSelectedChannel] = useState<string>("whatsapp");
  const [approach, setApproach] = useState<ApproachSuggestion | null>(null);
  const [script, setScript] = useState<ContactScript | null>(null);
  
  const { data: icpConfig } = useICPSettings();
  const generateScript = useGenerateScript();
  const suggestApproach = useSuggestApproach();

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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedScript(true);
    toast.success("Script copiado!");
    setTimeout(() => setCopiedScript(false), 2000);
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
          <Tabs defaultValue="fit" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="fit" className="flex items-center gap-1">
                <Target className="h-4 w-4" />
                Fit
              </TabsTrigger>
              <TabsTrigger value="summary" className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                Resumo
              </TabsTrigger>
              <TabsTrigger value="approach" className="flex items-center gap-1">
                <Lightbulb className="h-4 w-4" />
                Abordagem
              </TabsTrigger>
              <TabsTrigger value="script" className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                Script
              </TabsTrigger>
            </TabsList>

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
