import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Bell,
  Mail,
  Clock,
  Download,
  FileJson,
  FileSpreadsheet,
  Activity,
  ChevronDown,
  ChevronUp,
  Save,
  Loader2,
  Users,
  Target,
  Kanban,
  FileText,
  DollarSign,
  TrendingUp,
  UserCircle,
  CalendarDays,
  AlertCircle,
  CheckCircle,
  Edit,
  Trash2,
  Plus,
  Eye,
} from "lucide-react";
import { useNotificationSettings } from "@/hooks/useNotificationSettings";
import { useActivityLogs, ActivityLog } from "@/hooks/useActivityLogs";
import { useDataExport } from "@/hooks/useDataExport";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const actionTypeLabels: Record<string, { label: string; color: string; icon: typeof Plus }> = {
  create: { label: 'Criação', color: 'bg-green-500/20 text-green-500', icon: Plus },
  update: { label: 'Atualização', color: 'bg-blue-500/20 text-blue-500', icon: Edit },
  delete: { label: 'Exclusão', color: 'bg-red-500/20 text-red-500', icon: Trash2 },
  archive: { label: 'Arquivamento', color: 'bg-orange-500/20 text-orange-500', icon: FileText },
  restore: { label: 'Restauração', color: 'bg-purple-500/20 text-purple-500', icon: CheckCircle },
  view: { label: 'Visualização', color: 'bg-gray-500/20 text-gray-500', icon: Eye },
  login: { label: 'Login', color: 'bg-teal-500/20 text-teal-500', icon: UserCircle },
  export: { label: 'Exportação', color: 'bg-indigo-500/20 text-indigo-500', icon: Download },
};

const entityTypeIcons: Record<string, typeof Users> = {
  client: Users,
  lead: Target,
  demand: Kanban,
  contract: FileText,
  expense: DollarSign,
  receivable: DollarSign,
  payable: DollarSign,
  goal: TrendingUp,
  team_member: UserCircle,
  planning: CalendarDays,
};

type ExportEntity = 'clients' | 'leads' | 'demands' | 'contracts' | 'expenses' | 'receivables' | 'payables' | 'team_members' | 'goals';

