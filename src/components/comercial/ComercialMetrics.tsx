import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLeads } from "@/hooks/useLeads";
import { Target, TrendingUp, DollarSign, Users, Flame, ThermometerSun, Snowflake } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const ORIGIN_COLORS: Record<string, string> = {
  instagram: '#E1306C',
  whatsapp: '#25D366',
  site: '#3b82f6',
  indicacao: '#a855f7',
  trafego_pago: '#f97316',
  prospeccao: '#eab308',
  outro: '#6b7280',
};

const ORIGIN_LABELS: Record<string, string> = {
  instagram: 'Instagram',
  whatsapp: 'WhatsApp',
  site: 'Site',
  indicacao: 'Indicação',
  trafego_pago: 'Tráfego Pago',
  prospeccao: 'Prospecção',
  outro: 'Outro',
};

const STATUS_LABELS: Record<string, string> = {
  novo: 'Novo',
  lead_frio: 'Lead Frio',
  em_contato: 'Em Contato',
  em_qualificacao: 'Em Qualificação',
  contato_inicial: 'Contato Inicial',
  reuniao_agendada: 'Reunião Agendada',
  proposta_enviada: 'Proposta Enviada',
  negociacao: 'Negociação',
  fechamento: 'Fechamento',
  perdido: 'Perdido',
};

interface ComercialMetricsProps {
  funnelId?: string | null;
}

export function ComercialMetrics({ funnelId }: ComercialMetricsProps) {
  const { data: allLeads = [], isLoading } = useLeads();
  
  // Filter by funnel
  const leads = funnelId 
    ? allLeads.filter((l: any) => l.funnel_id === funnelId)
    : allLeads;

  const metrics = useMemo(() => {
    const totalLeads = leads.length;
    const activeLeads = leads.filter(l => l.status !== 'fechamento' && l.status !== 'perdido').length;
    const hotLeads = leads.filter(l => l.temperature === 'hot' && l.status !== 'fechamento' && l.status !== 'perdido').length;
    
    const pipelineValue = leads
      .filter(l => l.status !== 'perdido' && !l.is_archived)
      .reduce((acc, l) => acc + (l.estimated_value || 0), 0);
    
    const closedLeads = leads.filter(l => l.status === 'fechamento');
    const conversionRate = totalLeads > 0 ? (closedLeads.length / totalLeads) * 100 : 0;
    const avgTicket = closedLeads.length > 0 
      ? closedLeads.reduce((acc, l) => acc + (l.estimated_value || 0), 0) / closedLeads.length 
      : 0;

    return { totalLeads, activeLeads, hotLeads, pipelineValue, conversionRate, avgTicket };
  }, [leads]);

  const salesFunnelData = useMemo(() => {
    const statusOrder = ['novo', 'lead_frio', 'em_contato', 'em_qualificacao', 'reuniao_agendada', 'proposta_enviada', 'negociacao', 'fechamento'];
    
    const statusCounts = statusOrder.reduce((acc, status) => {
      acc[status] = leads.filter(l => l.status === status && !l.is_archived).length;
      return acc;
    }, {} as Record<string, number>);

    return statusOrder
      .filter(status => statusCounts[status] > 0)
      .map(status => ({
        stage: STATUS_LABELS[status] || status,
        count: statusCounts[status],
      }));
  }, [leads]);

  const leadsByOriginData = useMemo(() => {
    const originCounts = leads.reduce((acc, lead) => {
      const origin = lead.origin || 'outro';
      acc[origin] = (acc[origin] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(originCounts).map(([origin, count]) => ({
      origin: ORIGIN_LABELS[origin] || origin,
      count,
      color: ORIGIN_COLORS[origin] || ORIGIN_COLORS.outro,
    }));
  }, [leads]);

  const temperatureCounts = useMemo(() => ({
    cold: leads.filter(l => l.temperature === 'cold').length,
    warm: leads.filter(l => l.temperature === 'warm').length,
    hot: leads.filter(l => l.temperature === 'hot').length,
  }), [leads]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const isEmpty = leads.length === 0;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Leads</p>
                <p className="text-2xl font-bold">{metrics.totalLeads}</p>
                <p className="text-xs text-muted-foreground">{metrics.activeLeads} ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-red-500/10">
                <Flame className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Leads Quentes</p>
                <p className="text-2xl font-bold">{metrics.hotLeads}</p>
                <p className="text-xs text-muted-foreground">Prioridade alta</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-500/10">
                <DollarSign className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valor no Pipeline</p>
                <p className="text-2xl font-bold">R$ {metrics.pipelineValue.toLocaleString('pt-BR')}</p>
                <p className="text-xs text-muted-foreground">Potencial de vendas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-purple-500/10">
                <TrendingUp className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Conversão</p>
                <p className="text-2xl font-bold">{metrics.conversionRate.toFixed(0)}%</p>
                <p className="text-xs text-muted-foreground">Ticket médio: R$ {metrics.avgTicket.toLocaleString('pt-BR')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Funnel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Funil de Vendas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {isEmpty || salesFunnelData.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Nenhum lead cadastrado
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={salesFunnelData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                    <YAxis 
                      dataKey="stage" 
                      type="category" 
                      width={100}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar 
                      dataKey="count" 
                      fill="hsl(var(--primary))"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Leads by Origin */}
        <Card>
          <CardHeader>
            <CardTitle>Leads por Origem</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {isEmpty || leadsByOriginData.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Nenhum lead cadastrado
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={leadsByOriginData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="count"
                      nameKey="origin"
                      label={({ origin, count }) => `${origin}: ${count}`}
                    >
                      {leadsByOriginData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Temperature Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuição por Temperatura</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center gap-4 p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <Snowflake className="h-8 w-8 text-blue-400" />
              <div>
                <p className="text-2xl font-bold">{temperatureCounts.cold}</p>
                <p className="text-sm text-muted-foreground">Leads Frios</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
              <ThermometerSun className="h-8 w-8 text-yellow-400" />
              <div>
                <p className="text-2xl font-bold">{temperatureCounts.warm}</p>
                <p className="text-sm text-muted-foreground">Leads Mornos</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-lg bg-red-500/10 border border-red-500/30">
              <Flame className="h-8 w-8 text-red-400" />
              <div>
                <p className="text-2xl font-bold">{temperatureCounts.hot}</p>
                <p className="text-sm text-muted-foreground">Leads Quentes</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
