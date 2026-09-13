// ============================================================
// Product Control Center — Supabase API Layer
// All functions perform REAL Supabase queries. No mock data.
// ============================================================

import { supabase } from './supabase';
import type {
  Product,
  Version,
  Update,
  Assignment,
  AuditLog,
  Profile,
  Role,
  ProductStatus,
  AuditAction,
  SearchResult,
} from '../types';

// ===== HELPER =====

let _cachedProfileId: string | null = null;

export async function getCurrentProfileId(): Promise<string> {
  if (_cachedProfileId) return _cachedProfileId;
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('auth_user_id', user.id)
    .single();

  if (error || !data) throw new Error('Profile not found. Please contact an administrator.');
  _cachedProfileId = data.id;
  return data.id;
}

export function clearProfileCache() {
  _cachedProfileId = null;
}

function handleError(error: { message?: string; code?: string; details?: string; hint?: string } | null, fallback: string): never {
  console.error('[API Error]:', error);
  const msg = error?.message || fallback;
  if (error?.code === '23505') throw new Error('A record with that name already exists.');
  if (error?.code === '42501') throw new Error(`Permission denied: ${msg} (Details: ${error.details || 'none'})`);
  if (error?.code === '23503') throw new Error('Referenced record not found.');
  throw new Error(msg);
}

// ===== PRODUCTS =====

export async function fetchProducts(filters?: {
  status?: ProductStatus;
  search?: string;
}): Promise<Product[]> {
  let query = supabase
    .from('products')
    .select(`
      *,
      creator:profiles!products_created_by_fkey(id, name, email, avatar_url)
    `)
    .eq('is_deleted', false)
    .order('updated_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.search) {
    query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }

  const { data, error } = await query;
  if (error) handleError(error, 'Failed to fetch products');
  return (data || []) as Product[];
}

