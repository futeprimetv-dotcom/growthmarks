-- Create junction table for contract services
CREATE TABLE public.contract_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.available_services(id) ON DELETE CASCADE,
  custom_price NUMERIC,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(contract_id, service_id)
);

-- Enable RLS
ALTER TABLE public.contract_services ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Authenticated users can view contract_services"
  ON public.contract_services
  FOR SELECT
  USING (is_authenticated());

CREATE POLICY "Authenticated users can manage contract_services"
  ON public.contract_services
  FOR ALL
  USING (is_authenticated());

-- Create trigger for updated_at
CREATE TRIGGER update_contract_services_updated_at
  BEFORE UPDATE ON public.contract_services
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();