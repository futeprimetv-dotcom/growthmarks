import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import defaultLogo from "@/assets/logo-growth-marks.png";

export interface AppearanceSettings {
  fontSize: "small" | "medium" | "large";
  accentColor: string;
  logoUrl: string | null;
}

const defaultSettings: AppearanceSettings = {
  fontSize: "medium",
  accentColor: "24 95% 53%",
  logoUrl: null,
};

interface AppearanceContextType {
  settings: AppearanceSettings;
  logoSrc: string;
  isLoading: boolean;
  refetch: () => void;
}

const AppearanceContext = createContext<AppearanceContextType>({
  settings: defaultSettings,
  logoSrc: defaultLogo,
  isLoading: true,
  refetch: () => {},
});

export function useAppearance() {
  return useContext(AppearanceContext);
}

export function AppearanceProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppearanceSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  const applySettings = (s: AppearanceSettings) => {
    // Apply font size
    const sizeMap = { small: "14px", medium: "16px", large: "18px" };
    document.documentElement.style.fontSize = sizeMap[s.fontSize];

    // Apply accent color
    document.documentElement.style.setProperty("--primary", s.accentColor);
  };

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("appearance_settings")
        .select("*")
        .eq("setting_key", "global")
        .maybeSingle();

      if (error) {
        console.error("Error fetching appearance settings:", error);
        return;
      }

      if (data) {
        const value = data.setting_value as Record<string, unknown>;
        const newSettings: AppearanceSettings = {
          fontSize: (value.fontSize as AppearanceSettings["fontSize"]) || defaultSettings.fontSize,
          accentColor: (value.accentColor as string) || defaultSettings.accentColor,
          logoUrl: (value.logoUrl as string | null) || defaultSettings.logoUrl,
        };
        setSettings(newSettings);
        applySettings(newSettings);
      } else {
        applySettings(defaultSettings);
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();

    // Subscribe to changes
    const channel = supabase
      .channel("appearance-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "appearance_settings",
        },
        () => {
          fetchSettings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const logoSrc = settings.logoUrl || defaultLogo;

  return (
    <AppearanceContext.Provider value={{ settings, logoSrc, isLoading, refetch: fetchSettings }}>
      {children}
    </AppearanceContext.Provider>
  );
}
