import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ContractTemplate {
  id: string;
  name: string;
  description: string | null;
  service_type: string;
  content: string;
  is_active: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface ContractTemplateInsert {
  name: string;
  description?: string | null;
  service_type: string;
  content: string;
  is_active?: boolean | null;
}

export interface ContractTemplateUpdate {
  name?: string;
  description?: string | null;
  service_type?: string;
  content?: string;
  is_active?: boolean | null;
}

export function useContractTemplates() {
  return useQuery({
    queryKey: ["contract_templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contract_templates")
        .select("*")
        .eq("is_active", true)
        .order("name", { ascending: true });

      if (error) throw error;
      return data as ContractTemplate[];
    },
  });
}

export function useContractTemplate(id: string | undefined) {
  return useQuery({
    queryKey: ["contract_templates", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("contract_templates")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as ContractTemplate;
    },
    enabled: !!id,
  });
}

export function useCreateContractTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (template: ContractTemplateInsert) => {
      const { data, error } = await supabase
        .from("contract_templates")
        .insert(template)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contract_templates"] });
      toast.success("Template criado com sucesso!");
    },
    onError: (error) => {
      console.error("Error creating template:", error);
      toast.error("Erro ao criar template");
    },
  });
}

export function useUpdateContractTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: ContractTemplateUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("contract_templates")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contract_templates"] });
      toast.success("Template atualizado com sucesso!");
    },
    onError: (error) => {
      console.error("Error updating template:", error);
      toast.error("Erro ao atualizar template");
    },
  });
}

export function useDeleteContractTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("contract_templates")
        .update({ is_active: false })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contract_templates"] });
      toast.success("Template removido com sucesso!");
    },
    onError: (error) => {
      console.error("Error deleting template:", error);
      toast.error("Erro ao remover template");
    },
  });
}
