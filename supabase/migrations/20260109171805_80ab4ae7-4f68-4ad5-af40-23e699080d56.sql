-- Table for notification settings
CREATE TABLE public.notification_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  deadline_reminders BOOLEAN DEFAULT true,
  hot_lead_alerts BOOLEAN DEFAULT true,
  daily_summary BOOLEAN DEFAULT false,
  weekly_report BOOLEAN DEFAULT true,
  contract_expiry_alerts BOOLEAN DEFAULT true,
  payment_reminders BOOLEAN DEFAULT true,
  summary_email_time TEXT DEFAULT '08:00',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Table for activity logs
CREATE TABLE public.activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  user_email TEXT,
  action_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  entity_name TEXT,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for notification_settings
CREATE POLICY "Users can view their own notification settings"
ON public.notification_settings
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification settings"
ON public.notification_settings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification settings"
ON public.notification_settings
FOR UPDATE
USING (auth.uid() = user_id);

-- RLS policies for activity_logs (only gestao can view all, users see their own)
CREATE POLICY "Gestao can view all activity logs"
ON public.activity_logs
FOR SELECT
USING (public.is_gestao());

CREATE POLICY "Users can view their own activity logs"
ON public.activity_logs
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert activity logs"
ON public.activity_logs
FOR INSERT
WITH CHECK (public.is_authenticated());

-- Trigger for updated_at
CREATE TRIGGER update_notification_settings_updated_at
BEFORE UPDATE ON public.notification_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster log queries
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX idx_activity_logs_entity_type ON public.activity_logs(entity_type);