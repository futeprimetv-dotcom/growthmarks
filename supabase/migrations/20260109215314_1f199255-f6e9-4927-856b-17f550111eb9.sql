-- Create table to cache CNPJ lookups and reduce API calls
CREATE TABLE public.cnpj_cache (
  cnpj TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  source TEXT NOT NULL DEFAULT 'brasilapi',
  situacao TEXT,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  hit_count INTEGER NOT NULL DEFAULT 0,
  last_accessed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for cleanup queries
CREATE INDEX idx_cnpj_cache_expires_at ON public.cnpj_cache(expires_at);
CREATE INDEX idx_cnpj_cache_situacao ON public.cnpj_cache(situacao);

-- Add comment
COMMENT ON TABLE public.cnpj_cache IS 'Cache for CNPJ lookup results to reduce external API calls';

-- Enable RLS but allow service role access
ALTER TABLE public.cnpj_cache ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to read cache (everyone can read)
CREATE POLICY "Anyone can read cnpj cache"
  ON public.cnpj_cache
  FOR SELECT
  USING (true);

-- Policy for edge functions (service role) to insert/update
CREATE POLICY "Service role can manage cnpj cache"
  ON public.cnpj_cache
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Function to clean expired cache entries (can be called periodically)
CREATE OR REPLACE FUNCTION public.cleanup_expired_cnpj_cache()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.cnpj_cache WHERE expires_at < now();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Function to increment hit count when cache is accessed
CREATE OR REPLACE FUNCTION public.touch_cnpj_cache(p_cnpj TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.cnpj_cache 
  SET 
    hit_count = hit_count + 1,
    last_accessed_at = now()
  WHERE cnpj = p_cnpj;
END;
$$;