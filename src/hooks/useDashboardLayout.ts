import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface DashboardLayout {
  id: string;
  user_id: string;
  layout: any[];
  visible_widgets: string[];
  created_at: string;
  updated_at: string;
}

const defaultWidgets = ['stats', 'urgentDemands', 'todayDeadlines', 'weeklyChart', 'revenueChart'];

export function useDashboardLayout() {
  return useQuery({
    queryKey: ["dashboard_layout"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { layout: [], visible_widgets: defaultWidgets };
      
      const { data, error } = await supabase
        .from("dashboard_layouts")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (error) throw error;
      
      return data || { layout: [], visible_widgets: defaultWidgets };
    },
  });
}

export function useUpdateDashboardLayout() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ layout, visible_widgets }: { layout?: any[]; visible_widgets?: string[] }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");
      
      const { data, error } = await supabase
        .from("dashboard_layouts")
        .upsert({
          user_id: user.id,
          ...(layout !== undefined && { layout }),
          ...(visible_widgets !== undefined && { visible_widgets }),
        }, { onConflict: 'user_id' })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard_layout"] });
    },
    onError: (error) => {
      toast.error("Erro ao salvar layout: " + error.message);
    },
  });
}
