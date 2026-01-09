-- Create table for receivables (contas a receber)
CREATE TABLE public.receivables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id),
  description TEXT NOT NULL,
  value NUMERIC NOT NULL,
  due_date DATE NOT NULL,
  reference_month INTEGER NOT NULL,
  reference_year INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMP WITH TIME ZONE,
  paid_value NUMERIC,
  payment_method TEXT,
  notes TEXT,
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for payables (contas a pagar)
CREATE TABLE public.payables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  value NUMERIC NOT NULL,
  due_date DATE NOT NULL,
  reference_month INTEGER NOT NULL,
  reference_year INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMP WITH TIME ZONE,
  paid_value NUMERIC,
  payment_method TEXT,
  supplier TEXT,
  notes TEXT,
  recurring BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.receivables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payables ENABLE ROW LEVEL SECURITY;

-- RLS Policies for receivables
CREATE POLICY "Authenticated users can view receivables" 
ON public.receivables 
FOR SELECT 
USING (is_authenticated());

CREATE POLICY "Authenticated users can manage receivables" 
ON public.receivables 
FOR ALL 
USING (is_authenticated());

-- RLS Policies for payables
CREATE POLICY "Authenticated users can view payables" 
ON public.payables 
FOR SELECT 
USING (is_authenticated());

CREATE POLICY "Authenticated users can manage payables" 
ON public.payables 
FOR ALL 
USING (is_authenticated());

-- Indexes for better performance
CREATE INDEX idx_receivables_reference ON public.receivables(reference_year, reference_month);
CREATE INDEX idx_receivables_status ON public.receivables(status);
CREATE INDEX idx_receivables_due_date ON public.receivables(due_date);

CREATE INDEX idx_payables_reference ON public.payables(reference_year, reference_month);
CREATE INDEX idx_payables_status ON public.payables(status);
CREATE INDEX idx_payables_due_date ON public.payables(due_date);

-- Triggers for updated_at
CREATE TRIGGER update_receivables_updated_at
BEFORE UPDATE ON public.receivables
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payables_updated_at
BEFORE UPDATE ON public.payables
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();