export async function fetchProduct(id: string): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      creator:profiles!products_created_by_fkey(id, name, email, avatar_url)
    `)
    .eq('id', id)
    .eq('is_deleted', false)
    .single();

  if (error || !data) throw new Error('Product not found');
  return data as Product;
}

export async function createProduct(input: {
  name: string;
  description: string;
  status: ProductStatus;
}): Promise<Product> {
  const name = input.name.trim();
  if (!name) throw new Error('Product name is required');
  if (name.length > 100) throw new Error('Product name must be 100 characters or fewer');

  const profileId = await getCurrentProfileId();

  const { data, error } = await supabase
    .from('products')
    .insert({
      name,
      description: input.description.trim(),
      status: input.status,
      created_by: profileId,
    })
    .select(`
      *,
      creator:profiles!products_created_by_fkey(id, name, email, avatar_url)
    `)
    .single();

  if (error) handleError(error, 'Failed to create product');
  return data as Product;
}

export async function updateProduct(
  id: string,
  input: { name?: string; description?: string; status?: ProductStatus }
): Promise<Product> {
  const updates: Record<string, unknown> = {};
  if (input.name !== undefined) {
    const name = input.name.trim();
    if (!name) throw new Error('Product name is required');
    if (name.length > 100) throw new Error('Product name must be 100 characters or fewer');
    updates.name = name;
  }
  if (input.description !== undefined) updates.description = input.description.trim();
  if (input.status !== undefined) updates.status = input.status;

  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id)
    .select(`
      *,
      creator:profiles!products_created_by_fkey(id, name, email, avatar_url)
    `)
    .single();

  if (error) handleError(error, 'Failed to update product');
  return data as Product;
}

export async function softDeleteProduct(id: string): Promise<void> {
  const { error } = await supabase
    .from('products')
    .update({ is_deleted: true })
    .eq('id', id);

  if (error) handleError(error, 'Failed to delete product');
}

// ===== VERSIONS =====

export async function fetchVersionsByProduct(productId: string): Promise<Version[]> {
  const { data: versions, error } = await supabase
    .from('versions')
    .select(`
      *,
      creator:profiles!versions_created_by_fkey(id, name, email, avatar_url)
    `)
    .eq('product_id', productId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: true });

  if (error) handleError(error, 'Failed to fetch versions');
  if (!versions || versions.length === 0) return [];

  // Fetch latest update for each version
  const versionIds = versions.map((v: Version) => v.id);
  const { data: latestUpdates } = await supabase
    .from('updates')
    .select(`
      *,
      author:profiles!updates_author_id_fkey(id, name, email, avatar_url)
    `)
    .in('version_id', versionIds)
    .order('created_at', { ascending: false });

  const latestByVersion = new Map<string, Update>();
  if (latestUpdates) {
    for (const u of latestUpdates) {
      if (!latestByVersion.has(u.version_id)) {
        latestByVersion.set(u.version_id, u as Update);
      }
    }
  }

  return versions.map((v: Version) => ({
    ...v,
    latest_update: latestByVersion.get(v.id) || undefined,
  })) as Version[];
}

export async function fetchVersion(id: string): Promise<Version> {
  const { data, error } = await supabase
    .from('versions')
    .select(`
      *,
      product:products!versions_product_id_fkey(id, name, description, status),
      creator:profiles!versions_created_by_fkey(id, name, email, avatar_url)
    `)
    .eq('id', id)
    .eq('is_deleted', false)
    .single();

  if (error || !data) throw new Error('Version not found');
  return data as Version;
}

export async function createVersion(input: {
  product_id: string;
  name: string;
  description: string;
  status: ProductStatus;
}): Promise<Version> {
  const name = input.name.trim();
  if (!name) throw new Error('Version name is required');
  if (name.length > 100) throw new Error('Version name must be 100 characters or fewer');

  const profileId = await getCurrentProfileId();

  const { data, error } = await supabase
    .from('versions')
    .insert({
      product_id: input.product_id,
      name,
      description: input.description.trim(),
      status: input.status,
      created_by: profileId,
    })
    .select(`
      *,
      creator:profiles!versions_created_by_fkey(id, name, email, avatar_url)
    `)
    .single();

  if (error) handleError(error, 'Failed to create version');
  return data as Version;
}

export async function updateVersion(id: string, updates: Partial<Version>): Promise<Version> {
  const { data, error } = await supabase
    .from('versions')
    .update(updates)
    .eq('id', id)
    .select(`
      *,
      creator:profiles!versions_created_by_fkey(id, name, email, avatar_url)
    `)
    .single();

  if (error) handleError(error, 'Failed to update version');
  return data as Version;
}

export async function softDeleteVersion(id: string): Promise<void> {
  const { error } = await supabase
    .from('versions')
    .update({ is_deleted: true })
    .eq('id', id);

  if (error) handleError(error, 'Failed to delete version');
}

// ===== UPDATES =====

export async function fetchUpdatesByVersion(
  versionId: string,
  options?: { limit?: number; offset?: number }
): Promise<{ data: Update[]; count: number }> {
  const limit = options?.limit || 20;
  const offset = options?.offset || 0;

  const { data, error, count } = await supabase
    .from('updates')
    .select(`
      *,
      author:profiles!updates_author_id_fkey(id, name, email, avatar_url)
    `, { count: 'exact' })
    .eq('version_id', versionId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) handleError(error, 'Failed to fetch updates');
  return { data: (data || []) as Update[], count: count || 0 };
}

export async function createUpdate(input: {
  version_id: string;
  title: string;
  description: string;
  new_status: ProductStatus;
}): Promise<Update> {
  const title = input.title.trim();
  if (!title) throw new Error('Update title is required');
  if (title.length > 200) throw new Error('Title must be 200 characters or fewer');

  // Get current version status for old_status
  const { data: version, error: vError } = await supabase
    .from('versions')
    .select('status')
    .eq('id', input.version_id)
    .single();

  if (vError || !version) throw new Error('Version not found');

  const profileId = await getCurrentProfileId();

  const { data, error } = await supabase
    .from('updates')
    .insert({
      version_id: input.version_id,
      author_id: profileId,
      title,
      description: input.description.trim(),
      old_status: version.status,
      new_status: input.new_status,
    })
    .select(`
      *,
      author:profiles!updates_author_id_fkey(id, name, email, avatar_url)
    `)
    .single();

  if (error) handleError(error, 'Failed to create update');
  return data as Update;
}

// ===== ASSIGNMENTS =====

export async function fetchAssignments(filters?: {
  product_id?: string;
  user_id?: string;
  version_id?: string;
}): Promise<Assignment[]> {
  let query = supabase
    .from('assignments')
    .select(`
      *,
      user:profiles!assignments_user_id_fkey(id, name, email, avatar_url, role_id, is_active),
      product:products!assignments_product_id_fkey(id, name, status),
      version:versions!assignments_version_id_fkey(id, name, status),
      creator:profiles!assignments_created_by_fkey(id, name, email)
    `)
    .order('created_at', { ascending: false });

  if (filters?.product_id) query = query.eq('product_id', filters.product_id);
  if (filters?.user_id) query = query.eq('user_id', filters.user_id);
  if (filters?.version_id) query = query.eq('version_id', filters.version_id);

  const { data, error } = await query;
  if (error) handleError(error, 'Failed to fetch assignments');
  return (data || []) as Assignment[];
}

export async function createAssignment(input: {
  user_id: string;
  product_id: string;
  version_id?: string;
}): Promise<Assignment> {
  const profileId = await getCurrentProfileId();

  const { data, error } = await supabase
    .from('assignments')
    .insert({
      user_id: input.user_id,
      product_id: input.product_id,
      version_id: input.version_id || null,
      created_by: profileId,
    })
    .select(`
      *,
      user:profiles!assignments_user_id_fkey(id, name, email, avatar_url),
      product:products!assignments_product_id_fkey(id, name),
      version:versions!assignments_version_id_fkey(id, name)
    `)
    .single();

  if (error) handleError(error, 'Failed to create assignment');
  return data as Assignment;
}

export async function deleteAssignment(id: string): Promise<void> {
  const { error } = await supabase
    .from('assignments')
    .delete()
    .eq('id', id);

  if (error) handleError(error, 'Failed to remove assignment');
}

// ===== PROFILES =====

export async function fetchProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      *,
      role:roles!profiles_role_id_fkey(*)
    `)
    .order('name', { ascending: true });

  if (error) handleError(error, 'Failed to fetch profiles');
  return (data || []) as Profile[];
}

