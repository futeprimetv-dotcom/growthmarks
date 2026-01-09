import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Payable {
  id: string;
  description: string;
  category: string;
  value: number;
  due_date: string;
  reference_month: number;
  reference_year: number;
  status: string;
  paid_at: string | null;
  paid_value: number | null;
  payment_method: string | null;
  supplier: string | null;
  notes: string | null;
  recurring: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface PayableInsert {
  description: string;
  category: string;
  value: number;
  due_date: string;
  reference_month: number;
  reference_year: number;
  status?: string;
  paid_at?: string | null;
  paid_value?: number | null;
  payment_method?: string | null;
  supplier?: string | null;
  notes?: string | null;
  recurring?: boolean;
}

export function usePayables(month?: number, year?: number) {
  return useQuery({
    queryKey: ["payables", month, year],
    queryFn: async () => {
      let query = supabase
        .from("payables")
        .select("*")
        .eq("is_archived", false)
        .order("due_date", { ascending: true });

      if (month !== undefined && year !== undefined) {
        query = query.eq("reference_month", month).eq("reference_year", year);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Payable[];
    },
  });
}

export function useCreatePayable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payable: PayableInsert) => {
      const { data, error } = await supabase
        .from("payables")
        .insert(payable)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payables"] });
      toast.success("Conta a pagar criada com sucesso!");
    },
    onError: (error) => {
      console.error("Error creating payable:", error);
      toast.error("Erro ao criar conta a pagar");
    },
  });
}

export function useUpdatePayable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Payable> & { id: string }) => {
      const { data, error } = await supabase
        .from("payables")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payables"] });
      toast.success("Conta a pagar atualizada!");
    },
    onError: (error) => {
      console.error("Error updating payable:", error);
      toast.error("Erro ao atualizar conta a pagar");
    },
  });
}

export function useDeletePayable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("payables")
        .update({ is_archived: true })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payables"] });
      toast.success("Conta a pagar arquivada!");
    },
    onError: (error) => {
      console.error("Error deleting payable:", error);
      toast.error("Erro ao arquivar conta a pagar");
    },
  });
}

export function useMarkPayableAsPaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, paid_value, payment_method }: { id: string; paid_value: number; payment_method?: string }) => {
      const { data, error } = await supabase
        .from("payables")
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
      queryClient.invalidateQueries({ queryKey: ["payables"] });
      toast.success("Pagamento registrado!");
    },
    onError: (error) => {
      console.error("Error marking as paid:", error);
      toast.error("Erro ao registrar pagamento");
    },
  });
}
