-- Função para criar membro da equipe automaticamente quando um novo usuário se registra
CREATE OR REPLACE FUNCTION public.handle_new_user_team_member()
RETURNS TRIGGER AS $$
BEGIN
  -- Verifica se já existe um membro com esse user_id ou email
  IF NOT EXISTS (
    SELECT 1 FROM public.team_members 
    WHERE user_id = NEW.id OR email = NEW.email
  ) THEN
    INSERT INTO public.team_members (
      user_id,
      name,
      email,
      role
    ) VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
      NEW.email,
      'Colaborador(a)'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para executar a função quando um novo usuário é criado
DROP TRIGGER IF EXISTS on_auth_user_created_team_member ON auth.users;
CREATE TRIGGER on_auth_user_created_team_member
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_team_member();

-- Inserir usuários existentes que ainda não estão na tabela team_members
INSERT INTO public.team_members (user_id, name, email, role)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
  u.email,
  'Colaborador(a)'
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.team_members tm 
  WHERE tm.user_id = u.id OR tm.email = u.email
);