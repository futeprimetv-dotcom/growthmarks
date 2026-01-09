import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface LeadHistoryEntry {
  id: string;
  lead_id: string;
  action_type: string;
  description: string | null;
  contact_channel: string | null;
  created_by: string | null;
  created_at: string;
}

export function useLeadHistory(leadId: string | undefined) {
  return useQuery({
    queryKey: ["lead_history", leadId],
    queryFn: async () => {
      if (!leadId) return [];
      const { data, error } = await supabase
        .from("lead_history")
        .select("*")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as LeadHistoryEntry[];
    },
    enabled: !!leadId,
  });
}

export function useCreateLeadHistory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (entry: {
      lead_id: string;
      action_type: string;
      description?: string;
      contact_channel?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("lead_history")
        .insert({
          ...entry,
          created_by: user?.id || null,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["lead_history", variables.lead_id] });
    },
    onError: (error) => {
      toast.error("Erro ao registrar histórico: " + error.message);
    },
  });
}
