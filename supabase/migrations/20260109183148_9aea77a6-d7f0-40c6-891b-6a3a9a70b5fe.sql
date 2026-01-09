-- Create prospects table
CREATE TABLE public.prospects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  cnpj TEXT,
  segment TEXT,
  cnae_code TEXT,
  cnae_description TEXT,
  company_size TEXT, -- MEI, ME, EPP, Medio, Grande
  city TEXT,
  state TEXT,
  neighborhood TEXT,
  zip_code TEXT,
  has_website BOOLEAN DEFAULT false,
  website_url TEXT,
  has_phone BOOLEAN DEFAULT false,
  has_email BOOLEAN DEFAULT false,
  emails TEXT[] DEFAULT '{}',
  phones TEXT[] DEFAULT '{}',
  emails_count INTEGER DEFAULT 0,
  phones_count INTEGER DEFAULT 0,
  data_revealed BOOLEAN DEFAULT false,
  revealed_at TIMESTAMPTZ,
  social_links JSONB DEFAULT '{}',
  status TEXT DEFAULT 'novo',
  tags TEXT[] DEFAULT '{}',
  source TEXT DEFAULT 'manual',
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create prospect_lists table
CREATE TABLE public.prospect_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create prospect_list_items table
CREATE TABLE public.prospect_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID REFERENCES public.prospect_lists(id) ON DELETE CASCADE,
  prospect_id UUID REFERENCES public.prospects(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(list_id, prospect_id)
);

-- Create saved_searches table
CREATE TABLE public.saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  filters JSONB NOT NULL DEFAULT '{}',
  results_count INTEGER DEFAULT 0,
  search_type TEXT DEFAULT 'prospeccao',
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prospect_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prospect_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;

-- RLS Policies for prospects
CREATE POLICY "Authenticated users can view prospects"
ON public.prospects FOR SELECT
USING (is_authenticated());

CREATE POLICY "Authenticated users can manage prospects"
ON public.prospects FOR ALL
USING (is_authenticated());

-- RLS Policies for prospect_lists
CREATE POLICY "Authenticated users can view prospect_lists"
ON public.prospect_lists FOR SELECT
USING (is_authenticated());

CREATE POLICY "Authenticated users can manage prospect_lists"
ON public.prospect_lists FOR ALL
USING (is_authenticated());

-- RLS Policies for prospect_list_items
CREATE POLICY "Authenticated users can view prospect_list_items"
ON public.prospect_list_items FOR SELECT
USING (is_authenticated());

CREATE POLICY "Authenticated users can manage prospect_list_items"
ON public.prospect_list_items FOR ALL
USING (is_authenticated());

-- RLS Policies for saved_searches
CREATE POLICY "Authenticated users can view saved_searches"
ON public.saved_searches FOR SELECT
USING (is_authenticated());

CREATE POLICY "Authenticated users can manage saved_searches"
ON public.saved_searches FOR ALL
USING (is_authenticated());

-- Create triggers for updated_at
CREATE TRIGGER update_prospects_updated_at
BEFORE UPDATE ON public.prospects
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_prospect_lists_updated_at
BEFORE UPDATE ON public.prospect_lists
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_saved_searches_updated_at
BEFORE UPDATE ON public.saved_searches
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();