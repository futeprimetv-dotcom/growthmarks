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

export interface CRMSettingsData {
  lead_origins?: string[];
  service_interests?: string[];
  pipeline_statuses?: { value: string; label: string }[];
  lead_score_weights?: {
    temperature: number;
    estimated_value: number;
    urgency: number;
    closing_probability: number;
    invests_in_marketing: number;
  };
}

const DEFAULT_SETTINGS: CRMSettingsData = {
  lead_origins: ['instagram', 'whatsapp', 'site', 'indicacao', 'trafego_pago', 'prospeccao', 'outro'],
  service_interests: ['Gestão de Tráfego', 'Social Media', 'Site/Landing Page', 'Branding', 'CRM/Automação'],
  lead_score_weights: {
    temperature: 30,
    estimated_value: 25,
    urgency: 20,
    closing_probability: 15,
    invests_in_marketing: 10,
  },
};

export function useCRMSettings() {
  return useQuery({
    queryKey: ["crm_settings"],
    queryFn: async (): Promise<CRMSettingsData> => {
      const { data, error } = await supabase
        .from("crm_settings")
        .select("*");
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        return DEFAULT_SETTINGS;
      }
      
      const settings: CRMSettingsData = { ...DEFAULT_SETTINGS };
      
      data.forEach((row: CRMSetting) => {
        const key = row.setting_key as keyof CRMSettingsData;
        if (key in settings) {
          try {
            settings[key] = typeof row.setting_value === 'string' 
              ? JSON.parse(row.setting_value) 
              : row.setting_value;
          } catch {
            settings[key] = row.setting_value;
          }
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

export function useUpdateCRMSettings() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (updates: Partial<CRMSettingsData>) => {
      const promises = Object.entries(updates).map(async ([key, value]) => {
        const { data: existing } = await supabase
          .from("crm_settings")
          .select("id")
          .eq("setting_key", key)
          .maybeSingle();
        
        if (existing) {
          return supabase
            .from("crm_settings")
            .update({ setting_value: value as any })
            .eq("setting_key", key);
        } else {
          return supabase
            .from("crm_settings")
            .insert({ setting_key: key, setting_value: value as any });
        }
      });
      
      const results = await Promise.all(promises);
      const errors = results.filter(r => r.error);
      if (errors.length > 0) throw errors[0].error;
      
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm_settings"] });
    },
    onError: (error) => {
      toast.error("Erro ao salvar configurações: " + error.message);
    },
  });
}
