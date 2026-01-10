import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBrowserNotification } from "@/hooks/useBrowserNotification";
import { useNotifications } from "@/contexts/NotificationContext";
import { useNotificationSound } from "@/hooks/useNotificationSound";

export interface CNPJResult {
  cnpj: string;
  razao_social?: string;
  nome_fantasia?: string;
  porte?: string;
  situacao?: string;
  municipio?: string;
  uf?: string;
  cnae_fiscal_descricao?: string;
}

export interface CNPJSearchProgress {
  status: "idle" | "searching" | "processing" | "completed" | "error" | "cancelled";
  statusMessage?: string;
  totalFound: number;
  processed: number;
  activeCount: number;
  inactiveCount: number;
  cacheHits: number;
  queriesCompleted: number;
  totalQueries: number;
}

export interface CNPJSearchFilters {
  segment?: string;
  state?: string;
  city?: string;
  companySize?: string;
  limit: number;
}

interface CNPJPullSearch {
  id: string;
  filters: CNPJSearchFilters;
  results: CNPJResult[];
  progress: CNPJSearchProgress;
  startedAt: Date;
  completedAt?: Date;
  isBackground: boolean;
}

interface CNPJPullContextType {
  activeSearch: CNPJPullSearch | null;
  isSearching: boolean;
  results: CNPJResult[];
  progress: CNPJSearchProgress;
  startSearch: (filters: CNPJSearchFilters) => Promise<void>;
  cancelSearch: () => void;
  moveToBackground: () => void;
  clearSearch: () => void;
  estimatedTimeRemaining: string | null;
}

const defaultProgress: CNPJSearchProgress = {
  status: "idle",
  totalFound: 0,
  processed: 0,
  activeCount: 0,
  inactiveCount: 0,
  cacheHits: 0,
  queriesCompleted: 0,
  totalQueries: 0,
};

const CNPJPullContext = createContext<CNPJPullContextType | null>(null);

function formatTimeRemaining(seconds: number): string {
  if (seconds < 0 || !isFinite(seconds)) return "--";
  if (seconds < 60) return `${Math.ceil(seconds)}s`;
  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.ceil(seconds % 60);
    return `${mins}m ${secs}s`;
  }
  const hours = Math.floor(seconds / 3600);
  const mins = Math.ceil((seconds % 3600) / 60);
  return `${hours}h ${mins}m`;
}

