import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Database } from "@/integrations/supabase/types";

type RoleType = Database["public"]["Enums"]["user_role_type"];

export interface PendingUser {
  id: string;
  user_id: string;
  name: string;
  email: string;
  created_at: string;
}

export function usePendingUsers() {
  return useQuery({
    queryKey: ["pending_users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_members")
        .select("id, user_id, name, email, created_at")
        .eq("is_approved", false)
        .not("user_id", "is", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as PendingUser[];
    },
  });
}

export function useApproveUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      teamMemberId,
      role,
      roleType,
    }: {
      teamMemberId: string;
      role: string;
      roleType: RoleType;
    }) => {
      const { data, error } = await supabase.rpc("approve_user", {
        p_team_member_id: teamMemberId,
        p_role: role,
        p_role_type: roleType,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending_users"] });
      queryClient.invalidateQueries({ queryKey: ["team_members"] });
      toast.success("Usuário aprovado com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao aprovar usuário: " + error.message);
    },
  });
}

export function useRejectUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (teamMemberId: string) => {
      const { data, error } = await supabase.rpc("reject_user", {
        p_team_member_id: teamMemberId,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending_users"] });
      queryClient.invalidateQueries({ queryKey: ["team_members"] });
      toast.success("Usuário rejeitado");
    },
    onError: (error: any) => {
      toast.error("Erro ao rejeitar usuário: " + error.message);
    },
  });
}

export function useUserApprovalStatus(userId: string | undefined) {
  return useQuery({
    queryKey: ["user_approval_status", userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from("team_members")
        .select("is_approved")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) throw error;
      return data?.is_approved ?? false;
    },
    enabled: !!userId,
  });
}
