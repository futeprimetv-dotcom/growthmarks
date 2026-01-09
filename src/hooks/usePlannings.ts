import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { toast } from "sonner";

export type Planning = Tables<"plannings"> & {
  drive_link?: string | null;
  is_archived?: boolean;
};
export type PlanningInsert = TablesInsert<"plannings">;
export type PlanningUpdate = TablesUpdate<"plannings">;

export type PlanningContent = Tables<"planning_contents"> & {
  send_to_production?: boolean;
  demand_id?: string | null;
};
export type PlanningContentInsert = TablesInsert<"planning_contents">;
export type PlanningContentUpdate = TablesUpdate<"planning_contents">;

export type PlanningCampaign = Tables<"planning_campaigns">;
export type PlanningCampaignInsert = TablesInsert<"planning_campaigns">;

export function usePlannings() {
  return useQuery({
    queryKey: ["plannings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plannings")
        .select("*")
        .order("year", { ascending: false })
        .order("month", { ascending: false });
      
      if (error) throw error;
      return data as Planning[];
    },
  });
}

export function usePlanning(id: string | undefined) {
  return useQuery({
    queryKey: ["plannings", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("plannings")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Planning | null;
    },
    enabled: !!id,
  });
}

export function usePlanningContents(planningId: string | undefined) {
  return useQuery({
    queryKey: ["planning-contents", planningId],
    queryFn: async () => {
      if (!planningId) return [];
      const { data, error } = await supabase
        .from("planning_contents")
        .select("*")
        .eq("planning_id", planningId)
        .order("scheduled_date", { ascending: true });
      
      if (error) throw error;
      return data as PlanningContent[];
    },
    enabled: !!planningId,
  });
}

export function usePlanningCampaigns(planningId: string | undefined) {
  return useQuery({
    queryKey: ["planning-campaigns", planningId],
    queryFn: async () => {
      if (!planningId) return [];
      const { data, error } = await supabase
        .from("planning_campaigns")
        .select("*")
        .eq("planning_id", planningId)
        .order("start_date", { ascending: true });
      
      if (error) throw error;
      return data as PlanningCampaign[];
    },
    enabled: !!planningId,
  });
}

export function useCreatePlanning() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (planning: PlanningInsert) => {
      const { data, error } = await supabase
        .from("plannings")
        .insert(planning)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plannings"] });
      toast.success("Planejamento criado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao criar planejamento: " + error.message);
    },
  });
}

export function useUpdatePlanning() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: PlanningUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("plannings")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plannings"] });
      toast.success("Planejamento atualizado!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar planejamento: " + error.message);
    },
  });
}

export function useCreatePlanningContent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (content: PlanningContentInsert) => {
      const { data, error } = await supabase
        .from("planning_contents")
        .insert(content)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["planning-contents", variables.planning_id] });
      toast.success("Conteúdo adicionado!");
    },
    onError: (error) => {
      toast.error("Erro ao criar conteúdo: " + error.message);
    },
  });
}

export function useUpdatePlanningContent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, planning_id, ...updates }: PlanningContentUpdate & { id: string; planning_id: string }) => {
      const { data, error } = await supabase
        .from("planning_contents")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return { ...data, planning_id };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["planning-contents", data.planning_id] });
    },
    onError: (error) => {
      toast.error("Erro ao atualizar conteúdo: " + error.message);
    },
  });
}

export function useDeletePlanningContent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, planning_id }: { id: string; planning_id: string }) => {
      const { error } = await supabase
        .from("planning_contents")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      return { planning_id };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["planning-contents", data.planning_id] });
      toast.success("Conteúdo removido!");
    },
    onError: (error) => {
      toast.error("Erro ao remover conteúdo: " + error.message);
    },
  });
}

export function usePlanningsByClient(clientId: string | undefined) {
  return useQuery({
    queryKey: ["plannings", "client", clientId],
    queryFn: async () => {
      if (!clientId) return [];
      const { data, error } = await supabase
        .from("plannings")
        .select("*")
        .eq("client_id", clientId)
        .order("year", { ascending: false })
        .order("month", { ascending: false });
      
      if (error) throw error;
      return data as Planning[];
    },
    enabled: !!clientId,
  });
}
