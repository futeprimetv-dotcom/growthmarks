import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Users,
  Activity,
  Clock,
  UserCircle,
  Wifi,
  WifiOff,
  RefreshCw,
  Timer,
} from "lucide-react";
import { useUserSessions, useTrackUserSession } from "@/hooks/useUserSessions";
import { useActivityLogs } from "@/hooks/useActivityLogs";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function SupervisaoContent() {
  const { sessions, isLoading: sessionsLoading, refetch: refetchSessions } = useUserSessions();
  const { logs, isLoading: logsLoading } = useActivityLogs(100);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [userFilter, setUserFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Track current user session
  useTrackUserSession();

  // Get unique users from sessions and logs
  const uniqueUsers = useMemo(() => {
    const userMap = new Map<string, { id: string; email: string; name: string }>();
    
    sessions.forEach(session => {
      if (session.user_id && session.user_email) {
        userMap.set(session.user_id, {
          id: session.user_id,
          email: session.user_email,
          name: session.user_name || session.user_email,
        });
      }
    });

    logs.forEach(log => {
      if (log.user_id && log.user_email && !userMap.has(log.user_id)) {
        userMap.set(log.user_id, {
          id: log.user_id,
          email: log.user_email,
          name: log.user_email,
        });
      }
    });

    return Array.from(userMap.values());
  }, [sessions, logs]);

  // Filtered sessions
  const filteredSessions = useMemo(() => {
    return sessions.filter(session => {
      const matchesSearch = !searchTerm || 
        session.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.user_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || 
        (statusFilter === "online" && session.is_online) ||
        (statusFilter === "offline" && !session.is_online);

      return matchesSearch && matchesStatus;
    });
  }, [sessions, searchTerm, statusFilter]);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = !searchTerm || 
        log.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.entity_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesUser = userFilter === "all" || log.user_id === userFilter;

      return matchesSearch && matchesUser;
    });
  }, [logs, searchTerm, userFilter]);

  // Stats
  const stats = useMemo(() => {
    const online = sessions.filter(s => s.is_online).length;
    const offline = sessions.filter(s => !s.is_online).length;
    const totalTimeOnline = sessions.reduce((acc, s) => acc + (s.total_time_online_minutes || 0), 0);

    return { online, offline, total: sessions.length, totalTimeOnline };
  }, [sessions]);

  const formatMinutes = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}min`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <Button variant="outline" onClick={() => refetchSessions()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Wifi className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.online}</p>
              <p className="text-sm text-muted-foreground">Online agora</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gray-500/10">
              <WifiOff className="h-5 w-5 text-gray-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.offline}</p>
              <p className="text-sm text-muted-foreground">Offline</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Users className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total de usuários</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Timer className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatMinutes(stats.totalTimeOnline)}</p>
              <p className="text-sm text-muted-foreground">Tempo total online</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar usuário..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="online">Online</SelectItem>
            <SelectItem value="offline">Offline</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* User Sessions Table */}
      <Card>
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Sessões de Usuários</h2>
          </div>
        </div>
        
        {sessionsLoading ? (
          <div className="p-8">
            <Skeleton className="h-64 w-full" />
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma sessão encontrada</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Última Atividade</TableHead>
                <TableHead>Último Login</TableHead>
                <TableHead>Tempo Online Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                          <UserCircle className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background ${
                          session.is_online ? 'bg-green-500' : 'bg-gray-400'
                        }`} />
                      </div>
                      <div>
                        <p className="font-medium">{session.user_name || 'Sem nome'}</p>
                        <p className="text-sm text-muted-foreground">{session.user_email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={session.is_online ? "default" : "secondary"} className={
                      session.is_online ? 'bg-green-500/20 text-green-500' : ''
                    }>
                      {session.is_online ? (
                        <>
                          <Wifi className="h-3 w-3 mr-1" />
                          Online
                        </>
                      ) : (
                        <>
                          <WifiOff className="h-3 w-3 mr-1" />
                          Offline
                        </>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm">
                        {formatDistanceToNow(new Date(session.last_activity_at), { 
                          addSuffix: true, 
                          locale: ptBR 
                        })}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(session.last_activity_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm">
                        {formatDistanceToNow(new Date(session.last_login_at), { 
                          addSuffix: true, 
                          locale: ptBR 
                        })}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(session.last_login_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{formatMinutes(session.total_time_online_minutes || 0)}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Activity Logs with User Filter */}
      <Card>
        <div className="p-4 border-b">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">Logs de Atividade</h2>
              <Badge variant="secondary">{filteredLogs.length} registros</Badge>
            </div>
            <Select value={userFilter} onValueChange={setUserFilter}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Filtrar por usuário" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os usuários</SelectItem>
                {uniqueUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {logsLoading ? (
          <div className="p-8">
            <Skeleton className="h-64 w-full" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma atividade registrada</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Entidade</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Data/Hora</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <span className="text-sm">{log.user_email || 'Sistema'}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{log.action_type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{log.entity_type}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground truncate max-w-[200px] block">
                        {log.entity_name || log.description || '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {format(new Date(log.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </Card>
    </div>
  );
}
