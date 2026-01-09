import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SalesFunnel {
  id: string;
  name: string;
  description: string | null;
  color: string;
  is_default: boolean;
  is_active: boolean;
  position: number;
  created_at: string;
  updated_at: string;
}

export function useSalesFunnels() {
  return useQuery({
    queryKey: ["sales-funnels"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales_funnels")
        .select("*")
        .eq("is_active", true)
        .order("position", { ascending: true });

      if (error) throw error;
      return data as SalesFunnel[];
    },
  });
}

export function useCreateFunnel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (funnel: { name: string; description?: string; color?: string }) => {
      const { data, error } = await supabase
        .from("sales_funnels")
        .insert([funnel])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales-funnels"] });
      toast.success("Funil criado com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao criar funil");
    },
  });
}

export function useUpdateFunnel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SalesFunnel> & { id: string }) => {
      const { data, error } = await supabase
        .from("sales_funnels")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales-funnels"] });
      toast.success("Funil atualizado!");
    },
    onError: () => {
      toast.error("Erro ao atualizar funil");
    },
  });
}

export function useDeleteFunnel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Check if funnel is default
      const { data: funnel } = await supabase
        .from("sales_funnels")
        .select("is_default")
        .eq("id", id)
        .single();

      if (funnel?.is_default) {
        throw new Error("Não é possível excluir o funil padrão");
      }

      // Check if funnel has leads
      const { count } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("funnel_id", id);

      if (count && count > 0) {
        throw new Error(`Este funil possui ${count} leads. Mova os leads antes de excluir.`);
      }

      const { error } = await supabase
        .from("sales_funnels")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales-funnels"] });
      toast.success("Funil excluído!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useSetDefaultFunnel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Remove default from all funnels
      await supabase
        .from("sales_funnels")
        .update({ is_default: false })
        .neq("id", id);

      // Set new default
      const { error } = await supabase
        .from("sales_funnels")
        .update({ is_default: true })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales-funnels"] });
      toast.success("Funil padrão atualizado!");
    },
    onError: () => {
      toast.error("Erro ao definir funil padrão");
    },
  });
}
