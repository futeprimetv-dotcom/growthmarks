-- Add signature fields to contracts table
ALTER TABLE public.contracts 
ADD COLUMN IF NOT EXISTS signature_token UUID DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS signature_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS signed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS signer_name TEXT,
ADD COLUMN IF NOT EXISTS signer_email TEXT,
ADD COLUMN IF NOT EXISTS signer_ip TEXT,
ADD COLUMN IF NOT EXISTS signature_sent_at TIMESTAMP WITH TIME ZONE;

-- Create index for token lookup
CREATE INDEX IF NOT EXISTS idx_contracts_signature_token ON public.contracts(signature_token);