export async function fetchCurrentProfile(): Promise<Profile | null> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select(`
      *,
      role:roles!profiles_role_id_fkey(*)
    `)
    .eq('auth_user_id', user.id)
    .single();

  if (error || !data) return null;
  return data as Profile;
}

export async function updateProfile(
  id: string,
  input: { name?: string; avatar_url?: string; timezone?: string; display_name?: string }
): Promise<Profile> {
  const updates: Record<string, unknown> = {};
  if (input.name !== undefined) updates.name = input.name.trim();
  if (input.avatar_url !== undefined) updates.avatar_url = input.avatar_url.trim() || null;
  if (input.timezone !== undefined) updates.timezone = input.timezone;
  if (input.display_name !== undefined) updates.display_name = input.display_name.trim() || null;

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', id)
    .select(`*, role:roles!profiles_role_id_fkey(*)`)
    .single();

  if (error) handleError(error, 'Failed to update profile');
  return data as Profile;
}

export async function updateProfileRole(id: string, roleId: string): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ role_id: roleId })
    .eq('id', id)
    .select(`*, role:roles!profiles_role_id_fkey(*)`)
    .single();

  if (error) handleError(error, 'Failed to update role');
  return data as Profile;
}

export async function toggleProfileActive(id: string, isActive: boolean): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ is_active: isActive })
    .eq('id', id)
    .select(`*, role:roles!profiles_role_id_fkey(*)`)
    .single();

  if (error) handleError(error, 'Failed to update profile status');
  return data as Profile;
}

