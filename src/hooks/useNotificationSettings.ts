import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface NotificationSettings {
  id?: string;
  user_id?: string;
  deadline_reminders: boolean;
  hot_lead_alerts: boolean;
  daily_summary: boolean;
  weekly_report: boolean;
  contract_expiry_alerts: boolean;
  payment_reminders: boolean;
  summary_email_time: string;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  deadline_reminders: true,
  hot_lead_alerts: true,
  daily_summary: false,
  weekly_report: true,
  contract_expiry_alerts: true,
  payment_reminders: true,
  summary_email_time: '08:00',
};

export function useNotificationSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['notification-settings', user?.id],
    queryFn: async () => {
      if (!user?.id) return DEFAULT_SETTINGS;

      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data || DEFAULT_SETTINGS;
    },
    enabled: !!user?.id,
  });

  const updateSettings = useMutation({
    mutationFn: async (newSettings: Partial<NotificationSettings>) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data: existing } = await supabase
        .from('notification_settings')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('notification_settings')
          .update(newSettings)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('notification_settings')
          .insert({ ...DEFAULT_SETTINGS, ...newSettings, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-settings'] });
      toast.success('Configurações de notificação salvas!');
    },
    onError: (error) => {
      console.error('Error updating notification settings:', error);
      toast.error('Erro ao salvar configurações');
    },
  });

  return {
    settings: settings || DEFAULT_SETTINGS,
    isLoading,
    updateSettings,
  };
}
