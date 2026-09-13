import { useState } from 'react';
import { Users, Shield, ToggleLeft, ToggleRight, RefreshCw } from 'lucide-react';
import { useProfiles } from '../hooks/useProfiles';
import { useAuth } from '../context/AuthContext';
import { fetchRoles } from '../lib/api';
import { useEffect } from 'react';
import { UserAvatar } from '../components/ui/UserAvatar';
import { RetroButton } from '../components/ui/RetroButton';
import { LoadingIndicator } from '../components/ui/LoadingIndicator';
import { formatDate } from '../lib/utils';
import { ROLE_DISPLAY } from '../types';
import type { Role } from '../types';

export function AdminPage() {
  const { permissions } = useAuth();
  const { profiles, loading, error, refetch, updateRole, toggleActive } = useProfiles();
  const [roles, setRoles] = useState<Role[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'roles'>('users');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchRoles().then(setRoles).catch(console.error);
  }, []);

  if (!permissions?.can_access_admin) {
    return (
      <div className="p-6 flex flex-col items-center justify-center py-24 gap-4">
        <Shield size={48} className="text-[var(--aqua-text-muted)]" />
        <h2 className="text-lg font-bold text-[var(--aqua-text)]">Access Restricted</h2>
        <p className="text-sm text-[var(--aqua-text-muted)]">You don't have permission to access the admin panel.</p>
      </div>
    );
  }

  const handleToggleActive = async (profileId: string, current: boolean) => {
    setUpdatingId(profileId);
    try {
      await toggleActive(profileId, !current);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRoleChange = async (profileId: string, roleId: string) => {
    setUpdatingId(profileId);
    try {
      await updateRole(profileId, roleId);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--aqua-text)] m-0 flex items-center gap-2">
            <Users size={22} />
            Admin Panel
          </h1>
          <p className="text-sm text-[var(--aqua-text-muted)] mt-0.5">{profiles.length} users registered</p>
        </div>
        <RetroButton variant="secondary" size="sm" onClick={refetch} icon={RefreshCw}>Refresh</RetroButton>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[var(--aqua-border)]">
        {(['users', 'roles'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors -mb-px ${
              activeTab === tab
                ? 'border-[#3b82f6] text-[#3b82f6]'
                : 'border-transparent text-[var(--aqua-text-muted)] hover:text-[var(--aqua-text)]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Users tab */}
      {activeTab === 'users' && (
        <div className="aqua-panel overflow-hidden">
          {loading ? (
            <div className="p-8"><LoadingIndicator size="sm" label="Loading users..." /></div>
          ) : error ? (
            <p className="p-4 text-sm text-red-500">{error}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--aqua-border)] bg-[var(--aqua-toolbar-bg)]">
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-[var(--aqua-text-secondary)] uppercase tracking-wider">User</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-[var(--aqua-text-secondary)] uppercase tracking-wider">Role</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-[var(--aqua-text-secondary)] uppercase tracking-wider">Joined</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-[var(--aqua-text-secondary)] uppercase tracking-wider">Status</th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold text-[var(--aqua-text-secondary)] uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--aqua-border-light)]">
                  {profiles.map(profile => (
                    <tr key={profile.id} className="hover:bg-[var(--aqua-hover)] transition-colors">
                      <td className="px-4 py-3">
                        <UserAvatar profile={profile} size="sm" showName />
                      </td>
                      <td className="px-4 py-3">
                        {permissions?.can_manage_roles ? (
                          <select
                            value={profile.role_id}
                            onChange={e => handleRoleChange(profile.id, e.target.value)}
                            disabled={updatingId === profile.id}
                            className="aqua-select text-xs py-1 w-auto"
                          >
                            {roles.map(r => (
                              <option key={r.id} value={r.id}>{r.name}</option>
                            ))}
                          </select>
                        ) : (
                          <span
                            className="aqua-badge text-xs"
                            style={{
                              background: `${ROLE_DISPLAY[profile.role?.name || 'WORKER']?.color}18`,
                              color: ROLE_DISPLAY[profile.role?.name || 'WORKER']?.color,
                            }}
                          >
                            {profile.role?.name}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-[var(--aqua-text-muted)]">
                        {formatDate(profile.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`aqua-badge ${profile.is_active ? 'aqua-badge-success' : 'aqua-badge-danger'}`}>
                          {profile.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {permissions?.can_manage_users && (
                          <button
                            onClick={() => handleToggleActive(profile.id, profile.is_active)}
                            disabled={updatingId === profile.id}
                            className="p-1.5 hover:bg-[var(--aqua-hover)] rounded transition-colors disabled:opacity-50"
                            title={profile.is_active ? 'Deactivate' : 'Activate'}
                          >
                            {profile.is_active ? (
                              <ToggleRight size={18} className="text-green-500" />
                            ) : (
                              <ToggleLeft size={18} className="text-[var(--aqua-text-muted)]" />
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Roles tab */}
      {activeTab === 'roles' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {roles.map(role => {
            const display = ROLE_DISPLAY[role.name];
            const perms = role.permissions as unknown as Record<string, boolean>;
            const enabledPerms = Object.entries(perms).filter(([, v]) => v).map(([k]) =>
              k.replace('can_', '').replace(/_/g, ' ')
            );
            return (
              <div key={role.id} className="aqua-panel">
                <div className="aqua-panel-header">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: display?.color }} />
                    <span className="text-sm font-bold text-[var(--aqua-text)]">{role.name}</span>
                    <span className="aqua-badge aqua-badge-primary text-xs">{display?.label}</span>
                  </div>
                </div>
                <div className="aqua-panel-body">
                  <p className="text-xs text-[var(--aqua-text-muted)] mb-3">{role.description}</p>
                  <div className="space-y-1">
                    {enabledPerms.map(p => (
                      <div key={p} className="flex items-center gap-1.5 text-xs text-[var(--aqua-text-secondary)]">
                        <span className="text-green-500">✓</span>
                        <span className="capitalize">{p}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
