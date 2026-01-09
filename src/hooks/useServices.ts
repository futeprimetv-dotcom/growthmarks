import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { logServiceActivity } from "@/lib/activityLogger";

export type Service = Tables<"services">;
export type ServiceInsert = TablesInsert<"services">;
export type ServiceUpdate = TablesUpdate<"services">;

export function useServices() {
  return useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*, clients(name)")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (service: ServiceInsert) => {
      const { data, error } = await supabase
        .from("services")
        .insert(service)
        .select()
        .single();
      
      if (error) throw error;

      // Log activity
      await logServiceActivity("create", data.id, data.name, {
        monthly_value: service.monthly_value,
        client_id: service.client_id,
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      queryClient.invalidateQueries({ queryKey: ["activity-logs"] });
      toast.success("Serviço criado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao criar serviço: " + error.message);
    },
  });
}

export function useUpdateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...service }: ServiceUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("services")
        .update(service)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;

      // Log activity
      await logServiceActivity("update", data.id, data.name, { updates: service });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      queryClient.invalidateQueries({ queryKey: ["activity-logs"] });
      toast.success("Serviço atualizado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar serviço: " + error.message);
    },
  });
}

export function useDeleteService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase
        .from("services")
        .delete()
        .eq("id", id);
      
      if (error) throw error;

      // Log activity
      await logServiceActivity("delete", id, name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      queryClient.invalidateQueries({ queryKey: ["activity-logs"] });
      toast.success("Serviço excluído com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir serviço: " + error.message);
    },
  });
}
