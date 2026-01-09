-- Adicionar campo de aprovação na tabela team_members
ALTER TABLE public.team_members 
ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- Aprovar os usuários existentes (Paulo e Isabela)
UPDATE public.team_members 
SET is_approved = true, approved_at = now()
WHERE user_id IS NOT NULL;

-- Garantir que Paulo e Isabela tenham role de gestão
INSERT INTO public.user_roles (user_id, role, role_type)
SELECT tm.user_id, 'admin', 'gestao'
FROM public.team_members tm
WHERE tm.user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur WHERE ur.user_id = tm.user_id
  );

-- Atualizar a função de criação automática para NÃO aprovar automaticamente
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
      role,
      is_approved
    ) VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
      NEW.email,
      'Pendente',
      false  -- Novo usuário começa como NÃO aprovado
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Função para aprovar usuário (será chamada pelos gestores)
CREATE OR REPLACE FUNCTION public.approve_user(
  p_team_member_id UUID,
  p_role TEXT,
  p_role_type public.user_role_type
)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
  v_approver_id UUID;
BEGIN
  -- Pega o ID do aprovador
  v_approver_id := auth.uid();
  
  -- Verifica se o aprovador é gestor
  IF NOT public.has_role_type('gestao', v_approver_id) THEN
    RAISE EXCEPTION 'Apenas gestores podem aprovar usuários';
  END IF;
  
  -- Busca o user_id do membro
  SELECT user_id INTO v_user_id
  FROM public.team_members
  WHERE id = p_team_member_id;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Membro não encontrado ou sem user_id vinculado';
  END IF;
  
  -- Atualiza o team_member
  UPDATE public.team_members
  SET 
    is_approved = true,
    approved_by = v_approver_id,
    approved_at = now(),
    role = p_role
  WHERE id = p_team_member_id;
  
  -- Cria ou atualiza o role do usuário
  INSERT INTO public.user_roles (user_id, role, role_type)
  VALUES (v_user_id, 'user', p_role_type)
  ON CONFLICT (user_id, role) 
  DO UPDATE SET role_type = p_role_type;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Função para verificar se usuário está aprovado
CREATE OR REPLACE FUNCTION public.is_user_approved(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.team_members
    WHERE user_id = p_user_id AND is_approved = true
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Função para rejeitar usuário (delete do team_member)
CREATE OR REPLACE FUNCTION public.reject_user(p_team_member_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_approver_id UUID;
BEGIN
  v_approver_id := auth.uid();
  
  -- Verifica se o aprovador é gestor
  IF NOT public.has_role_type('gestao', v_approver_id) THEN
    RAISE EXCEPTION 'Apenas gestores podem rejeitar usuários';
  END IF;
  
  -- Remove o membro pendente
  DELETE FROM public.team_members
  WHERE id = p_team_member_id AND is_approved = false;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;