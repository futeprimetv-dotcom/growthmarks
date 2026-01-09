import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface LossReason {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useLossReasons() {
  return useQuery({
    queryKey: ["lead_loss_reasons"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_loss_reasons")
        .select("*")
        .eq("is_active", true)
        .order("name", { ascending: true });
      
      if (error) throw error;
      return data as LossReason[];
    },
  });
}