// ===== ROLES =====

export async function fetchRoles(): Promise<Role[]> {
  const { data, error } = await supabase
    .from('roles')
    .select('*')
    .order('name', { ascending: true });

  if (error) handleError(error, 'Failed to fetch roles');
  return (data || []) as Role[];
}

// ===== AUDIT LOGS =====

export async function fetchAuditLogs(filters?: {
  entity_type?: string;
  action?: AuditAction;
  actor_id?: string;
  limit?: number;
  offset?: number;
}): Promise<{ data: AuditLog[]; count: number }> {
  const limit = filters?.limit || 50;
  const offset = filters?.offset || 0;

  let query = supabase
    .from('audit_logs')
    .select(`
      *,
      actor:profiles!audit_logs_actor_id_fkey(id, name, email, avatar_url)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (filters?.entity_type) query = query.eq('entity_type', filters.entity_type);
  if (filters?.action) query = query.eq('action', filters.action);
  if (filters?.actor_id) query = query.eq('actor_id', filters.actor_id);

  const { data, error, count } = await query;
  if (error) handleError(error, 'Failed to fetch audit logs');
  return { data: (data || []) as AuditLog[], count: count || 0 };
}

export async function createAuditLog(input: {
  action: AuditAction;
  entity_type: string;
  entity_id?: string;
  old_value?: Record<string, unknown>;
  new_value?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  let actorId: string | null = null;
  try {
    actorId = await getCurrentProfileId();
  } catch {
    // Allow audit logs without actor (system events)
  }

  const { error } = await supabase.from('audit_logs').insert({
    actor_id: actorId,
    action: input.action,
    entity_type: input.entity_type,
    entity_id: input.entity_id || null,
    old_value: input.old_value || null,
    new_value: input.new_value || null,
    metadata: input.metadata || null,
  });

  if (error) {
    console.error('Failed to create audit log:', error);
  }
}

// ===== SEARCH =====

export async function globalSearch(query: string): Promise<SearchResult[]> {
  if (!query.trim()) return [];
  const term = `%${query.trim()}%`;
  const results: SearchResult[] = [];

  // Search products
  const { data: products } = await supabase
    .from('products')
    .select('id, name, description, status')
    .eq('is_deleted', false)
    .or(`name.ilike.${term},description.ilike.${term}`)
    .limit(8);

  if (products) {
    for (const p of products) {
      results.push({
        type: 'product',
        id: p.id,
        title: p.name,
        subtitle: p.description || 'No description',
        status: p.status,
        url: `/products/${p.id}`,
      });
    }
  }

  // Search versions
  const { data: versions } = await supabase
    .from('versions')
    .select('id, product_id, name, description, status')
    .eq('is_deleted', false)
    .or(`name.ilike.${term},description.ilike.${term}`)
    .limit(8);

  if (versions) {
    for (const v of versions) {
      results.push({
        type: 'version',
        id: v.id,
        title: v.name,
        subtitle: v.description || 'No description',
        status: v.status,
        url: `/products/${v.product_id}/versions/${v.id}`,
      });
    }
  }

  // Search updates
  const { data: updates } = await supabase
    .from('updates')
    .select('id, version_id, title, description, new_status, version:versions(product_id)')
    .or(`title.ilike.${term},description.ilike.${term}`)
    .limit(6);

  if (updates) {
    for (const u of updates as any[]) {
      results.push({
        type: 'update',
        id: u.id,
        title: u.title,
        subtitle: u.description || 'No description',
        status: u.new_status,
        url: `/products/${u.version?.product_id}/versions/${u.version_id}`,
      });
    }
  }

  return results.slice(0, 20);
}
