-- Create INSERT policy with WITH CHECK
CREATE POLICY "Authenticated users can insert prospects" 
ON public.prospects 
FOR INSERT 
WITH CHECK (is_authenticated());

-- Create UPDATE policy if not exists
DROP POLICY IF EXISTS "Authenticated users can update prospects" ON public.prospects;
CREATE POLICY "Authenticated users can update prospects" 
ON public.prospects 
FOR UPDATE 
USING (is_authenticated());

-- Create DELETE policy if not exists
DROP POLICY IF EXISTS "Authenticated users can delete prospects" ON public.prospects;
CREATE POLICY "Authenticated users can delete prospects" 
ON public.prospects 
FOR DELETE 
USING (is_authenticated());

-- Drop the ALL policy since we have specific ones now
DROP POLICY IF EXISTS "Authenticated users can manage prospects" ON public.prospects;