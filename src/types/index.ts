// ============================================================
// Product Control Center — Type Definitions
// ============================================================

export type RoleName = 'DEV' | 'MANAGER' | 'WORKER';

export type ProductStatus =
  | 'PLANNING'
  | 'TESTING'
  | 'MANUFACTURING'
  | 'READY'
  | 'PAUSED'
  | 'BLOCKED'
  | 'COMPLETED';

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'STATUS_CHANGE'
  | 'ROLE_CHANGE'
  | 'LOGIN'
  | 'ASSIGNMENT';

export interface UserPermissions {
  can_create_products: boolean;
  can_edit_products: boolean;
  can_delete_products: boolean;
  can_create_versions: boolean;
  can_edit_versions: boolean;
  can_delete_versions: boolean;
  can_create_updates: boolean;
  can_manage_users: boolean;
  can_manage_roles: boolean;
  can_manage_assignments: boolean;
  can_view_audit: boolean;
  can_access_admin: boolean;
}

export interface Role {
  id: string;
  name: RoleName;
  description: string;
  permissions: UserPermissions;
  created_at: string;
}

export interface Profile {
  id: string;
  auth_user_id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  role_id: string;
  is_active: boolean;
  timezone: string;
  display_name: string | null;
  created_at: string;
  updated_at: string;
  role?: Role;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  status: ProductStatus;
  created_by: string | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  creator?: Profile;
  versions?: Version[];
  version_count?: number;
}

export interface Version {
  id: string;
  product_id: string;
  name: string;
  description: string;
  status: ProductStatus;
  created_by: string | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  product?: Product;
  creator?: Profile;
  updates?: Update[];
  assignments?: Assignment[];
  latest_update?: Update;
}

export interface Update {
  id: string;
  version_id: string;
  author_id: string;
  title: string;
  description: string;
  old_status: ProductStatus;
  new_status: ProductStatus;
  created_at: string;
  author?: Profile;
  version?: Version;
}

export interface Assignment {
  id: string;
  user_id: string;
  product_id: string;
  version_id: string | null;
  created_at: string;
  created_by: string | null;
  user?: Profile;
  product?: Product;
  version?: Version;
  creator?: Profile;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  action: AuditAction;
  entity_type: string;
  entity_id: string | null;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  actor?: Profile;
}

export interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  duration?: number;
}

export interface SearchResult {
  type: 'product' | 'version' | 'update';
  id: string;
  title: string;
  subtitle: string;
  status?: ProductStatus;
  url: string;
}

export interface RealtimePayload<T = Record<string, unknown>> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  new: T;
  old: T;
}

export const PRODUCT_STATUSES: { value: ProductStatus; label: string; icon: string }[] = [
  { value: 'PLANNING', label: 'Planning', icon: '📋' },
  { value: 'TESTING', label: 'Testing', icon: '🧪' },
  { value: 'MANUFACTURING', label: 'Manufacturing', icon: '🏭' },
  { value: 'READY', label: 'Ready', icon: '✅' },
  { value: 'PAUSED', label: 'Paused', icon: '⏸' },
  { value: 'BLOCKED', label: 'Blocked', icon: '🚫' },
  { value: 'COMPLETED', label: 'Completed', icon: '🏁' },
];

export const ROLE_DISPLAY: Record<RoleName, { label: string; color: string }> = {
  DEV: { label: 'Developer', color: '#7c3aed' },
  MANAGER: { label: 'Manager', color: '#2563eb' },
  WORKER: { label: 'Worker', color: '#059669' },
};
