import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBrowserNotification } from "@/hooks/useBrowserNotification";
import { useNotifications } from "@/contexts/NotificationContext";
import { useNotificationSound } from "@/hooks/useNotificationSound";
import { useGlobalSearchLock } from "@/contexts/GlobalSearchLock";
import type { ProspectFilters } from "@/hooks/useProspects";
import type { CompanySearchResult, CompanySearchResponse, SearchDebugStats } from "@/hooks/useCompanySearch";

interface BackgroundSearch {
  id: string;
  filters: ProspectFilters;
  status: "pending" | "running" | "completed" | "cancelled" | "error";
  startedAt: Date;
  completedAt?: Date;
  results?: CompanySearchResult[];
  total?: number;
  stats?: SearchDebugStats;
  error?: string;
}

interface BackgroundSearchContextType {
  activeSearch: BackgroundSearch | null;
  isSearching: boolean;
  startBackgroundSearch: (filters: ProspectFilters, pageSize?: number) => Promise<string>;
  cancelSearch: (searchId: string) => void;
  getSearchResults: (searchId: string) => BackgroundSearch | null;
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
    };

    setActiveSearch(newSearch);
    abortControllerRef.current = new AbortController();

    try {
      const { data, error } = await supabase.functions.invoke<CompanySearchResponse>(
        "search-companies",
        {
          body: {
            states: filters.states,
            cities: filters.cities,
            segments: filters.segments,
            cnae: filters.cnae,
            companySizes: filters.companySizes,
            hasEmail: filters.hasEmail,
            hasPhone: filters.hasPhone,
            hasWebsite: filters.hasWebsite,
            page: 1,
            pageSize,
          },
        }
      );

      if (error) {
        throw new Error(error.message || "Erro ao buscar empresas");
      }

      const completedSearch: BackgroundSearch = {
        ...newSearch,
        status: "completed",
        completedAt: new Date(),
        results: data?.companies || [],
        total: data?.total || 0,
        stats: data?.debug,
      };

      setActiveSearch(completedSearch);
      
      // Release global lock on completion
      releaseLock("internet");

      const timeInfo = data?.debug?.processingTimeMs
        ? ` em ${(data.debug.processingTimeMs / 1000).toFixed(1)}s`
        : "";

      // Play success sound
      playSuccessSound();

      // Send browser notification
      sendNotification("🔍 Busca concluída!", {
        body: `${data?.companies?.length || 0} empresa(s) encontrada(s)${timeInfo}. Clique para ver os resultados.`,
        tag: "background-search-complete",
        requireInteraction: true,
        onClick: () => {
          window.focus();
        },
      });

      // Add app notification with link
      addNotification({
        type: "search",
        title: "Busca concluída",
        message: `${data?.companies?.length || 0} empresa(s) encontrada(s)${timeInfo}. Clique para ver os resultados.`,
        link: "/prospeccao",
      });

      return searchId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      
      if (errorMessage !== "AbortError") {
        // Release lock on error
        releaseLock("internet");
        
        setActiveSearch(prev => prev ? {
          ...prev,
          status: "error",
          error: errorMessage,
          completedAt: new Date(),
        } : null);

        // Play error sound
        playErrorSound();

        // Notify about error
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

  const cancelSearch = useCallback((searchId: string) => {
    if (activeSearch?.id === searchId && abortControllerRef.current) {
      abortControllerRef.current.abort();
      releaseLock("internet");
      setActiveSearch(prev => prev ? {
        ...prev,
        status: "cancelled",
        completedAt: new Date(),
      } : null);
    }
  }, [activeSearch, releaseLock]);

  const getSearchResults = useCallback((searchId: string): BackgroundSearch | null => {
    if (activeSearch?.id === searchId) {
      return activeSearch;
    }
    return null;
  }, [activeSearch]);

  const clearSearch = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    releaseLock("internet");
    setActiveSearch(null);
  }, [releaseLock]);

  const acknowledgeSearch = useCallback(() => {
    // Mark search as acknowledged (user has seen the results)
    // We keep the results available but can track that user has seen them
  }, []);

  return (
    <BackgroundSearchContext.Provider
      value={{
        activeSearch,
        isSearching,
        startBackgroundSearch,
        cancelSearch,
        getSearchResults,
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
