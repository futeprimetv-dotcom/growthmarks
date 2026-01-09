-- Create storage bucket for company logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-logos', 'company-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to logos
CREATE POLICY "Public can view logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'company-logos');

-- Allow authenticated users to upload logos
CREATE POLICY "Authenticated users can upload logos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'company-logos' AND auth.role() = 'authenticated');

-- Allow authenticated users to update logos
CREATE POLICY "Authenticated users can update logos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'company-logos' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete logos
CREATE POLICY "Authenticated users can delete logos"
ON storage.objects FOR DELETE
USING (bucket_id = 'company-logos' AND auth.role() = 'authenticated');

-- Create appearance settings table
CREATE TABLE IF NOT EXISTS public.appearance_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.appearance_settings ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read appearance settings
CREATE POLICY "Anyone can read appearance settings"
ON public.appearance_settings FOR SELECT
USING (true);

-- Allow authenticated users to update appearance settings
CREATE POLICY "Authenticated users can update appearance settings"
ON public.appearance_settings FOR UPDATE
USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert appearance settings
CREATE POLICY "Authenticated users can insert appearance settings"
ON public.appearance_settings FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Add update trigger for updated_at
CREATE TRIGGER update_appearance_settings_updated_at
BEFORE UPDATE ON public.appearance_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();