import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DEFAULT_ICP, type ICPConfig } from "@/config/icp";

// Re-export from centralized config
export { DEFAULT_ICP, type ICPConfig } from "@/config/icp";

export function useICPSettings() {
  return useQuery({
    queryKey: ["icp-settings"],
    queryFn: async (): Promise<ICPConfig> => {
      const { data, error } = await supabase
        .from("crm_settings")
        .select("setting_value")
        .eq("setting_key", "icp_config")
        .maybeSingle();

      if (error) {
        console.error("Error fetching ICP settings:", error);
        return DEFAULT_ICP;
      }

      if (!data) {
        return DEFAULT_ICP;
      }

      try {
        const config = data.setting_value as unknown as ICPConfig;
        return {
          ...DEFAULT_ICP,
          ...config,
        };
      } catch {
        return DEFAULT_ICP;
      }
    },
  });
}

export function useUpdateICPSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: ICPConfig) => {
      // Check if setting exists
      const { data: existing } = await supabase
        .from("crm_settings")
        .select("id")
        .eq("setting_key", "icp_config")
        .maybeSingle();

      const settingValue = JSON.parse(JSON.stringify(config));

      if (existing) {
        const { error } = await supabase
          .from("crm_settings")
          .update({ 
            setting_value: settingValue,
            updated_at: new Date().toISOString()
          })
          .eq("setting_key", "icp_config");

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("crm_settings")
          .insert([{
            setting_key: "icp_config",
            setting_value: settingValue,
          }]);

        if (error) throw error;
      }

      return config;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["icp-settings"] });
      toast.success("Configurações de ICP salvas com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao salvar: ${error.message}`);
    },
  });
}

export function useResetICPSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("crm_settings")
        .delete()
        .eq("setting_key", "icp_config");

      if (error) throw error;
      return DEFAULT_ICP;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["icp-settings"] });
      toast.success("Configurações de ICP restauradas para o padrão!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao restaurar: ${error.message}`);
    },
  });
}
