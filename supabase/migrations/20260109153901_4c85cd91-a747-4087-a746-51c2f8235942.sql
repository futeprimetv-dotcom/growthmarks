-- Create lead_activities table for managing tasks and activities related to leads
CREATE TABLE public.lead_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'tarefa', -- ligacao, email, reuniao, whatsapp, tarefa
  title TEXT NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  reminder_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create lead_loss_reasons table for categorizing loss reasons
CREATE TABLE public.lead_loss_reasons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on lead_activities
ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;

-- Create policies for lead_activities
CREATE POLICY "Authenticated users can view lead_activities"
ON public.lead_activities
FOR SELECT
USING (is_authenticated());

CREATE POLICY "Authenticated users can manage lead_activities"
ON public.lead_activities
FOR ALL
USING (is_authenticated());

-- Enable RLS on lead_loss_reasons
ALTER TABLE public.lead_loss_reasons ENABLE ROW LEVEL SECURITY;

-- Create policies for lead_loss_reasons
CREATE POLICY "Authenticated users can view lead_loss_reasons"
ON public.lead_loss_reasons
FOR SELECT
USING (is_authenticated());

CREATE POLICY "Authenticated users can manage lead_loss_reasons"
ON public.lead_loss_reasons
FOR ALL
USING (is_authenticated());

-- Create trigger for lead_activities updated_at
CREATE TRIGGER update_lead_activities_updated_at
BEFORE UPDATE ON public.lead_activities
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for lead_loss_reasons updated_at
CREATE TRIGGER update_lead_loss_reasons_updated_at
BEFORE UPDATE ON public.lead_loss_reasons
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default loss reasons
INSERT INTO public.lead_loss_reasons (name, description) VALUES
  ('Preço', 'O lead considerou o preço muito alto'),
  ('Concorrência', 'O lead optou por um concorrente'),
  ('Timing', 'Não é o momento certo para o lead'),
  ('Sem resposta', 'O lead parou de responder'),
  ('Desistiu', 'O lead desistiu do projeto'),
  ('Fora do perfil', 'O lead não se encaixa no perfil ideal'),
  ('Outro', 'Outro motivo não listado');