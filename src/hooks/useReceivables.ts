import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Receivable {
  id: string;
  client_id: string | null;
  description: string;
  value: number;
  due_date: string;
  reference_month: number;
  reference_year: number;
  status: string;
  paid_at: string | null;
  paid_value: number | null;
  payment_method: string | null;
  notes: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  client?: { id: string; name: string } | null;
}

export interface ReceivableInsert {
  client_id?: string | null;
  description: string;
  value: number;
  due_date: string;
  reference_month: number;
  reference_year: number;
  status?: string;
  paid_at?: string | null;
  paid_value?: number | null;
  payment_method?: string | null;
  notes?: string | null;
}

export function useReceivables(month?: number, year?: number) {
  return useQuery({
    queryKey: ["receivables", month, year],
    queryFn: async () => {
      let query = supabase
        .from("receivables")
        .select(`
          *,
          client:clients(id, name)
        `)
        .eq("is_archived", false)
        .order("due_date", { ascending: true });

      if (month !== undefined && year !== undefined) {
        query = query.eq("reference_month", month).eq("reference_year", year);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Receivable[];
    },
  });
}

export function useCreateReceivable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (receivable: ReceivableInsert) => {
      const { data, error } = await supabase
        .from("receivables")
        .insert(receivable)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receivables"] });
      toast.success("Conta a receber criada com sucesso!");
    },
    onError: (error) => {
      console.error("Error creating receivable:", error);
      toast.error("Erro ao criar conta a receber");
    },
  });
}

export function useUpdateReceivable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Receivable> & { id: string }) => {
      const { data, error } = await supabase
        .from("receivables")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receivables"] });
      toast.success("Conta a receber atualizada!");
    },
    onError: (error) => {
      console.error("Error updating receivable:", error);
      toast.error("Erro ao atualizar conta a receber");
    },
  });
}

export function useDeleteReceivable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("receivables")
        .update({ is_archived: true })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receivables"] });
      toast.success("Conta a receber arquivada!");
    },
    onError: (error) => {
      console.error("Error deleting receivable:", error);
      toast.error("Erro ao arquivar conta a receber");
    },
  });
}

export function useMarkReceivableAsPaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, paid_value, payment_method }: { id: string; paid_value: number; payment_method?: string }) => {
      const { data, error } = await supabase
        .from("receivables")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
          paid_value,
          payment_method,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receivables"] });
      toast.success("Pagamento registrado!");
    },
    onError: (error) => {
      console.error("Error marking as paid:", error);
      toast.error("Erro ao registrar pagamento");
    },
  });
}
