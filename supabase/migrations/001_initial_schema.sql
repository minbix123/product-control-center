-- ============================================================
-- Product Control Center — Database Schema
-- PostgreSQL / Supabase Migration
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. Custom Types
-- ============================================================

CREATE TYPE role_name AS ENUM ('DEV', 'MANAGER', 'WORKER');
CREATE TYPE product_status AS ENUM ('PLANNING', 'TESTING', 'MANUFACTURING', 'READY', 'PAUSED', 'BLOCKED', 'COMPLETED');
CREATE TYPE audit_action AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE', 'ROLE_CHANGE', 'LOGIN', 'ASSIGNMENT');

-- ============================================================
-- 2. Tables
-- ============================================================

CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name role_name UNIQUE NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  permissions JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  role_id UUID NOT NULL REFERENCES roles(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status product_status NOT NULL DEFAULT 'PLANNING',
  created_by UUID REFERENCES profiles(id),
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status product_status NOT NULL DEFAULT 'PLANNING',
  created_by UUID REFERENCES profiles(id),
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(product_id, name)
);

CREATE TABLE updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID NOT NULL REFERENCES versions(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  old_status product_status NOT NULL,
  new_status product_status NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  version_id UUID REFERENCES versions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES profiles(id),
  UNIQUE(user_id, product_id, version_id)
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES profiles(id),
  action audit_action NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_value JSONB,
  new_value JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. Indexes
-- ============================================================

CREATE INDEX idx_profiles_auth_user_id ON profiles(auth_user_id);
CREATE INDEX idx_profiles_role_id ON profiles(role_id);
CREATE INDEX idx_products_status ON products(status) WHERE NOT is_deleted;
CREATE INDEX idx_products_created_by ON products(created_by);
CREATE INDEX idx_versions_product_id ON versions(product_id) WHERE NOT is_deleted;
CREATE INDEX idx_versions_status ON versions(status) WHERE NOT is_deleted;
CREATE INDEX idx_updates_version_id ON updates(version_id);
CREATE INDEX idx_updates_author_id ON updates(author_id);
CREATE INDEX idx_updates_created_at ON updates(created_at DESC);
CREATE INDEX idx_assignments_user_id ON assignments(user_id);
CREATE INDEX idx_assignments_product_id ON assignments(product_id);
CREATE INDEX idx_assignments_version_id ON assignments(version_id);
CREATE INDEX idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ============================================================
-- 4. Helper Functions
-- ============================================================

-- Get current user's profile ID
CREATE OR REPLACE FUNCTION current_user_profile_id()
RETURNS UUID AS $$
  SELECT id FROM profiles WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Get current user's role name
CREATE OR REPLACE FUNCTION current_user_role_name()
RETURNS role_name AS $$
  SELECT r.name FROM profiles p
  JOIN roles r ON r.id = p.role_id
  WHERE p.auth_user_id = auth.uid() AND p.is_active = true
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Check if current user is assigned to a product/version
CREATE OR REPLACE FUNCTION is_user_assigned(p_product_id UUID, p_version_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM assignments a
    WHERE a.user_id = current_user_profile_id()
      AND a.product_id = p_product_id
      AND (p_version_id IS NULL OR a.version_id IS NULL OR a.version_id = p_version_id)
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 5. Auto-Profile Creation on Auth Signup
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_role_id UUID;
BEGIN
  -- New users get WORKER role by default (safest)
  SELECT id INTO default_role_id FROM roles WHERE name = 'WORKER' LIMIT 1;

  IF default_role_id IS NULL THEN
    RAISE EXCEPTION 'WORKER role not found. Seed roles first.';
  END IF;

  INSERT INTO profiles (auth_user_id, name, email, avatar_url, role_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture'),
    default_role_id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 6. Audit Logging Functions
-- ============================================================

CREATE OR REPLACE FUNCTION audit_product_changes()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION audit_version_changes()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- When an update is inserted, also update the version's status
CREATE OR REPLACE FUNCTION audit_update_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Atomically update the version status
  UPDATE versions
  SET status = NEW.new_status, updated_at = now()
  WHERE id = NEW.version_id;

  -- Also update the parent product's updated_at
  UPDATE products
  SET updated_at = now()
  WHERE id = (SELECT product_id FROM versions WHERE id = NEW.version_id);

  -- Log the status change
  INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, old_value, new_value, metadata)
  VALUES (
    NEW.author_id,
    'STATUS_CHANGE',
    'version',
    NEW.version_id,
    jsonb_build_object('status', NEW.old_status),
    jsonb_build_object('status', NEW.new_status),
    jsonb_build_object('update_id', NEW.id, 'title', NEW.title)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION audit_assignment_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, new_value)
    VALUES (NEW.created_by, 'ASSIGNMENT', 'assignment', NEW.id, to_jsonb(NEW));
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, old_value)
    VALUES (current_user_profile_id(), 'DELETE', 'assignment', OLD.id, to_jsonb(OLD));
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Prevent modification of audit logs (append-only)
CREATE OR REPLACE FUNCTION prevent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit logs are immutable. UPDATE and DELETE operations are not permitted.';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 7. Triggers
-- ============================================================

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_versions_updated_at
  BEFORE UPDATE ON versions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE TRIGGER trg_audit_product
  AFTER INSERT OR UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION audit_product_changes();

CREATE TRIGGER trg_audit_version
  AFTER INSERT OR UPDATE ON versions
  FOR EACH ROW EXECUTE FUNCTION audit_version_changes();

CREATE TRIGGER trg_audit_update
  AFTER INSERT ON updates
  FOR EACH ROW EXECUTE FUNCTION audit_update_insert();

CREATE TRIGGER trg_audit_assignment
  AFTER INSERT OR DELETE ON assignments
  FOR EACH ROW EXECUTE FUNCTION audit_assignment_changes();

CREATE TRIGGER trg_prevent_audit_modification
  BEFORE UPDATE OR DELETE ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();

-- ============================================================
-- 8. Row Level Security
-- ============================================================

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ROLES: anyone authenticated can read
CREATE POLICY "roles_select" ON roles FOR SELECT TO authenticated USING (true);

-- PROFILES: authenticated can read all; users can update their own
CREATE POLICY "profiles_select" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE TO authenticated
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());
-- DEV can update any profile (role changes, deactivation)
CREATE POLICY "profiles_update_dev" ON profiles FOR UPDATE TO authenticated
  USING (current_user_role_name() = 'DEV');

