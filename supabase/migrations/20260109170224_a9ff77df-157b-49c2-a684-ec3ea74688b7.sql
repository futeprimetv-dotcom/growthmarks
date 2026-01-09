-- Allow gestao users to view all profiles (for linking team members)
CREATE POLICY "Gestao can view all profiles"
ON public.profiles
FOR SELECT
USING (is_gestao());

-- Allow gestao users to manage user_roles
CREATE POLICY "Gestao can manage user_roles"
ON public.user_roles
FOR ALL
USING (is_gestao());

-- Allow gestao to view all user_roles (for showing access levels)
CREATE POLICY "Gestao can view all user_roles"
ON public.user_roles
FOR SELECT
USING (is_gestao());