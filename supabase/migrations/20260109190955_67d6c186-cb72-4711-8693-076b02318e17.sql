-- Add CNPJ cadastral situation to prospects so we can enforce 'only active CNPJs'
ALTER TABLE public.prospects
ADD COLUMN IF NOT EXISTS cnpj_situacao TEXT;

-- Backfill existing rows to 'ATIVA' to avoid empty results for legacy data
UPDATE public.prospects
SET cnpj_situacao = COALESCE(cnpj_situacao, 'ATIVA');

-- Optional index for filtering
CREATE INDEX IF NOT EXISTS idx_prospects_cnpj_situacao ON public.prospects (cnpj_situacao);