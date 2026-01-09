import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { toast } from "sonner";

export type Lead = Tables<"leads">;
export type LeadInsert = TablesInsert<"leads">;
export type LeadUpdate = TablesUpdate<"leads">;

export function useLeads() {
  return useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Lead[];
    },
  });
}

export function useLead(id: string | undefined) {
  return useQuery({
    queryKey: ["leads", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Lead | null;
    },
    enabled: !!id,
  });
}

export function useCreateLead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (lead: LeadInsert) => {
      const { data, error } = await supabase
        .from("leads")
        .insert(lead)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Lead criado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao criar lead: " + error.message);
    },
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: LeadUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("leads")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Lead atualizado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar lead: " + error.message);
    },
  });
}

export function useDeleteLead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("leads")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Lead excluído com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir lead: " + error.message);
    },
  });
}
