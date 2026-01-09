import { useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Json } from "@/integrations/supabase/types";

export interface UserSession {
  id: string;
  user_id: string;
  user_email: string | null;
  user_name: string | null;
  last_activity_at: string;
  last_login_at: string;
  is_online: boolean;
  total_time_online_minutes: number;
  session_started_at: string | null;
  created_at: string;
  updated_at: string;
}

const HEARTBEAT_INTERVAL = 60000; // 1 minute
const OFFLINE_THRESHOLD = 5 * 60 * 1000; // 5 minutes

export function useUserSessions() {
  const { data: sessions, isLoading, refetch } = useQuery({
    queryKey: ['user-sessions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .order('last_activity_at', { ascending: false });

      if (error) throw error;
      return data as UserSession[];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Calculate if user is truly online based on last_activity_at
  const sessionsWithOnlineStatus = sessions?.map(session => ({
    ...session,
    is_online: new Date().getTime() - new Date(session.last_activity_at).getTime() < OFFLINE_THRESHOLD,
  }));

  return {
    sessions: sessionsWithOnlineStatus || [],
    isLoading,
    refetch,
  };
}

export function useTrackUserSession() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const updateSession = useMutation({
    mutationFn: async (updates: Partial<UserSession>) => {
      if (!user?.id) return;

      const { data: existing } = await supabase
        .from('user_sessions')
        .select('id, session_started_at, total_time_online_minutes')
        .eq('user_id', user.id)
        .maybeSingle();

      const now = new Date().toISOString();

      if (existing) {
        // Calculate time online since session started
        let additionalMinutes = 0;
        if (existing.session_started_at) {
          const sessionStart = new Date(existing.session_started_at).getTime();
          const now = new Date().getTime();
          additionalMinutes = Math.floor((now - sessionStart) / 60000);
        }

        const { error } = await supabase
          .from('user_sessions')
          .update({
            last_activity_at: now,
            is_online: true,
            ...updates,
          })
          .eq('user_id', user.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_sessions')
          .insert([{
            user_id: user.id,
            user_email: user.email,
            user_name: user.user_metadata?.full_name || user.email,
            last_activity_at: now,
            last_login_at: now,
            is_online: true,
            session_started_at: now,
            total_time_online_minutes: 0,
          }]);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-sessions'] });
    },
  });

  const markLogin = useCallback(async () => {
    if (!user?.id) return;

    const now = new Date().toISOString();
    
    const { data: existing } = await supabase
      .from('user_sessions')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('user_sessions')
        .update({
          last_login_at: now,
          last_activity_at: now,
          is_online: true,
          session_started_at: now,
        })
        .eq('user_id', user.id);
    } else {
      await supabase
        .from('user_sessions')
        .insert([{
          user_id: user.id,
          user_email: user.email,
          user_name: user.user_metadata?.full_name || user.email,
          last_activity_at: now,
          last_login_at: now,
          is_online: true,
          session_started_at: now,
          total_time_online_minutes: 0,
        }]);
    }
  }, [user]);

  const markOffline = useCallback(async () => {
    if (!user?.id) return;

    const { data: session } = await supabase
      .from('user_sessions')
      .select('session_started_at, total_time_online_minutes')
      .eq('user_id', user.id)
      .maybeSingle();

    if (session) {
      let additionalMinutes = 0;
      if (session.session_started_at) {
        const sessionStart = new Date(session.session_started_at).getTime();
        const now = new Date().getTime();
        additionalMinutes = Math.floor((now - sessionStart) / 60000);
      }

      await supabase
        .from('user_sessions')
        .update({
          is_online: false,
          session_started_at: null,
          total_time_online_minutes: (session.total_time_online_minutes || 0) + additionalMinutes,
        })
        .eq('user_id', user.id);
    }
  }, [user]);

  // Heartbeat to update last_activity_at
  useEffect(() => {
    if (!user?.id) return;

    // Initial mark as online
    markLogin();

    const interval = setInterval(() => {
      updateSession.mutate({});
    }, HEARTBEAT_INTERVAL);

    // Mark offline when leaving
    const handleBeforeUnload = () => {
      markOffline();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      markOffline();
    };
  }, [user?.id]);

  return {
    updateSession,
    markLogin,
    markOffline,
  };
}
