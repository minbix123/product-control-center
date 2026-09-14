-- ============================================================
-- Fix: Version and Product Deletion via RPC
-- These SECURITY DEFINER functions bypass RLS so that soft-deleting
-- a row doesn't trigger a visibility violation from the SELECT policy.
-- ============================================================

-- RPC function to soft-delete a version
CREATE OR REPLACE FUNCTION soft_delete_version(version_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify the caller has DEV or MANAGER role
  IF current_user_role_name() NOT IN ('DEV', 'MANAGER') THEN
    RAISE EXCEPTION 'Permission denied: only DEV and MANAGER can delete versions';
  END IF;

  UPDATE versions SET is_deleted = true, updated_at = now()
  WHERE id = version_id AND is_deleted = false;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Version not found or already deleted';
  END IF;
END;
$$;

-- RPC function to soft-delete a product (for future-proofing)
CREATE OR REPLACE FUNCTION soft_delete_product(product_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_user_role_name() NOT IN ('DEV', 'MANAGER') THEN
    RAISE EXCEPTION 'Permission denied: only DEV and MANAGER can delete products';
  END IF;

  UPDATE products SET is_deleted = true, updated_at = now()
  WHERE id = product_id AND is_deleted = false;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found or already deleted';
  END IF;
END;
$$;

-- Fix: Ensure all SECURITY DEFINER functions have search_path set
CREATE OR REPLACE FUNCTION public.current_user_profile_id() RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM profiles WHERE auth_user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_user_role_name() RETURNS role_name
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT r.name FROM profiles p JOIN roles r ON r.id = p.role_id
  WHERE p.auth_user_id = auth.uid() AND p.is_active = true LIMIT 1;
$$;

-- Fix: Add audit_logs INSERT policy (triggers insert into audit_logs from SECURITY DEFINER functions)
DROP POLICY IF EXISTS "audit_logs_insert" ON audit_logs;
CREATE POLICY "audit_logs_insert" ON audit_logs FOR INSERT TO authenticated WITH CHECK (true);

-- Fix: audit_version_changes trigger with search_path
CREATE OR REPLACE FUNCTION public.audit_version_changes() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, new_value)
    VALUES (NEW.created_by, 'CREATE', 'version', NEW.id, to_jsonb(NEW));
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.is_deleted = false AND NEW.is_deleted = true THEN
      INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, old_value, new_value)
      VALUES (current_user_profile_id(), 'DELETE', 'version', NEW.id, to_jsonb(OLD), to_jsonb(NEW));
    ELSE
      INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, old_value, new_value)
      VALUES (current_user_profile_id(), 'UPDATE', 'version', NEW.id, to_jsonb(OLD), to_jsonb(NEW));
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Fix: audit_product_changes trigger with search_path
CREATE OR REPLACE FUNCTION public.audit_product_changes() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, new_value)
    VALUES (NEW.created_by, 'CREATE', 'product', NEW.id, to_jsonb(NEW));
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.is_deleted = false AND NEW.is_deleted = true THEN
      INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, old_value, new_value)
      VALUES (current_user_profile_id(), 'DELETE', 'product', NEW.id, to_jsonb(OLD), to_jsonb(NEW));
    ELSE
      INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, old_value, new_value)
      VALUES (current_user_profile_id(), 'UPDATE', 'product', NEW.id, to_jsonb(OLD), to_jsonb(NEW));
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;
