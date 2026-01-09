import { useAuth } from "@/contexts/AuthContext";
import { useUserApprovalStatus } from "@/hooks/useUserApproval";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, LogOut, Mail } from "lucide-react";

export function PendingApprovalScreen() {
  const { user, signOut } = useAuth();
  const { data: isApproved, isLoading } = useUserApprovalStatus(user?.id);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Verificando acesso...</div>
      </div>
    );
  }

  if (isApproved) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-orange-500/20 flex items-center justify-center">
            <Clock className="h-8 w-8 text-orange-500" />
          </div>
          <CardTitle className="text-2xl">Aguardando Aprovação</CardTitle>
          <CardDescription>
            Seu cadastro foi recebido e está sendo analisado
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg bg-muted p-4 text-center">
            <p className="text-sm text-muted-foreground mb-2">Você está logado como:</p>
            <div className="flex items-center justify-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{user?.email}</span>
            </div>
          </div>

          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              Um administrador precisa aprovar seu acesso ao sistema. Você receberá
              acesso assim que sua solicitação for aprovada.
            </p>
            <p>
              Se você acredita que isso é um erro, entre em contato com o
              administrador do sistema.
            </p>
          </div>

          <Button variant="outline" className="w-full" onClick={signOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sair e tentar com outra conta
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
