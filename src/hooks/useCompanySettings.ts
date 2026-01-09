import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

export interface CompanySettings {
  name: string;
  cnpj: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  phone: string;
  email: string;
  website: string;
  bank_info: string;
}

const defaultSettings: CompanySettings = {
  name: "Growth Marks",
  cnpj: "",
  address: "",
  city: "",
  state: "",
  zip_code: "",
  phone: "",
  email: "",
  website: "",
  bank_info: "",
};

export function useCompanySettings() {
  return useQuery({
    queryKey: ["company_settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_settings")
        .select("*")
        .eq("setting_key", "company_info")
        .maybeSingle();

      if (error) throw error;
      
      if (data?.setting_value && typeof data.setting_value === 'object' && !Array.isArray(data.setting_value)) {
        return { ...defaultSettings, ...(data.setting_value as unknown as CompanySettings) };
      }
      
      return defaultSettings;
    },
  });
}

export function useUpdateCompanySettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: CompanySettings) => {
      // Check if settings exist
      const { data: existing } = await supabase
        .from("crm_settings")
        .select("id")
        .eq("setting_key", "company_info")
        .maybeSingle();

      const settingsJson = settings as unknown as Json;

      if (existing) {
        const { error } = await supabase
          .from("crm_settings")
          .update({ setting_value: settingsJson })
          .eq("setting_key", "company_info");

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("crm_settings")
          .insert([{
            setting_key: "company_info",
            setting_value: settingsJson,
          }]);

        if (error) throw error;
      }

      return settings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company_settings"] });
      toast.success("Dados da empresa salvos com sucesso!");
    },
    onError: (error) => {
      console.error("Error saving company settings:", error);
      toast.error("Erro ao salvar dados da empresa");
    },
  });
}
