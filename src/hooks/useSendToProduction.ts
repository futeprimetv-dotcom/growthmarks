import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PlanningContent } from "./usePlannings";

interface SendToProductionParams {
  content: PlanningContent;
  clientId: string;
  planningId: string;
}

export function useSendToProduction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ content, clientId, planningId }: SendToProductionParams) => {
      // Create demand from content
      const { data: demand, error: demandError } = await supabase
        .from("demands")
        .insert({
          title: content.title,
          description: content.description || `Conteúdo do tipo ${content.type} para ${content.platform || 'redes sociais'}`,
          client_id: clientId,
          status: "todo",
          priority: "medium",
          deadline: content.scheduled_date,
          tags: [content.type, content.platform].filter(Boolean) as string[],
        })
        .select()
        .single();

      if (demandError) throw demandError;

      // Update content with demand_id and send_to_production flag
      const { error: contentError } = await supabase
        .from("planning_contents")
        .update({
          send_to_production: true,
          demand_id: demand.id,
        })
        .eq("id", content.id);

      if (contentError) throw contentError;

      return { demand, planningId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["planning-contents", data.planningId] });
      queryClient.invalidateQueries({ queryKey: ["demands"] });
      toast.success("Conteúdo enviado para produção!");
    },
    onError: (error) => {
      toast.error("Erro ao enviar para produção: " + error.message);
    },
  });
}

export function useUndoSendToProduction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ contentId, demandId, planningId }: { contentId: string; demandId: string; planningId: string }) => {
      // Delete the demand
      const { error: demandError } = await supabase
        .from("demands")
        .delete()
        .eq("id", demandId);

      if (demandError) throw demandError;

      // Update content to remove link
      const { error: contentError } = await supabase
        .from("planning_contents")
        .update({
          send_to_production: false,
          demand_id: null,
        })
        .eq("id", contentId);

      if (contentError) throw contentError;

      return { planningId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["planning-contents", data.planningId] });
      queryClient.invalidateQueries({ queryKey: ["demands"] });
      toast.success("Envio para produção cancelado!");
    },
    onError: (error) => {
      toast.error("Erro ao cancelar envio: " + error.message);
    },
  });
}
