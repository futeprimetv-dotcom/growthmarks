import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PlanningView } from "@/components/planejamentos/PlanningView";
import logo from "@/assets/logo-growth-marks.png";
import { CalendarDays, AlertCircle, Loader2 } from "lucide-react";

export default function PlanejamentoPublico() {
  const { token } = useParams<{ token: string }>();
  
  const { data: planning, isLoading } = useQuery({
    queryKey: ["public-planning", token],
    queryFn: async () => {
      if (!token) return null;
      
      const { data, error } = await supabase
        .from("plannings")
        .select("*, clients(name)")
        .eq("share_token", token)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!token,
  });

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Loader2 className="h-16 w-16 mx-auto text-primary animate-spin" />
          <p className="text-muted-foreground">Carregando planejamento...</p>
        </div>
      </div>
    );
  }

  if (!planning) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <AlertCircle className="h-16 w-16 mx-auto text-destructive" />
          <h1 className="text-2xl font-bold">Planejamento não encontrado</h1>
          <p className="text-muted-foreground">
            O link que você acessou pode estar incorreto ou expirado.
          </p>
        </div>
      </div>
    );
  }

  const clientName = (planning as any).clients?.name || "Cliente";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <img src={logo} alt="Growth Marks" className="h-10" />
          <div className="flex items-center gap-2 text-muted-foreground">
            <CalendarDays className="h-5 w-5" />
            <span className="font-medium">
              {monthNames[planning.month - 1]} {planning.year}
            </span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Planejamento de Conteúdo</h1>
          <p className="text-xl text-muted-foreground">{clientName}</p>
        </div>

        <PlanningView 
          planning={{
            id: planning.id,
            client_id: planning.client_id,
            month: planning.month,
            year: planning.year,
            status: planning.status,
            objectives: planning.objectives,
            observations: planning.observations,
            drive_link: planning.drive_link,
            share_token: planning.share_token,
          }} 
          isPublic 
        />
      </main>

      {/* Footer */}
      <footer className="border-t bg-card mt-12">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>Desenvolvido por <strong>Growth Marks</strong></p>
          <p>Agência de Marketing Digital</p>
        </div>
      </footer>
    </div>
  );
}