-- PRODUCTS
CREATE POLICY "products_select_dev_manager" ON products FOR SELECT TO authenticated
  USING (
    NOT is_deleted AND (
      current_user_role_name() IN ('DEV', 'MANAGER')
      OR is_user_assigned(id)
    )
  );
CREATE POLICY "products_insert" ON products FOR INSERT TO authenticated
  WITH CHECK (current_user_role_name() IN ('DEV', 'MANAGER'));
CREATE POLICY "products_update" ON products FOR UPDATE TO authenticated
  USING (current_user_role_name() IN ('DEV', 'MANAGER'));

-- VERSIONS
CREATE POLICY "versions_select" ON versions FOR SELECT TO authenticated
  USING (
    NOT is_deleted AND (
      current_user_role_name() IN ('DEV', 'MANAGER')
      OR is_user_assigned(product_id, id)
    )
  );
CREATE POLICY "versions_insert" ON versions FOR INSERT TO authenticated
  WITH CHECK (current_user_role_name() IN ('DEV', 'MANAGER'));
CREATE POLICY "versions_update" ON versions FOR UPDATE TO authenticated
  USING (current_user_role_name() IN ('DEV', 'MANAGER'));

-- UPDATES
CREATE POLICY "updates_select" ON updates FOR SELECT TO authenticated USING (true);
CREATE POLICY "updates_insert" ON updates FOR INSERT TO authenticated
  WITH CHECK (
    current_user_role_name() IN ('DEV', 'MANAGER')
    OR is_user_assigned(
      (SELECT product_id FROM versions WHERE id = version_id),
      version_id
    )
  );

-- ASSIGNMENTS
CREATE POLICY "assignments_select" ON assignments FOR SELECT TO authenticated USING (true);
CREATE POLICY "assignments_insert" ON assignments FOR INSERT TO authenticated
  WITH CHECK (current_user_role_name() IN ('DEV', 'MANAGER'));
CREATE POLICY "assignments_delete" ON assignments FOR DELETE TO authenticated
  USING (current_user_role_name() IN ('DEV', 'MANAGER'));

-- AUDIT LOGS
CREATE POLICY "audit_logs_select_dev" ON audit_logs FOR SELECT TO authenticated
  USING (current_user_role_name() = 'DEV');
CREATE POLICY "audit_logs_select_manager" ON audit_logs FOR SELECT TO authenticated
  USING (
    current_user_role_name() = 'MANAGER'
    AND (actor_id = current_user_profile_id() OR actor_id IS NULL)
  );
CREATE POLICY "audit_logs_select_own" ON audit_logs FOR SELECT TO authenticated
  USING (actor_id = current_user_profile_id());
CREATE POLICY "audit_logs_insert" ON audit_logs FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================================
-- 9. Realtime Publication
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE products, versions, updates, assignments, audit_logs;