export function CNPJPullProvider({ children }: { children: React.ReactNode }) {
  const [activeSearch, setActiveSearch] = useState<CNPJPullSearch | null>(null);
  const [results, setResults] = useState<CNPJResult[]>([]);
  const [progress, setProgress] = useState<CNPJSearchProgress>(defaultProgress);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<string | null>(null);
  const [processingStartTime, setProcessingStartTime] = useState<number | null>(null);
  const [hasNotified, setHasNotified] = useState(false);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const { permission, requestPermission, sendNotification } = useBrowserNotification();
  const { addNotification } = useNotifications();
  const { playSuccessSound, playErrorSound } = useNotificationSound();

  const isSearching = progress.status === "searching" || progress.status === "processing";

  // Request notification permission on mount
  useEffect(() => {
    if (permission === "default") {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const startSearch = useCallback(async (filters: CNPJSearchFilters) => {
    if (!filters.segment || !filters.state) {
      throw new Error("Selecione pelo menos o segmento e o estado.");
    }

    // Cancel any existing search
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const searchId = `cnpj-pull-${Date.now()}`;
    
    setResults([]);
    setProcessingStartTime(null);
    setEstimatedTimeRemaining(null);
    setHasNotified(false);
    setProgress({
      status: "searching",
      statusMessage: "Iniciando busca...",
      totalFound: 0,
      processed: 0,
      activeCount: 0,
      inactiveCount: 0,
      cacheHits: 0,
      queriesCompleted: 0,
      totalQueries: 0,
    });

    setActiveSearch({
      id: searchId,
      filters,
      results: [],
      progress: { ...defaultProgress, status: "searching" },
      startedAt: new Date(),
      isBackground: false,
    });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/pull-cnpjs`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session?.access_token || supabaseKey}`,
          "apikey": supabaseKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          segments: [filters.segment],
          states: [filters.state],
          cities: filters.city ? [filters.city] : undefined,
          companySizes: filters.companySize ? [filters.companySize] : undefined,
          limit: filters.limit,
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
                case "status":
                  setProgress(prev => ({
                    ...prev,
                    statusMessage: data.message,
                  }));
                  break;

                case "search_progress":
                  setProgress(prev => ({
                    ...prev,
                    status: "searching",
                    queriesCompleted: data.queriesCompleted,
                    totalQueries: data.totalQueries,
                    totalFound: data.cnpjsFound,
                  }));
                  break;

                case "search_complete":
                  setProcessingStartTime(Date.now());
                  setProgress(prev => ({
                    ...prev,
                    status: "processing",
                    statusMessage: "Validando CNPJs...",
                    totalFound: data.totalCNPJsFound,
                  }));
                  break;

                case "cnpj":
                  setResults(prev => {
                    const updated = [...prev, data.cnpj];
                    setActiveSearch(current => current ? { ...current, results: updated } : null);
                    return updated;
                  });
                  setProgress(prev => ({
                    ...prev,
                    processed: data.progress.processed,
                    activeCount: data.progress.found,
                    inactiveCount: data.progress.inactiveCount,
                  }));
                  break;
                  
                case "progress": {
                  const now = Date.now();
                  setProgress(prev => ({
                    ...prev,
                    processed: data.processed,
                    activeCount: data.found,
                    inactiveCount: data.inactiveCount,
                    cacheHits: data.cacheHits || 0,
                  }));
                  
                  if (data.processed > 0 && data.total > data.processed) {
                    setProcessingStartTime(prevStart => {
                      if (prevStart) {
                        const elapsedMs = now - prevStart;
                        const rate = data.processed / (elapsedMs / 1000);
                        const remaining = data.total - data.processed;
                        const estimatedSeconds = remaining / rate;
                        setEstimatedTimeRemaining(formatTimeRemaining(estimatedSeconds));
                      }
                      return prevStart;
                    });
                  } else if (data.processed >= data.total) {
                    setEstimatedTimeRemaining(null);
                  }
                  break;
                }
                  
                case "complete":
                  setProgress(prev => ({
                    ...prev,
                    status: "completed",
                    statusMessage: undefined,
                  }));
                  setActiveSearch(current => current ? {
                    ...current,
                    completedAt: new Date(),
                    progress: { ...current.progress, status: "completed" },
                  } : null);

                  // Play sound and send notifications - only once
                  setHasNotified(prev => {
                    if (!prev) {
                      playSuccessSound();
                      
                      sendNotification("🔍 Busca de CNPJs concluída!", {
                        body: `${data.stats?.activeCount || 0} CNPJs ativos encontrados. Clique para ver os resultados.`,
                        tag: "cnpj-pull-complete",
                        requireInteraction: true,
                        onClick: () => {
                          window.focus();
                        },
                      });

                      addNotification({
                        type: "search",
                        title: "Busca de CNPJs concluída",
                        message: `${data.stats?.activeCount || 0} CNPJs ativos encontrados. Clique para ver os resultados.`,
                        link: "/prospeccao",
                      });
                    }
                    return true;
                  });
                  break;

                case "error":
                  setProgress(prev => ({
                    ...prev,
                    status: "error",
                    statusMessage: data.message,
                  }));
                  playErrorSound();
                  break;
              }
            } catch (e) {
              console.error("Error parsing SSE message:", e, line);
            }
          }
        }
      }
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        // Search was cancelled - check if it should continue in background
        return;
      }

      console.error("Error pulling CNPJs:", error);
      setProgress(prev => ({ ...prev, status: "error" }));
      playErrorSound();
      throw error;
    }
  }, [sendNotification, addNotification, playSuccessSound, playErrorSound]);

  const cancelSearch = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setProgress(prev => ({
      ...prev,
      status: "cancelled",
      statusMessage: "Busca cancelada",
    }));
    setActiveSearch(null);
  }, []);

  const moveToBackground = useCallback(() => {
    setActiveSearch(current => current ? { ...current, isBackground: true } : null);
  }, []);

  const clearSearch = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setActiveSearch(null);
    setResults([]);
    setProgress(defaultProgress);
    setEstimatedTimeRemaining(null);
    setProcessingStartTime(null);
    setHasNotified(false);
  }, []);

  return (
    <CNPJPullContext.Provider
      value={{
        activeSearch,
        isSearching,
        results,
        progress,
        startSearch,
        cancelSearch,
        moveToBackground,
        clearSearch,
        estimatedTimeRemaining,
      }}
    >
      {children}
    </CNPJPullContext.Provider>
  );
}

export function useCNPJPull() {
  const context = useContext(CNPJPullContext);
  if (!context) {
    throw new Error("useCNPJPull must be used within a CNPJPullProvider");
  }
  return context;
}
