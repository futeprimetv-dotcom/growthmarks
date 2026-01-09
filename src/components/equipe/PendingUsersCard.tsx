import { useState } from "react";
import { usePendingUsers, useApproveUser, useRejectUser } from "@/hooks/useUserApproval";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { UserPlus, UserX, Clock, Shield, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Database } from "@/integrations/supabase/types";

type RoleType = Database["public"]["Enums"]["user_role_type"];

const roleOptions = [
  { value: "gestao", label: "Gestão", description: "Acesso total ao sistema" },
  { value: "vendedor", label: "Vendedor", description: "Comercial, CRM e clientes" },
  { value: "producao", label: "Produção", description: "Kanban e planejamentos" },
  { value: "cliente", label: "Cliente", description: "Visualização limitada" },
];

const cargoOptions = [
  "Gestor(a)",
  "Coordenador(a)",
  "Analista",
  "Assistente",
  "Designer",
  "Social Media",
  "Redator(a)",
  "Desenvolvedor(a)",
  "Estagiário(a)",
];

export function PendingUsersCard() {
  const { data: pendingUsers, isLoading } = usePendingUsers();
  const approveUser = useApproveUser();
  const rejectUser = useRejectUser();

  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("Colaborador(a)");
  const [selectedRoleType, setSelectedRoleType] = useState<RoleType>("producao");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [userToReject, setUserToReject] = useState<string | null>(null);

  const handleApprove = async (userId: string) => {
    await approveUser.mutateAsync({
      teamMemberId: userId,
      role: selectedRole,
      roleType: selectedRoleType,
    });
    setSelectedUser(null);
  };

  const handleReject = async () => {
    if (userToReject) {
      await rejectUser.mutateAsync(userToReject);
      setShowRejectDialog(false);
      setUserToReject(null);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Aprovações Pendentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!pendingUsers || pendingUsers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Aprovações Pendentes
          </CardTitle>
          <CardDescription>Novos usuários aguardando aprovação</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <UserPlus className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">Nenhum usuário pendente</p>
            <p className="text-sm text-muted-foreground/70">
              Novos cadastros aparecerão aqui para aprovação
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-orange-500/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-500" />
                Aprovações Pendentes
                <Badge variant="destructive" className="ml-2">
                  {pendingUsers.length}
                </Badge>
              </CardTitle>
              <CardDescription>
                Novos usuários aguardando aprovação para acessar o sistema
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {pendingUsers.map((user) => (
            <div
              key={user.id}
              className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-orange-500/20 text-orange-600">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium truncate">{user.name}</h4>
                  <Badge variant="outline" className="text-orange-600 border-orange-500/30">
                    Pendente
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Cadastrou-se{" "}
                  {formatDistanceToNow(new Date(user.created_at), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </p>

                {selectedUser === user.id && (
                  <div className="mt-4 space-y-3 p-3 bg-muted/50 rounded-lg">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="text-xs font-medium mb-1.5 block">Cargo</label>
                        <Select value={selectedRole} onValueChange={setSelectedRole}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {cargoOptions.map((cargo) => (
                              <SelectItem key={cargo} value={cargo}>
                                {cargo}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs font-medium mb-1.5 block">Nível de Acesso</label>
                        <Select
                          value={selectedRoleType}
                          onValueChange={(v) => setSelectedRoleType(v as RoleType)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {roleOptions.map((role) => (
                              <SelectItem key={role.value} value={role.value}>
                                <div className="flex items-center gap-2">
                                  <Shield className="h-3 w-3" />
                                  <span>{role.label}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {roleOptions.find((r) => r.value === selectedRoleType)?.description}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                {selectedUser === user.id ? (
                  <>
                    <Button
                      size="sm"
                      onClick={() => handleApprove(user.id)}
                      disabled={approveUser.isPending}
                    >
                      {approveUser.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Confirmar"
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedUser(null)}
                    >
                      Cancelar
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => setSelectedUser(user.id)}
                    >
                      <UserPlus className="h-4 w-4 mr-1" />
                      Aprovar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        setUserToReject(user.id);
                        setShowRejectDialog(true);
                      }}
                    >
                      <UserX className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rejeitar usuário?</AlertDialogTitle>
            <AlertDialogDescription>
              Este usuário será removido e não poderá acessar o sistema. Ele precisará
              se cadastrar novamente para solicitar acesso.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {rejectUser.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Rejeitar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
