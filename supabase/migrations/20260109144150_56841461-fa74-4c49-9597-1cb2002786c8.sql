-- Add new fields to leads table for complete CRM
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS state text,
ADD COLUMN IF NOT EXISTS instagram text,
ADD COLUMN IF NOT EXISTS whatsapp text,
ADD COLUMN IF NOT EXISTS invests_in_marketing boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS current_investment numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS main_pain text,
ADD COLUMN IF NOT EXISTS urgency text DEFAULT 'media',
ADD COLUMN IF NOT EXISTS awareness_level text DEFAULT 'nao_sabe',
ADD COLUMN IF NOT EXISTS authority text DEFAULT 'decisor',
ADD COLUMN IF NOT EXISTS contact_channel text DEFAULT 'whatsapp',
ADD COLUMN IF NOT EXISTS segment text,
ADD COLUMN IF NOT EXISTS digital_maturity text DEFAULT 'iniciante',
ADD COLUMN IF NOT EXISTS ltv_potential text DEFAULT 'medio',
ADD COLUMN IF NOT EXISTS is_recurring_client boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS cross_sell_possible boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS cross_sell_services text[],
ADD COLUMN IF NOT EXISTS referred_by text,
ADD COLUMN IF NOT EXISTS tags text[],
ADD COLUMN IF NOT EXISTS utm_source text,
ADD COLUMN IF NOT EXISTS lead_score integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS loss_reason text,
ADD COLUMN IF NOT EXISTS closing_probability integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS expected_close_date date,
ADD COLUMN IF NOT EXISTS ticket_level text DEFAULT 'medio',
ADD COLUMN IF NOT EXISTS contract_type text DEFAULT 'mensal';

-- Create lead_history table for tracking interactions
CREATE TABLE IF NOT EXISTS public.lead_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  description text,
  contact_channel text,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on lead_history
ALTER TABLE public.lead_history ENABLE ROW LEVEL SECURITY;

-- Create policies for lead_history
CREATE POLICY "Authenticated users can view lead_history" 
ON public.lead_history 
FOR SELECT 
USING (is_authenticated());

CREATE POLICY "Authenticated users can manage lead_history" 
ON public.lead_history 
FOR ALL 
USING (is_authenticated());

-- Create CRM settings table
CREATE TABLE IF NOT EXISTS public.crm_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key text NOT NULL UNIQUE,
  setting_value jsonb NOT NULL DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on crm_settings
ALTER TABLE public.crm_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for crm_settings
CREATE POLICY "Authenticated users can view crm_settings" 
ON public.crm_settings 
FOR SELECT 
USING (is_authenticated());

CREATE POLICY "Authenticated users can manage crm_settings" 
ON public.crm_settings 
FOR ALL 
USING (is_authenticated());

-- Insert default CRM settings
INSERT INTO public.crm_settings (setting_key, setting_value) VALUES 
('lead_origins', '["instagram", "whatsapp", "site", "indicacao", "trafego_pago", "prospeccao_ativa", "google", "linkedin", "outro"]'),
('services_interest', '["gestao_trafego", "social_media", "site_landing_page", "branding", "crm_automacao"]'),
('pipeline_statuses', '["novo", "contato_inicial", "em_qualificacao", "reuniao_agendada", "proposta_enviada", "negociacao", "fechamento", "perdido", "lead_frio"]'),
('lead_score_weights', '{"temperature": 30, "urgency": 25, "authority": 20, "investment": 15, "interactions": 10}'),
('segments', '["educacao", "estetica", "automotivo", "logistica", "servicos", "saude", "varejo", "tecnologia", "outro"]'),
('loss_reasons', '["preco", "sem_prioridade", "nao_respondeu", "fechou_com_concorrente", "nao_qualificado", "outro"]')
ON CONFLICT (setting_key) DO NOTHING;

-- Add trigger for updated_at on crm_settings
CREATE TRIGGER update_crm_settings_updated_at
BEFORE UPDATE ON public.crm_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create dashboard_layouts table for user preferences
CREATE TABLE IF NOT EXISTS public.dashboard_layouts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  layout jsonb NOT NULL DEFAULT '[]',
  visible_widgets text[] DEFAULT ARRAY['stats', 'urgentDemands', 'todayDeadlines', 'weeklyChart', 'revenueChart'],
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on dashboard_layouts
ALTER TABLE public.dashboard_layouts ENABLE ROW LEVEL SECURITY;

-- Create policies for dashboard_layouts
CREATE POLICY "Users can view their own dashboard layout" 
ON public.dashboard_layouts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own dashboard layout" 
ON public.dashboard_layouts 
FOR ALL 
USING (auth.uid() = user_id);

-- Add trigger for updated_at on dashboard_layouts
CREATE TRIGGER update_dashboard_layouts_updated_at
BEFORE UPDATE ON public.dashboard_layouts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();