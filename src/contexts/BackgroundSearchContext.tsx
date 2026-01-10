import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBrowserNotification } from "@/hooks/useBrowserNotification";
import { useNotifications } from "@/contexts/NotificationContext";
import { useNotificationSound } from "@/hooks/useNotificationSound";
import { useGlobalSearchLock } from "@/contexts/GlobalSearchLock";
import type { ProspectFilters } from "@/hooks/useProspects";
import type { CompanySearchResult, SearchDebugStats } from "@/hooks/useCompanySearch";

interface BackgroundSearch {
  id: string;
  filters: ProspectFilters;
  status: "pending" | "running" | "completed" | "cancelled" | "error";
  startedAt: Date;
  completedAt?: Date;
  results: CompanySearchResult[];
  total?: number;
  stats?: SearchDebugStats;
  error?: string;
  phase?: "searching" | "processing";
  message?: string;
  progress: {
    processed: number;
    total: number;
    found: number;
  };
}

interface BackgroundSearchContextType {
  activeSearch: BackgroundSearch | null;
  isSearching: boolean;
  startBackgroundSearch: (filters: ProspectFilters, pageSize?: number) => Promise<string>;
  cancelSearch: () => void;
  clearSearch: () => void;
  acknowledgeSearch: () => void;
}

const BackgroundSearchContext = createContext<BackgroundSearchContextType | null>(null);

export function BackgroundSearchProvider({ children }: { children: React.ReactNode }) {
  const [activeSearch, setActiveSearch] = useState<BackgroundSearch | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { permission, requestPermission, sendNotification } = useBrowserNotification();
  const { addNotification } = useNotifications();
  const { playSuccessSound, playErrorSound } = useNotificationSound();
  const { acquireLock, releaseLock, getActiveSearchMessage } = useGlobalSearchLock();

  const isSearching = activeSearch?.status === "running" || activeSearch?.status === "pending";

  // Request permission on mount if not granted
  useEffect(() => {
    if (permission === "default") {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const startBackgroundSearch = useCallback(async (
    filters: ProspectFilters,
    pageSize: number = 50
  ): Promise<string> => {
    // Try to acquire global search lock
    if (!acquireLock("internet")) {
      const message = getActiveSearchMessage();
      throw new Error(message || "Outra busca está em andamento. Aguarde para iniciar uma nova.");
    }

    // Cancel any existing search
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const searchId = `search-${Date.now()}`;
    const newSearch: BackgroundSearch = {
      id: searchId,
      filters,
      status: "running",
      startedAt: new Date(),
      results: [],
      progress: { processed: 0, total: 0, found: 0 },
    };

    setActiveSearch(newSearch);
    abortControllerRef.current = new AbortController();

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      
      const response = await fetch(`${supabaseUrl}/functions/v1/search-companies`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session?.access_token || supabaseKey}`,
          "apikey": supabaseKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          states: filters.states,
          cities: filters.cities,
          segments: filters.segments,
          cnae: filters.cnae,
          companySizes: filters.companySizes,
          hasEmail: filters.hasEmail,
          hasPhone: filters.hasPhone,
          hasWebsite: filters.hasWebsite,
          pageSize,
          streaming: true,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        // Process complete SSE messages
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";
        
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              
              switch (data.type) {
                case "init":
                  setActiveSearch(prev => prev ? {
                    ...prev,
                    phase: data.phase || "processing",
                    message: data.message,
                    progress: {
                      ...prev.progress,
                      total: data.processing || prev.progress.total,
                    },
                  } : null);
                  break;
                  
                case "company":
                  setActiveSearch(prev => prev ? {
                    ...prev,
                    results: [...prev.results, data.company],
                    progress: data.progress,
                    phase: "processing",
                  } : null);
                  break;
                  
                case "progress":
                  setActiveSearch(prev => prev ? {
                    ...prev,
                    phase: data.phase || prev?.phase,
                    progress: {
                      processed: data.processed,
                      total: data.total,
                      found: data.found,
                    },
                  } : null);
                  break;
                  
                case "complete":
                  setActiveSearch(prev => prev ? {
                    ...prev,
                    status: "completed",
                    completedAt: new Date(),
                    stats: data.stats,
                    total: prev.results.length,
                  } : null);
                  
                  releaseLock("internet");
                  
                  const timeInfo = data.stats?.processingTimeMs
                    ? ` em ${(data.stats.processingTimeMs / 1000).toFixed(1)}s`
                    : "";

                  playSuccessSound();

                  sendNotification("🔍 Busca concluída!", {
                    body: `${data.stats?.companiesFound || 0} empresa(s) encontrada(s)${timeInfo}. Clique para ver os resultados.`,
                    tag: "background-search-complete",
                    requireInteraction: true,
                    onClick: () => {
                      window.focus();
                    },
                  });

                  addNotification({
                    type: "search",
                    title: "Busca concluída",
                    message: `Empresas encontradas${timeInfo}. Clique para ver os resultados.`,
                    link: "/prospeccao",
                  });
                  break;
              }
            } catch (e) {
              console.error("Error parsing SSE message:", e, line);
            }
          }
        }
      }

      return searchId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      
      if ((error as Error).name !== "AbortError") {
        releaseLock("internet");
        
        setActiveSearch(prev => prev ? {
          ...prev,
          status: "error",
          error: errorMessage,
          completedAt: new Date(),
        } : null);

        playErrorSound();

        addNotification({
          type: "error",
          title: "Erro na busca",
          message: errorMessage,
          link: "/prospeccao",
        });
      }

      throw error;
    }
  }, [sendNotification, addNotification, playSuccessSound, playErrorSound, acquireLock, releaseLock, getActiveSearchMessage]);

  const cancelSearch = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    releaseLock("internet");
    setActiveSearch(prev => prev ? {
      ...prev,
      status: "cancelled",
      completedAt: new Date(),
    } : null);
  }, [releaseLock]);

  const clearSearch = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    releaseLock("internet");
    setActiveSearch(null);
  }, [releaseLock]);

  const acknowledgeSearch = useCallback(() => {
    // Mark search as acknowledged
  }, []);

  return (
    <BackgroundSearchContext.Provider
      value={{
        activeSearch,
        isSearching,
        startBackgroundSearch,
        cancelSearch,
        clearSearch,
        acknowledgeSearch,
      }}
    >
      {children}
    </BackgroundSearchContext.Provider>
  );
}

export function useBackgroundSearch() {
  const context = useContext(BackgroundSearchContext);
  if (!context) {
    throw new Error("useBackgroundSearch must be used within a BackgroundSearchProvider");
  }
  return context;
}
