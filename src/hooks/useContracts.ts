import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { logContractActivity } from "@/lib/activityLogger";

export type Contract = Tables<"contracts">;
export type ContractInsert = TablesInsert<"contracts">;
export type ContractUpdate = TablesUpdate<"contracts">;

export type ContractWithClient = Contract & {
  client: Tables<"clients"> | null;
};

export function useContracts() {
  return useQuery({
    queryKey: ["contracts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contracts")
        .select(`
          *,
          client:clients(*)
        `)
        .eq("is_archived", false)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ContractWithClient[];
    },
  });
}

export function useContract(id: string | undefined) {
  return useQuery({
    queryKey: ["contracts", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("contracts")
        .select(`
          *,
          client:clients(*)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as ContractWithClient;
    },
    enabled: !!id,
  });
}

export function useContractsByClient(clientId: string | undefined) {
  return useQuery({
    queryKey: ["contracts", "client", clientId],
    queryFn: async () => {
      if (!clientId) return [];
      const { data, error } = await supabase
        .from("contracts")
        .select(`
          *,
          client:clients(*)
        `)
        .eq("client_id", clientId)
        .eq("is_archived", false)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ContractWithClient[];
    },
    enabled: !!clientId,
  });
}

export function useCreateContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contract: ContractInsert) => {
      const { data, error } = await supabase
        .from("contracts")
        .insert(contract)
        .select(`
          *,
          client:clients(name)
        `)
        .single();

      if (error) throw error;

      // Log activity
      const clientName = (data as any).client?.name || "Cliente";
      await logContractActivity("create", data.id, `${contract.type} - ${clientName}`, {
        value: contract.value,
        type: contract.type,
        client_id: contract.client_id,
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["activity-logs"] });
      toast.success("Contrato criado com sucesso!");
    },
    onError: (error) => {
      console.error("Error creating contract:", error);
      toast.error("Erro ao criar contrato");
    },
  });
}

export function useUpdateContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: ContractUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("contracts")
        .update(updates)
        .eq("id", id)
        .select(`
          *,
          client:clients(name)
        `)
        .single();

      if (error) throw error;

      // Log activity
      const clientName = (data as any).client?.name || "Cliente";
      await logContractActivity("update", data.id, `${data.type} - ${clientName}`, { updates });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["activity-logs"] });
      toast.success("Contrato atualizado com sucesso!");
    },
    onError: (error) => {
      console.error("Error updating contract:", error);
      toast.error("Erro ao atualizar contrato");
    },
  });
}

export function useDeleteContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase
        .from("contracts")
        .update({ is_archived: true })
        .eq("id", id);

      if (error) throw error;

      // Log activity
      await logContractActivity("archive", id, name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["activity-logs"] });
      toast.success("Contrato arquivado com sucesso!");
    },
    onError: (error) => {
      console.error("Error deleting contract:", error);
      toast.error("Erro ao arquivar contrato");
    },
  });
}
