import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import { toast } from "sonner";

export type ContractService = Tables<"contract_services">;
export type ContractServiceInsert = TablesInsert<"contract_services">;

export type ContractServiceWithDetails = ContractService & {
  service: Tables<"available_services"> | null;
};

export function useContractServices(contractId: string | undefined) {
  return useQuery({
    queryKey: ["contract_services", contractId],
    queryFn: async () => {
      if (!contractId) return [];
      const { data, error } = await supabase
        .from("contract_services")
        .select(`
          *,
          service:available_services(*)
        `)
        .eq("contract_id", contractId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as ContractServiceWithDetails[];
    },
    enabled: !!contractId,
  });
}

export function useAddContractService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contractService: ContractServiceInsert) => {
      const { data, error } = await supabase
        .from("contract_services")
        .insert(contractService)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["contract_services", variables.contract_id] });
      toast.success("Serviço vinculado ao contrato!");
    },
    onError: (error) => {
      console.error("Error adding contract service:", error);
      toast.error("Erro ao vincular serviço");
    },
  });
}

export function useRemoveContractService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, contractId }: { id: string; contractId: string }) => {
      const { error } = await supabase
        .from("contract_services")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return contractId;
    },
    onSuccess: (contractId) => {
      queryClient.invalidateQueries({ queryKey: ["contract_services", contractId] });
      toast.success("Serviço removido do contrato!");
    },
    onError: (error) => {
      console.error("Error removing contract service:", error);
      toast.error("Erro ao remover serviço");
    },
  });
}

export function useSyncContractServices() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      contractId, 
      serviceIds 
    }: { 
      contractId: string; 
      serviceIds: string[] 
    }) => {
      // First, delete all existing services for this contract
      const { error: deleteError } = await supabase
        .from("contract_services")
        .delete()
        .eq("contract_id", contractId);

      if (deleteError) throw deleteError;

      // Then, insert the new services
      if (serviceIds.length > 0) {
        const servicesToInsert = serviceIds.map(serviceId => ({
          contract_id: contractId,
          service_id: serviceId,
        }));

        const { error: insertError } = await supabase
          .from("contract_services")
          .insert(servicesToInsert);

        if (insertError) throw insertError;
      }

      return contractId;
    },
    onSuccess: (contractId) => {
      queryClient.invalidateQueries({ queryKey: ["contract_services", contractId] });
    },
    onError: (error) => {
      console.error("Error syncing contract services:", error);
      toast.error("Erro ao sincronizar serviços");
    },
  });
}
