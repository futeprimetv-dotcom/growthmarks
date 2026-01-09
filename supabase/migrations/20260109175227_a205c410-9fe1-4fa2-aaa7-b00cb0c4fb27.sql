-- Create sales_funnels table
CREATE TABLE IF NOT EXISTS public.sales_funnels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#f97316',
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sales_funnels ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Authenticated users can view sales_funnels"
ON public.sales_funnels FOR SELECT
USING (is_authenticated());

CREATE POLICY "Authenticated users can manage sales_funnels"
ON public.sales_funnels FOR ALL
USING (is_authenticated());

-- Add trigger for updated_at
CREATE TRIGGER update_sales_funnels_updated_at
BEFORE UPDATE ON public.sales_funnels
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add funnel_id to leads table (nullable for backward compatibility)
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS funnel_id UUID REFERENCES public.sales_funnels(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_leads_funnel_id ON public.leads(funnel_id);

-- Insert default funnel
INSERT INTO public.sales_funnels (name, description, color, is_default, position)
VALUES ('Serviços', 'Funil padrão para prospecção de serviços', '#f97316', true, 0);

-- Update all existing leads to use the default funnel
UPDATE public.leads 
SET funnel_id = (SELECT id FROM public.sales_funnels WHERE is_default = true LIMIT 1)
WHERE funnel_id IS NULL;