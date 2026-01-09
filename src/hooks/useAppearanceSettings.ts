import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AppearanceSettings {
  fontSize: "small" | "medium" | "large";
  accentColor: string;
  logoUrl: string | null;
}

const defaultSettings: AppearanceSettings = {
  fontSize: "medium",
  accentColor: "24 95% 53%", // Orange (default)
  logoUrl: null,
};

export function useAppearanceSettings() {
  return useQuery({
    queryKey: ["appearance-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appearance_settings")
        .select("*")
        .eq("setting_key", "global")
        .maybeSingle();

      if (error) throw error;

      if (!data) return defaultSettings;

      const value = data.setting_value as Record<string, unknown>;
      return {
        fontSize: (value.fontSize as AppearanceSettings["fontSize"]) || defaultSettings.fontSize,
        accentColor: (value.accentColor as string) || defaultSettings.accentColor,
        logoUrl: (value.logoUrl as string | null) || defaultSettings.logoUrl,
      };
    },
  });
}

export function useUpdateAppearanceSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: Partial<AppearanceSettings>) => {
      // Get existing settings first
      const { data: existing } = await supabase
        .from("appearance_settings")
        .select("*")
        .eq("setting_key", "global")
        .maybeSingle();

      const currentValue = (existing?.setting_value as Record<string, unknown>) || {};
      const newValue = { ...currentValue, ...settings };

      if (existing) {
        const { error } = await supabase
          .from("appearance_settings")
          .update({ setting_value: newValue })
          .eq("setting_key", "global");

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("appearance_settings")
          .insert({ setting_key: "global", setting_value: newValue });

        if (error) throw error;
      }

      return newValue as AppearanceSettings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appearance-settings"] });
      toast.success("Configurações de aparência salvas!");
    },
    onError: () => {
      toast.error("Erro ao salvar configurações");
    },
  });
}

export function useUploadLogo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const fileExt = file.name.split(".").pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("company-logos")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("company-logos")
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appearance-settings"] });
    },
    onError: () => {
      toast.error("Erro ao fazer upload do logo");
    },
  });
}
