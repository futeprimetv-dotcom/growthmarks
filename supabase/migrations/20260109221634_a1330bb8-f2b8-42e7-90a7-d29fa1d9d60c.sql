-- Add pending_role_type to team_members for pre-approval
ALTER TABLE public.team_members 
ADD COLUMN IF NOT EXISTS pending_role_type public.user_role_type DEFAULT NULL;

-- Update the handle_new_user_team_member function to auto-approve pre-approved members
CREATE OR REPLACE FUNCTION public.handle_new_user_team_member()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_team_member_id UUID;
  v_pending_role_type public.user_role_type;
  v_is_pre_approved BOOLEAN;
BEGIN
  -- Check if there's an existing team member with this email
  SELECT id, pending_role_type, is_approved 
  INTO v_team_member_id, v_pending_role_type, v_is_pre_approved
  FROM public.team_members 
  WHERE email = NEW.email;
  
  IF v_team_member_id IS NOT NULL THEN
    -- Update existing team member with user_id
    UPDATE public.team_members 
    SET 
      user_id = NEW.id,
      name = COALESCE(NEW.raw_user_meta_data->>'full_name', name),
      -- Auto-approve if pending_role_type was set (pre-approved)
      is_approved = CASE WHEN v_pending_role_type IS NOT NULL THEN true ELSE is_approved END,
      approved_at = CASE WHEN v_pending_role_type IS NOT NULL AND NOT v_is_pre_approved THEN now() ELSE approved_at END
    WHERE id = v_team_member_id;
    
    -- If pre-approved, create user_roles entry
    IF v_pending_role_type IS NOT NULL THEN
      INSERT INTO public.user_roles (user_id, role, role_type)
      VALUES (NEW.id, 'user', v_pending_role_type)
      ON CONFLICT (user_id, role) DO UPDATE SET role_type = v_pending_role_type;
    END IF;
  ELSE
    -- Create new team member (not approved)
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
      false
    );
  END IF;
  
  RETURN NEW;
END;
$function$;