export function AdvancedSettingsSection() {
  const { settings, isLoading: settingsLoading, updateSettings } = useNotificationSettings();
  const { logs, isLoading: logsLoading } = useActivityLogs(50);
  const { isExporting, exportProgress, exportEntity, exportAll, entityLabels } = useDataExport();

  const [notificationsOpen, setNotificationsOpen] = useState(true);
  const [logsOpen, setLogsOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<Record<string, boolean>>({});
  const [userFilter, setUserFilter] = useState<string>("all");

  // Get unique users from logs
  const uniqueUsers = useMemo(() => {
    const userMap = new Map<string, { id: string; email: string }>();
    logs.forEach(log => {
      if (log.user_id && log.user_email && !userMap.has(log.user_id)) {
        userMap.set(log.user_id, { id: log.user_id, email: log.user_email });
      }
    });
    return Array.from(userMap.values());
  }, [logs]);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    if (userFilter === "all") return logs;
    return logs.filter(log => log.user_id === userFilter);
  }, [logs, userFilter]);

  const handleToggle = (key: string, value: boolean) => {
    setPendingChanges(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveNotifications = () => {
    updateSettings.mutate(pendingChanges);
    setPendingChanges({});
  };

  const hasPendingChanges = Object.keys(pendingChanges).length > 0;

  const getSettingValue = (key: string) => {
    if (key in pendingChanges) return pendingChanges[key];
    return settings[key as keyof typeof settings];
  };

  return (
    <div className="space-y-4">
      {/* Notifications Section */}
      <Card className="overflow-hidden">
        <Collapsible open={notificationsOpen} onOpenChange={setNotificationsOpen}>
          <CollapsibleTrigger asChild>
            <div className="p-6 flex items-center justify-between cursor-pointer hover:bg-secondary/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Bell className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Notificações por E-mail</h3>
                  <p className="text-sm text-muted-foreground">Configure alertas e lembretes automáticos</p>
                </div>
              </div>
              {notificationsOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </div>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <Separator />
            <div className="p-6 space-y-6">
              {settingsLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <>
                  <div className="grid gap-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                      <div className="flex items-center gap-3">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Lembretes de Prazo</p>
                          <p className="text-sm text-muted-foreground">Receba alertas de demandas próximas do prazo</p>
                        </div>
                      </div>
                      <Switch 
                        checked={getSettingValue('deadline_reminders') as boolean}
                        onCheckedChange={(v) => handleToggle('deadline_reminders', v)}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                      <div className="flex items-center gap-3">
                        <Target className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Alertas de Leads Quentes</p>
                          <p className="text-sm text-muted-foreground">Notificação quando um lead fica "quente"</p>
                        </div>
                      </div>
                      <Switch 
                        checked={getSettingValue('hot_lead_alerts') as boolean}
                        onCheckedChange={(v) => handleToggle('hot_lead_alerts', v)}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                      <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Resumo Diário</p>
                          <p className="text-sm text-muted-foreground">Receba um resumo das atividades do dia</p>
                        </div>
                      </div>
                      <Switch 
                        checked={getSettingValue('daily_summary') as boolean}
                        onCheckedChange={(v) => handleToggle('daily_summary', v)}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                      <div className="flex items-center gap-3">
                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Relatório Semanal</p>
                          <p className="text-sm text-muted-foreground">Relatório completo toda segunda-feira</p>
                        </div>
                      </div>
                      <Switch 
                        checked={getSettingValue('weekly_report') as boolean}
                        onCheckedChange={(v) => handleToggle('weekly_report', v)}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Vencimento de Contratos</p>
                          <p className="text-sm text-muted-foreground">Alerta 30 dias antes do vencimento</p>
                        </div>
                      </div>
                      <Switch 
                        checked={getSettingValue('contract_expiry_alerts') as boolean}
                        onCheckedChange={(v) => handleToggle('contract_expiry_alerts', v)}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                      <div className="flex items-center gap-3">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Lembretes de Pagamento</p>
                          <p className="text-sm text-muted-foreground">Alertas de contas a pagar/receber</p>
                        </div>
                      </div>
                      <Switch 
                        checked={getSettingValue('payment_reminders') as boolean}
                        onCheckedChange={(v) => handleToggle('payment_reminders', v)}
                      />
                    </div>
                  </div>

                  {hasPendingChanges && (
                    <div className="flex justify-end pt-2">
                      <Button onClick={handleSaveNotifications} disabled={updateSettings.isPending}>
                        {updateSettings.isPending ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Salvar Configurações
                      </Button>
                    </div>
                  )}

                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5" />
                      <p className="text-sm text-amber-700 dark:text-amber-400">
                        Para ativar notificações por e-mail, configure o Resend no painel de integrações.
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Activity Logs Section */}
      <Card className="overflow-hidden">
        <Collapsible open={logsOpen} onOpenChange={setLogsOpen}>
          <CollapsibleTrigger asChild>
            <div className="p-6 flex items-center justify-between cursor-pointer hover:bg-secondary/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Activity className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Logs de Atividade</h3>
                  <p className="text-sm text-muted-foreground">Histórico de ações no sistema</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary">{filteredLogs.length} registros</Badge>
                {logsOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            </div>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <Separator />
            <div className="p-6 space-y-4">
              {/* User Filter */}
              <div className="flex items-center gap-4">
                <Select value={userFilter} onValueChange={setUserFilter}>
                  <SelectTrigger className="w-[220px]">
                    <SelectValue placeholder="Filtrar por usuário" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os usuários</SelectItem>
                    {uniqueUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {logsLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma atividade registrada ainda</p>
                  <p className="text-sm">As ações realizadas no sistema aparecerão aqui</p>
                </div>
              ) : (
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-3">
                    {filteredLogs.map((log) => {
                      const actionInfo = actionTypeLabels[log.action_type] || { label: log.action_type, color: 'bg-gray-500/20 text-gray-500', icon: Activity };
                      const EntityIcon = entityTypeIcons[log.entity_type] || FileText;
                      const ActionIcon = actionInfo.icon;

                      return (
                        <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30">
                          <div className={`p-2 rounded-lg ${actionInfo.color}`}>
                            <ActionIcon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className="text-xs">
                                <EntityIcon className="h-3 w-3 mr-1" />
                                {log.entity_type}
                              </Badge>
                              <Badge className={actionInfo.color}>{actionInfo.label}</Badge>
                            </div>
                            <p className="text-sm mt-1">
                              {log.entity_name || log.description || 'Ação realizada'}
                            </p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <span>{log.user_email || 'Usuário'}</span>
                              <span>•</span>
                              <span>{format(new Date(log.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Backup/Export Section */}
      <Card className="overflow-hidden">
        <Collapsible open={exportOpen} onOpenChange={setExportOpen}>
          <CollapsibleTrigger asChild>
            <div className="p-6 flex items-center justify-between cursor-pointer hover:bg-secondary/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Download className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Backup e Exportação</h3>
                  <p className="text-sm text-muted-foreground">Exporte seus dados em CSV ou JSON</p>
                </div>
              </div>
              {exportOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </div>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <Separator />
            <div className="p-6 space-y-6">
              {isExporting && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Exportando...</span>
                    <span>{exportProgress}%</span>
                  </div>
                  <Progress value={exportProgress} />
                </div>
              )}

              <div>
                <Label className="text-base font-medium">Backup Completo</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Exporte todos os dados do sistema em um único arquivo
                </p>
                <Button onClick={() => exportAll('json')} disabled={isExporting}>
                  <FileJson className="h-4 w-4 mr-2" />
                  Exportar Backup Completo (JSON)
                </Button>
              </div>

              <Separator />

              <div>
                <Label className="text-base font-medium">Exportação Individual</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Exporte dados específicos por entidade
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(Object.entries(entityLabels) as [ExportEntity, string][]).map(([key, label]) => (
                    <Button 
                      key={key}
                      variant="outline" 
                      size="sm"
                      onClick={() => exportEntity(key, 'csv')}
                      disabled={isExporting}
                    >
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      {label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5" />
                  <div className="text-sm text-blue-700 dark:text-blue-400">
                    <p className="font-medium">Sobre os backups</p>
                    <p>Os arquivos são gerados instantaneamente e baixados para seu dispositivo. Recomendamos fazer backup regularmente.</p>
                  </div>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </div>
  );
}
