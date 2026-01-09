import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate, Enums } from "@/integrations/supabase/types";
import { toast } from "sonner";

export type Demand = Tables<"demands">;
export type DemandInsert = TablesInsert<"demands">;
export type DemandUpdate = TablesUpdate<"demands">;
export type DemandStatus = Enums<"demand_status">;
export type Priority = Enums<"priority">;

export function useDemands() {
  return useQuery({
    queryKey: ["demands"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("demands")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Demand[];
    },
  });
}

export function useDemand(id: string | undefined) {
  return useQuery({
    queryKey: ["demands", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("demands")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Demand | null;
    },
    enabled: !!id,
  });
}

export function useCreateDemand() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (demand: DemandInsert) => {
      const { data, error } = await supabase
        .from("demands")
        .insert(demand)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["demands"] });
      toast.success("Demanda criada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao criar demanda: " + error.message);
    },
  });
}

export function useUpdateDemand() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: DemandUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("demands")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["demands"] });
      toast.success("Demanda atualizada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar demanda: " + error.message);
    },
  });
}

export function useDeleteDemand() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("demands")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["demands"] });
      toast.success("Demanda excluída com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir demanda: " + error.message);
    },
  });
}
