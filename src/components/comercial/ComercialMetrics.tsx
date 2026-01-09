import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { leads, salesFunnelData, leadsByOriginData, getTotalPipelineValue, getConversionRate } from "@/data/mockData";
import { Target, TrendingUp, DollarSign, Users, Flame, ThermometerSun, Snowflake } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Funnel, FunnelChart, LabelList } from "recharts";

const FUNNEL_COLORS = ['#3b82f6', '#eab308', '#f97316', '#a855f7', '#22c55e'];

export function ComercialMetrics() {
  const totalLeads = leads.length;
  const activeLeads = leads.filter(l => l.status !== 'fechado' && l.status !== 'perdido').length;
  const hotLeads = leads.filter(l => l.temperature === 'quente' && l.status !== 'fechado' && l.status !== 'perdido').length;
  const pipelineValue = getTotalPipelineValue();
  const conversionRate = getConversionRate();
  const avgTicket = leads.filter(l => l.status === 'fechado').reduce((acc, l) => acc + l.estimatedValue, 0) / leads.filter(l => l.status === 'fechado').length || 0;

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
                <p className="text-2xl font-bold">{totalLeads}</p>
                <p className="text-xs text-muted-foreground">{activeLeads} ativos</p>
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
                <p className="text-2xl font-bold">{hotLeads}</p>
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
                <p className="text-2xl font-bold">R$ {pipelineValue.toLocaleString('pt-BR')}</p>
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
                <p className="text-2xl font-bold">{conversionRate.toFixed(0)}%</p>
                <p className="text-xs text-muted-foreground">Ticket médio: R$ {avgTicket.toLocaleString('pt-BR')}</p>
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
                <p className="text-2xl font-bold">{leads.filter(l => l.temperature === 'frio').length}</p>
                <p className="text-sm text-muted-foreground">Leads Frios</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
              <ThermometerSun className="h-8 w-8 text-yellow-400" />
              <div>
                <p className="text-2xl font-bold">{leads.filter(l => l.temperature === 'morno').length}</p>
                <p className="text-sm text-muted-foreground">Leads Mornos</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-lg bg-red-500/10 border border-red-500/30">
              <Flame className="h-8 w-8 text-red-400" />
              <div>
                <p className="text-2xl font-bold">{leads.filter(l => l.temperature === 'quente').length}</p>
                <p className="text-sm text-muted-foreground">Leads Quentes</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
