import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Lead } from "./useLeads";

export function useLeadsWithPendingActions() {
  return useQuery({
    queryKey: ["leads", "pending_actions"],
    queryFn: async () => {
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .not("next_action_date", "is", null)
        .lte("next_action_date", today.toISOString().split("T")[0])
        .not("status", "in", '("perdido","fechamento")')
        .eq("is_archived", false)
        .order("next_action_date", { ascending: true });
      
      if (error) throw error;
      return data as Lead[];
    },
  });
}

export function useOverdueLeads() {
  return useQuery({
    queryKey: ["leads", "overdue"],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .not("next_action_date", "is", null)
        .lt("next_action_date", today.toISOString().split("T")[0])
        .not("status", "in", '("perdido","fechamento")')
        .eq("is_archived", false)
        .order("next_action_date", { ascending: true });
      
      if (error) throw error;
      return data as Lead[];
    },
  });
}
