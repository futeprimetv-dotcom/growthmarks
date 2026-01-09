import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { ProspectFilters } from "./useProspects";

export interface SavedSearch {
  id: string;
  name: string;
  filters: ProspectFilters;
  results_count: number;
  search_type: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useSavedSearches() {
  return useQuery({
    queryKey: ["saved-searches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("saved_searches")
        .select("*")
        .eq("search_type", "prospeccao")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as SavedSearch[];
    }
  });
}

export function useCreateSavedSearch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, filters, resultsCount }: { name: string; filters: ProspectFilters; resultsCount: number }) => {
      const { data, error } = await supabase
        .from("saved_searches")
        .insert({
          name,
          filters: filters as any,
          results_count: resultsCount,
          search_type: "prospeccao"
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-searches"] });
      toast({
        title: "Pesquisa salva",
        description: "Sua pesquisa foi salva com sucesso."
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível salvar a pesquisa.",
        variant: "destructive"
      });
    }
  });
}

export function useDeleteSavedSearch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("saved_searches")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-searches"] });
      toast({
        title: "Pesquisa removida",
        description: "A pesquisa foi removida com sucesso."
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível remover a pesquisa.",
        variant: "destructive"
      });
    }
  });
}
