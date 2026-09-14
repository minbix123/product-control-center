-- ============================================================
-- Fix: Allow WORKER role to see all products and versions
-- and allow them to add updates to any version.
-- ============================================================

-- 1. Allow all authenticated users to SEE products (not just assigned ones)
DROP POLICY IF EXISTS "products_select_dev_manager" ON products;
DROP POLICY IF EXISTS "products_select" ON products;
CREATE POLICY "products_select" ON products FOR SELECT TO authenticated
  USING (NOT is_deleted);

-- 2. Allow all authenticated users to SEE versions (not just assigned ones)
DROP POLICY IF EXISTS "versions_select" ON versions;
CREATE POLICY "versions_select" ON versions FOR SELECT TO authenticated
  USING (NOT is_deleted);

-- 3. (Optional) If you want workers to be able to add updates to ANY version 
-- without needing to be explicitly assigned to it, run this:
DROP POLICY IF EXISTS "updates_insert" ON updates;
CREATE POLICY "updates_insert" ON updates FOR INSERT TO authenticated
  WITH CHECK (true);
