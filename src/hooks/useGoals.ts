import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Goal {
  id: string;
  title: string;
  type: "anual" | "trimestral" | "mensal";
  category: "financeiro" | "clientes" | "producao" | "comercial";
  target_value: number;
  current_value: number | null;
  unit: string;
  status: "em_andamento" | "atingida" | "nao_atingida";
  deadline: string | null;
  created_at: string;
  updated_at: string;
}

export interface KeyResult {
  id: string;
  goal_id: string;
  title: string;
  target_value: number;
  current_value: number | null;
  unit: string;
  created_at: string;
  updated_at: string;
}

export const useGoals = () => {
  const queryClient = useQueryClient();

  const { data: goals = [], isLoading } = useQuery({
    queryKey: ["goals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("goals")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      // Filter out archived goals manually since is_archived is a new column
      return (data || []).filter((g: Goal & { is_archived?: boolean }) => !g.is_archived) as Goal[];
    },
  });

  const { data: keyResults = [] } = useQuery({
    queryKey: ["key-results"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("key_results")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as KeyResult[];
    },
  });

  const createGoal = useMutation({
    mutationFn: async (goal: Omit<Goal, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("goals")
        .insert(goal as never)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      toast.success("Meta criada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao criar meta: " + error.message);
    },
  });

  const updateGoal = useMutation({
    mutationFn: async ({ id, ...goal }: Partial<Goal> & { id: string }) => {
      const { data, error } = await supabase
        .from("goals")
        .update(goal as never)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      toast.success("Meta atualizada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar meta: " + error.message);
    },
  });

  const deleteGoal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("goals")
        .update({ is_archived: true } as never)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      toast.success("Meta arquivada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao arquivar meta: " + error.message);
    },
  });

  const createKeyResult = useMutation({
    mutationFn: async (keyResult: Omit<KeyResult, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("key_results")
        .insert(keyResult as never)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["key-results"] });
      toast.success("Key Result criado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao criar Key Result: " + error.message);
    },
  });

  const updateKeyResult = useMutation({
    mutationFn: async ({ id, ...keyResult }: Partial<KeyResult> & { id: string }) => {
      const { data, error } = await supabase
        .from("key_results")
        .update(keyResult as never)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["key-results"] });
      toast.success("Key Result atualizado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar Key Result: " + error.message);
    },
  });

  const deleteKeyResult = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("key_results")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["key-results"] });
      toast.success("Key Result excluído com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir Key Result: " + error.message);
    },
  });

  const getKeyResultsForGoal = (goalId: string) => {
    return keyResults.filter((kr) => kr.goal_id === goalId);
  };

  return {
    goals,
    keyResults,
    isLoading,
    createGoal,
    updateGoal,
    deleteGoal,
    createKeyResult,
    updateKeyResult,
    deleteKeyResult,
    getKeyResultsForGoal,
  };
};
