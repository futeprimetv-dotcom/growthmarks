import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CRMSetting {
  id: string;
  setting_key: string;
  setting_value: any;
  created_at: string;
  updated_at: string;
}

export function useCRMSettings() {
  return useQuery({
    queryKey: ["crm_settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_settings")
        .select("*");
      
      if (error) throw error;
      
      // Convert to a more usable format
      const settings: Record<string, any> = {};
      data?.forEach((s: CRMSetting) => {
        try {
          settings[s.setting_key] = typeof s.setting_value === 'string' 
            ? JSON.parse(s.setting_value) 
            : s.setting_value;
        } catch {
          settings[s.setting_key] = s.setting_value;
        }
      });
      
      return settings;
    },
  });
}

export function useUpdateCRMSetting() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      const { data, error } = await supabase
        .from("crm_settings")
        .upsert({
          setting_key: key,
          setting_value: JSON.stringify(value),
        }, { onConflict: 'setting_key' })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm_settings"] });
      toast.success("Configuração salva!");
    },
    onError: (error) => {
      toast.error("Erro ao salvar configuração: " + error.message);
    },
  });
}
