-- ============================================================
-- Product Control Center — Seed Data (Development Only)
-- DO NOT run this in production.
-- ============================================================

-- Seed Roles with permissions
INSERT INTO roles (name, description, permissions) VALUES
  ('DEV', 'Developer / Administrator with full system access', '{
    "can_create_products": true, "can_edit_products": true, "can_delete_products": true,
    "can_create_versions": true, "can_edit_versions": true, "can_delete_versions": true,
    "can_create_updates": true, "can_manage_users": true, "can_manage_roles": true,
    "can_manage_assignments": true, "can_view_audit": true, "can_access_admin": true
  }'),
  ('MANAGER', 'Manager with product and team management access', '{
    "can_create_products": true, "can_edit_products": true, "can_delete_products": false,
    "can_create_versions": true, "can_edit_versions": true, "can_delete_versions": false,
    "can_create_updates": true, "can_manage_users": false, "can_manage_roles": false,
    "can_manage_assignments": true, "can_view_audit": true, "can_access_admin": true
  }'),
  ('WORKER', 'Worker with access to assigned products only', '{
    "can_create_products": false, "can_edit_products": false, "can_delete_products": false,
    "can_create_versions": false, "can_edit_versions": false, "can_delete_versions": false,
    "can_create_updates": true, "can_manage_users": false, "can_manage_roles": false,
    "can_manage_assignments": false, "can_view_audit": false, "can_access_admin": false
  }');

-- NOTE: Profiles are automatically created by the handle_new_user() trigger
-- when users sign up via Supabase Auth. Do NOT manually insert profiles
-- without corresponding auth.users entries, as auth_user_id is required
-- for RLS policies to function correctly.
