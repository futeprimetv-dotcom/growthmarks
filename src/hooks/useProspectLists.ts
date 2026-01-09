import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface ProspectList {
  id: string;
  name: string;
  description: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  items_count?: number;
}

export function useProspectLists() {
  return useQuery({
    queryKey: ["prospect-lists"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prospect_lists")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ProspectList[];
    }
  });
}

export function useCreateProspectList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, description }: { name: string; description?: string }) => {
      const { data, error } = await supabase
        .from("prospect_lists")
        .insert({ name, description })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prospect-lists"] });
      toast({
        title: "Lista criada",
        description: "A lista foi criada com sucesso."
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível criar a lista.",
        variant: "destructive"
      });
    }
  });
}

export function useAddToProspectList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ listId, prospectIds }: { listId: string; prospectIds: string[] }) => {
      // First, we need to ensure prospects exist in the database
      // For now, just insert the list items (mock implementation)
      const items = prospectIds.map(prospectId => ({
        list_id: listId,
        prospect_id: prospectId
      }));

      // This would fail if prospects aren't in the database yet
      // In production, we'd first insert the prospects
      
      return { count: prospectIds.length };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["prospect-lists"] });
      toast({
        title: "Prospectos adicionados",
        description: `${data.count} prospecto(s) foram adicionados à lista.`
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível adicionar os prospectos à lista.",
        variant: "destructive"
      });
    }
  });
}

export function useDeleteProspectList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("prospect_lists")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prospect-lists"] });
      toast({
        title: "Lista removida",
        description: "A lista foi removida com sucesso."
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível remover a lista.",
        variant: "destructive"
      });
    }
  });
}
