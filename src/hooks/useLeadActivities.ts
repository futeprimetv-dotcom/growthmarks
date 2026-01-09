import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface LeadActivity {
  id: string;
  lead_id: string;
  type: string;
  title: string;
  description: string | null;
  scheduled_at: string | null;
  completed_at: string | null;
  reminder_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeadActivityInsert {
  lead_id: string;
  type: string;
  title: string;
  description?: string | null;
  scheduled_at?: string | null;
  reminder_at?: string | null;
}

export function useLeadActivities(leadId: string | undefined) {
  return useQuery({
    queryKey: ["lead_activities", leadId],
    queryFn: async () => {
      if (!leadId) return [];
      const { data, error } = await supabase
        .from("lead_activities")
        .select("*")
        .eq("lead_id", leadId)
        .order("scheduled_at", { ascending: true, nullsFirst: false });
      
      if (error) throw error;
      return data as LeadActivity[];
    },
    enabled: !!leadId,
  });
}

export function useAllUpcomingActivities() {
  return useQuery({
    queryKey: ["lead_activities", "upcoming"],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data, error } = await supabase
        .from("lead_activities")
        .select("*, leads(name, company)")
        .gte("scheduled_at", today.toISOString())
        .is("completed_at", null)
        .order("scheduled_at", { ascending: true })
        .limit(20);
      
      if (error) throw error;
      return data as (LeadActivity & { leads: { name: string; company: string | null } })[];
    },
  });
}

export function useOverdueActivities() {
  return useQuery({
    queryKey: ["lead_activities", "overdue"],
    queryFn: async () => {
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from("lead_activities")
        .select("*, leads(name, company)")
        .lt("scheduled_at", now)
        .is("completed_at", null)
        .order("scheduled_at", { ascending: true });
      
      if (error) throw error;
      return data as (LeadActivity & { leads: { name: string; company: string | null } })[];
    },
  });
}

export function useCreateLeadActivity() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (activity: LeadActivityInsert) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("lead_activities")
        .insert({
          ...activity,
          created_by: user?.id || null,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["lead_activities", variables.lead_id] });
      queryClient.invalidateQueries({ queryKey: ["lead_activities", "upcoming"] });
      queryClient.invalidateQueries({ queryKey: ["lead_activities", "overdue"] });
      toast.success("Atividade criada com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao criar atividade: " + error.message);
    },
  });
}

export function useCompleteLeadActivity() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, leadId }: { id: string; leadId: string }) => {
      const { data, error } = await supabase
        .from("lead_activities")
        .update({ completed_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["lead_activities", variables.leadId] });
      queryClient.invalidateQueries({ queryKey: ["lead_activities", "upcoming"] });
      queryClient.invalidateQueries({ queryKey: ["lead_activities", "overdue"] });
      toast.success("Atividade concluída");
    },
    onError: (error) => {
      toast.error("Erro ao concluir atividade: " + error.message);
    },
  });
}

export function useDeleteLeadActivity() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, leadId }: { id: string; leadId: string }) => {
      const { error } = await supabase
        .from("lead_activities")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["lead_activities", variables.leadId] });
      queryClient.invalidateQueries({ queryKey: ["lead_activities", "upcoming"] });
      queryClient.invalidateQueries({ queryKey: ["lead_activities", "overdue"] });
      toast.success("Atividade removida");
    },
    onError: (error) => {
      toast.error("Erro ao remover atividade: " + error.message);
    },
  });
}
