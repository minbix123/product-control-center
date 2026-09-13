-- Fix for Supabase trigger schema path issues
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  default_role_id UUID;
BEGIN
  -- New users get WORKER role by default (safest)
  SELECT id INTO default_role_id FROM public.roles WHERE name = 'WORKER' LIMIT 1;

  IF default_role_id IS NULL THEN
    RAISE EXCEPTION 'WORKER role not found. Seed roles first.';
  END IF;

  INSERT INTO public.profiles (auth_user_id, name, email, avatar_url, role_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture'),
    default_role_id
  );

  RETURN NEW;
END;
$$;
