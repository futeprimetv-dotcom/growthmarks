import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export interface ArchivedItem {
  id: string;
  item_type: string;
  original_id: string;
  original_data: Record<string, unknown>;
  archived_by: string | null;
  archived_at: string;
  restored_at: string | null;
  permanently_deleted_at: string | null;
  deleted_by: string | null;
}

export const useArchivedItems = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: archivedItems = [], isLoading } = useQuery({
    queryKey: ["archived-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("archived_items" as never)
        .select("*")
        .is("permanently_deleted_at", null)
        .is("restored_at", null)
        .order("archived_at", { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as ArchivedItem[];
    },
  });

  const archiveItem = useMutation({
    mutationFn: async ({ 
      itemType, 
      originalId, 
      originalData 
    }: { 
      itemType: string; 
      originalId: string; 
      originalData: Record<string, unknown>;
    }) => {
      // First, insert into archived_items
      const { error: archiveError } = await supabase
        .from("archived_items" as never)
        .insert({
          item_type: itemType,
          original_id: originalId,
          original_data: originalData,
          archived_by: user?.id,
        } as never);

      if (archiveError) throw archiveError;

      // Then, set is_archived = true on the original table
      const tableMap: Record<string, string> = {
        client: "clients",
        lead: "leads",
        demand: "demands",
        planning: "plannings",
        contract: "contracts",
        service: "services",
        product: "products",
        expense: "expenses",
        goal: "goals",
      };

      const tableName = tableMap[itemType];
      if (tableName) {
        const { error: updateError } = await supabase
          .from(tableName as never)
          .update({ is_archived: true } as never)
          .eq("id", originalId);

        if (updateError) throw updateError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["archived-items"] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["demands"] });
      toast.success("Item arquivado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao arquivar item: " + error.message);
    },
  });

  const restoreItem = useMutation({
    mutationFn: async ({ id, itemType, originalId }: { id: string; itemType: string; originalId: string }) => {
      // Update archived_items to mark as restored
      const { error: restoreError } = await supabase
        .from("archived_items" as never)
        .update({ restored_at: new Date().toISOString() } as never)
        .eq("id", id);

      if (restoreError) throw restoreError;

      // Set is_archived = false on the original table
      const tableMap: Record<string, string> = {
        client: "clients",
        lead: "leads",
        demand: "demands",
        planning: "plannings",
        contract: "contracts",
        service: "services",
        product: "products",
        expense: "expenses",
        goal: "goals",
      };

      const tableName = tableMap[itemType];
      if (tableName) {
        const { error: updateError } = await supabase
          .from(tableName as never)
          .update({ is_archived: false } as never)
          .eq("id", originalId);

        if (updateError) throw updateError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["archived-items"] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["demands"] });
      toast.success("Item restaurado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao restaurar item: " + error.message);
    },
  });

  const deletePermanently = useMutation({
    mutationFn: async ({ id, itemType, originalId }: { id: string; itemType: string; originalId: string }) => {
      // Mark as permanently deleted in archived_items
      const { error: deleteError } = await supabase
        .from("archived_items" as never)
        .update({ 
          permanently_deleted_at: new Date().toISOString(),
          deleted_by: user?.id,
        } as never)
        .eq("id", id);

      if (deleteError) throw deleteError;

      // Actually delete from the original table
      const tableMap: Record<string, string> = {
        client: "clients",
        lead: "leads",
        demand: "demands",
        planning: "plannings",
        contract: "contracts",
        service: "services",
        product: "products",
        expense: "expenses",
        goal: "goals",
      };

      const tableName = tableMap[itemType];
      if (tableName) {
        const { error: hardDeleteError } = await supabase
          .from(tableName as never)
          .delete()
          .eq("id", originalId);

        if (hardDeleteError) throw hardDeleteError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["archived-items"] });
      toast.success("Item excluído permanentemente!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir item: " + error.message);
    },
  });

  return {
    archivedItems,
    isLoading,
    archiveItem,
    restoreItem,
    deletePermanently,
  };
};
