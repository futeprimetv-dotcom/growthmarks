import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { logTeamMemberActivity } from "@/lib/activityLogger";

export type TeamMember = Tables<"team_members">;
export type TeamMemberInsert = TablesInsert<"team_members">;
export type TeamMemberUpdate = TablesUpdate<"team_members">;

export function useTeamMembers() {
  return useQuery({
    queryKey: ["team_members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_members")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data as TeamMember[];
    },
  });
}

export function useTeamMember(id: string | undefined) {
  return useQuery({
    queryKey: ["team_members", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("team_members")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      
      if (error) throw error;
      return data as TeamMember | null;
    },
    enabled: !!id,
  });
}

export function useCreateTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (member: TeamMemberInsert) => {
      const { data, error } = await supabase
        .from("team_members")
        .insert(member)
        .select()
        .single();
      
      if (error) throw error;

      // Log activity
      await logTeamMemberActivity("create", data.id, data.name, {
        role: member.role,
        email: member.email,
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team_members"] });
      queryClient.invalidateQueries({ queryKey: ["activity-logs"] });
      toast.success("Membro criado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao criar membro: " + error.message);
    },
  });
}

export function useUpdateTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...member }: TeamMemberUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("team_members")
        .update(member)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;

      // Log activity
      await logTeamMemberActivity("update", data.id, data.name, { updates: member });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team_members"] });
      queryClient.invalidateQueries({ queryKey: ["activity-logs"] });
      toast.success("Membro atualizado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar membro: " + error.message);
    },
  });
}

export function useDeleteTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase
        .from("team_members")
        .delete()
        .eq("id", id);
      
      if (error) throw error;

      // Log activity
      await logTeamMemberActivity("delete", id, name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team_members"] });
      queryClient.invalidateQueries({ queryKey: ["activity-logs"] });
      toast.success("Membro excluído com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir membro: " + error.message);
    },
  });
}
