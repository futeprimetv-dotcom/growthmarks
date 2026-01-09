import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { ProspectFilters } from "./useProspects";
import type { CompanySearchResult, SearchDebugStats } from "./useCompanySearch";

export interface StreamingSearchState {
  companies: CompanySearchResult[];
  isSearching: boolean;
  progress: {
    processed: number;
    total: number;
    found: number;
  };
  stats: SearchDebugStats | null;
  error: string | null;
}

export function useStreamingSearch() {
  const [state, setState] = useState<StreamingSearchState>({
    companies: [],
    isSearching: false,
    progress: { processed: 0, total: 0, found: 0 },
    stats: null,
    error: null,
  });
  
  const abortControllerRef = useRef<AbortController | null>(null);

  const startSearch = useCallback(async (
    filters: ProspectFilters,
    pageSize: number = 10
  ) => {
    // Cancel any ongoing search
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    setState({
      companies: [],
      isSearching: true,
      progress: { processed: 0, total: 0, found: 0 },
      stats: null,
      error: null,
    });

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
          streaming: true, // Enable streaming mode
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
        buffer = lines.pop() || ""; // Keep incomplete message in buffer
        
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              
              switch (data.type) {
                case "init":
                  setState(prev => ({
                    ...prev,
                    progress: {
                      ...prev.progress,
                      total: data.processing,
                    },
                  }));
                  break;
                  
                case "company":
                  setState(prev => ({
                    ...prev,
                    companies: [...prev.companies, data.company],
                    progress: data.progress,
                  }));
                  break;
                  
                case "progress":
                  setState(prev => ({
                    ...prev,
                    progress: {
                      processed: data.processed,
                      total: data.total,
                      found: data.found,
                    },
                  }));
                  break;
                  
                case "complete":
                  setState(prev => ({
                    ...prev,
                    isSearching: false,
                    stats: data.stats,
                  }));
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
        // Search was cancelled, don't update state
        return;
      }
      
      console.error("Streaming search error:", error);
      setState(prev => ({
        ...prev,
        isSearching: false,
        error: error instanceof Error ? error.message : "Erro ao buscar empresas",
      }));
    }
  }, []);

  const cancelSearch = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setState(prev => ({
      ...prev,
      isSearching: false,
    }));
  }, []);

  const reset = useCallback(() => {
    cancelSearch();
    setState({
      companies: [],
      isSearching: false,
      progress: { processed: 0, total: 0, found: 0 },
      stats: null,
      error: null,
    });
  }, [cancelSearch]);

  return {
    ...state,
    startSearch,
    cancelSearch,
    reset,
  };
}
