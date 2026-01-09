import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Target, CalendarDays, Megaphone, MessageSquare, Link2, CheckCircle, ExternalLink } from "lucide-react";
import { useClients } from "@/hooks/useClients";
import { usePlanningContents, usePlanningCampaigns } from "@/hooks/usePlannings";

const statusConfig: Record<string, { label: string; color: string }> = {
  rascunho: { label: "Rascunho", color: "bg-muted" },
  aguardando_aprovacao: { label: "Aguardando Aprovação", color: "bg-yellow-500" },
  aprovado: { label: "Aprovado", color: "bg-green-500" },
  em_execucao: { label: "Em Execução", color: "bg-blue-500" },
  concluido: { label: "Concluído", color: "bg-primary" },
};

const contentTypeConfig: Record<string, { label: string; color: string }> = {
  post: { label: "Post", color: "bg-blue-500" },
  reels: { label: "Reels", color: "bg-pink-500" },
  stories: { label: "Stories", color: "bg-purple-500" },
  carrossel: { label: "Carrossel", color: "bg-orange-500" },
  video: { label: "Vídeo", color: "bg-red-500" },
  blog: { label: "Blog", color: "bg-green-500" },
};

const contentStatusConfig: Record<string, { label: string; variant: "outline" | "secondary" | "default" }> = {
  pendente: { label: "Pendente", variant: "outline" },
  aprovado: { label: "Aprovado", variant: "secondary" },
  produzindo: { label: "Produzindo", variant: "secondary" },
  publicado: { label: "Publicado", variant: "default" },
};

const monthNames = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export interface PlanningViewProps {
  planning: {
    id: string;
    client_id: string;
    month: number;
    year: number;
    status: string;
    objectives?: string[] | null;
    observations?: string | null;
    drive_link?: string | null;
    share_token?: string | null;
  };
  isPublic?: boolean;
  onCopyLink?: () => void;
}

export function PlanningView({ planning, isPublic = false, onCopyLink }: PlanningViewProps) {
  const { data: clients = [] } = useClients();
  const { data: contents = [] } = usePlanningContents(planning.id);
  const { data: campaigns = [] } = usePlanningCampaigns(planning.id);
  
  const client = clients.find(c => c.id === planning.client_id);
  const status = statusConfig[planning.status] || statusConfig.rascunho;

  // Group content by week
  const contentByWeek: Record<number, typeof contents> = {};
  contents.forEach(item => {
    if (!item.scheduled_date) return;
    const date = new Date(item.scheduled_date);
    const weekNumber = Math.ceil(date.getDate() / 7);
    if (!contentByWeek[weekNumber]) {
      contentByWeek[weekNumber] = [];
    }
    contentByWeek[weekNumber].push(item);
  });

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className={`h-3 w-3 rounded-full ${status.color}`} />
            <span className="text-sm font-medium">{status.label}</span>
          </div>
          {!isPublic && client && (
            <span className="text-sm text-muted-foreground">
              {client.name} - {monthNames[planning.month - 1]} {planning.year}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {planning.drive_link && (
            <Button variant="outline" size="sm" asChild>
              <a href={planning.drive_link} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Drive
              </a>
            </Button>
          )}
          {!isPublic && onCopyLink && (
            <Button variant="outline" size="sm" onClick={onCopyLink}>
              <Link2 className="h-4 w-4 mr-2" />
              Copiar Link
            </Button>
          )}
        </div>
      </div>

      {/* Objectives */}
      {planning.objectives && planning.objectives.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Objetivos do Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {planning.objectives.map((objective, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>{objective}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Content Calendar */}
      {contents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              Calendário de Conteúdo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {Object.entries(contentByWeek).map(([week, items]) => (
              <div key={week} className="space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground">
                  Semana {week}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {items.map((item) => {
                    const typeConfig = contentTypeConfig[item.type] || { label: item.type, color: 'bg-gray-500' };
                    const statusConf = contentStatusConfig[item.status || 'pendente'] || contentStatusConfig.pendente;
                    const date = item.scheduled_date ? new Date(item.scheduled_date) : null;
                    
                    return (
                      <div 
                        key={item.id}
                        className="p-3 rounded-lg border bg-card hover:border-primary/50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full ${typeConfig.color}`} />
                            <span className="text-xs font-medium">{typeConfig.label}</span>
                          </div>
                          <Badge variant={statusConf.variant} className="text-xs">
                            {statusConf.label}
                          </Badge>
                        </div>
                        <p className="font-medium text-sm">{item.title}</p>
                        {item.description && (
                          <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                        )}
                        {date && (
                          <p className="text-xs text-muted-foreground mt-2">
                            {date.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' })}
                          </p>
                        )}
                        {item.send_to_production && (
                          <Badge variant="secondary" className="mt-2 text-xs">
                            Enviado p/ produção
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Campaigns */}
      {campaigns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-primary" />
              Campanhas de Tráfego
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {campaigns.map((campaign) => (
                <div 
                  key={campaign.id}
                  className="p-4 rounded-lg border bg-card"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium">{campaign.name}</h4>
                    {campaign.platforms && campaign.platforms.length > 0 && (
                      <Badge variant="secondary">{campaign.platforms.join(', ')}</Badge>
                    )}
                  </div>
                  {campaign.objective && (
                    <p className="text-sm text-muted-foreground mb-2">{campaign.objective}</p>
                  )}
                  {campaign.budget && (
                    <p className="text-sm font-medium">
                      Budget: R$ {campaign.budget.toLocaleString('pt-BR')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Observations */}
      {planning.observations && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Observações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{planning.observations}</p>
          </CardContent>
        </Card>
      )}

      {/* Content Summary */}
      {contents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resumo do Conteúdo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(contentTypeConfig).map(([type, config]) => {
                const count = contents.filter(c => c.type === type).length;
                if (count === 0) return null;
                return (
                  <div key={type} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                    <div className={`h-3 w-3 rounded-full ${config.color}`} />
                    <div>
                      <p className="text-2xl font-bold">{count}</p>
                      <p className="text-xs text-muted-foreground">{config.label}s</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}