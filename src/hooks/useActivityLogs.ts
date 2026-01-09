import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Json } from "@/integrations/supabase/types";

export interface ActivityLog {
  id: string;
  user_id: string | null;
  user_email: string | null;
  action_type: string;
  entity_type: string;
  entity_id: string | null;
  entity_name: string | null;
  description: string | null;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
}

export function useActivityLogs(limit = 50) {
  const { user } = useAuth();

  const { data: logs, isLoading, refetch } = useQuery({
    queryKey: ['activity-logs', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as ActivityLog[];
    },
    enabled: !!user?.id,
  });

  return {
    logs: logs || [],
    isLoading,
    refetch,
  };
}

export function useLogActivity() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (log: {
      action_type: string;
      entity_type: string;
      entity_id?: string;
      entity_name?: string;
      description?: string;
      metadata?: Record<string, unknown>;
    }) => {
      const insertData = {
        user_id: user?.id,
        user_email: user?.email ?? undefined,
        action_type: log.action_type,
        entity_type: log.entity_type,
        entity_id: log.entity_id,
        entity_name: log.entity_name,
        description: log.description,
        metadata: (log.metadata || {}) as Json,
      };

      const { error } = await supabase
        .from('activity_logs')
        .insert([insertData]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
    },
  });
}
