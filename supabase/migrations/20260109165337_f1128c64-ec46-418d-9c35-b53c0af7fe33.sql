-- Add 'vendedor' to the user_role_type enum
ALTER TYPE public.user_role_type ADD VALUE IF NOT EXISTS 'vendedor';