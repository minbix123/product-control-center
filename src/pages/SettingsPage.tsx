import { useState } from 'react';
import { Settings, User, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from '../lib/api';
import { useToast } from '../context/ToastContext';
import { RetroButton } from '../components/ui/RetroButton';
import { UserAvatar } from '../components/ui/UserAvatar';
import { ROLE_DISPLAY } from '../types';

const TIMEZONES = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Sao_Paulo', 'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Moscow',
  'Asia/Dubai', 'Asia/Kolkata', 'Asia/Singapore', 'Asia/Tokyo', 'Australia/Sydney',
];

export function SettingsPage() {
  const { profile, refreshProfile } = useAuth();
  const { addToast } = useToast();

  const [name, setName] = useState(profile?.name || '');
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [timezone, setTimezone] = useState(profile?.timezone || 'UTC');
  const [saving, setSaving] = useState(false);

  if (!profile) return null;

  const roleMeta = ROLE_DISPLAY[profile.role?.name || 'WORKER'];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { addToast({ type: 'error', title: 'Name is required' }); return; }
    setSaving(true);
    try {
      await updateProfile(profile.id, {
        name: name.trim(),
        display_name: displayName.trim() || null as unknown as string,
        avatar_url: avatarUrl.trim() || null as unknown as string,
        timezone,
      });
      await refreshProfile();
      addToast({ type: 'success', title: 'Settings saved', message: 'Your profile has been updated.' });
    } catch (err) {
      addToast({ type: 'error', title: 'Failed to save', message: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--aqua-text)] m-0 flex items-center gap-2">
          <Settings size={22} />
          Settings
        </h1>
        <p className="text-sm text-[var(--aqua-text-muted)] mt-0.5">Manage your account and preferences</p>
      </div>

      {/* Profile card */}
      <div className="aqua-panel">
        <div className="aqua-panel-header flex items-center gap-2">
          <User size={15} />
          <span className="text-sm font-semibold">Profile</span>
        </div>
        <div className="aqua-panel-body">
          <div className="flex items-center gap-4 mb-5 pb-4 border-b border-[var(--aqua-border-light)]">
            <UserAvatar profile={{ ...profile, name, avatar_url: avatarUrl || null }} size="lg" />
            <div>
              <p className="text-base font-bold text-[var(--aqua-text)] m-0">{name || profile.name}</p>
              <p className="text-sm text-[var(--aqua-text-muted)] m-0">{profile.email}</p>
              <span
                className="inline-block mt-1 aqua-badge text-xs"
                style={{ background: `${roleMeta?.color}18`, color: roleMeta?.color }}
              >
                {profile.role?.name} — {roleMeta?.label}
              </span>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="aqua-label" htmlFor="settings-name">Full Name</label>
                <input
                  id="settings-name"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="aqua-input"
                  placeholder="Your name"
                  required
                />
              </div>
              <div>
                <label className="aqua-label" htmlFor="settings-display">Display Name (optional)</label>
                <input
                  id="settings-display"
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  className="aqua-input"
                  placeholder="Nickname or abbreviation"
                />
              </div>
            </div>

            <div>
              <label className="aqua-label" htmlFor="settings-avatar">Avatar URL (optional)</label>
              <input
                id="settings-avatar"
                type="url"
                value={avatarUrl}
                onChange={e => setAvatarUrl(e.target.value)}
                className="aqua-input"
                placeholder="https://example.com/photo.jpg"
              />
            </div>

            <div>
              <label className="aqua-label" htmlFor="settings-tz">
                <Globe size={11} className="inline mr-1" />
                Timezone
              </label>
              <select
                id="settings-tz"
                value={timezone}
                onChange={e => setTimezone(e.target.value)}
                className="aqua-select"
              >
                {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
              </select>
            </div>

            <div className="flex justify-end pt-2">
              <RetroButton type="submit" variant="primary" loading={saving}>
                Save Changes
              </RetroButton>
            </div>
          </form>
        </div>
      </div>

      {/* Account info (read-only) */}
      <div className="aqua-panel">
        <div className="aqua-panel-header">
          <span className="text-sm font-semibold">Account Information</span>
        </div>
        <div className="aqua-panel-body space-y-2 text-sm">
          <div className="flex justify-between py-1.5 border-b border-[var(--aqua-border-light)]">
            <span className="text-[var(--aqua-text-muted)]">Email</span>
            <span className="font-medium">{profile.email}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-[var(--aqua-border-light)]">
            <span className="text-[var(--aqua-text-muted)]">Role</span>
            <span className="font-medium" style={{ color: roleMeta?.color }}>{profile.role?.name} ({roleMeta?.label})</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-[var(--aqua-border-light)]">
            <span className="text-[var(--aqua-text-muted)]">Status</span>
            <span className={`font-medium ${profile.is_active ? 'text-green-600' : 'text-red-500'}`}>
              {profile.is_active ? '✓ Active' : '✗ Inactive'}
            </span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="text-[var(--aqua-text-muted)]">Profile ID</span>
            <code className="text-xs font-mono text-[var(--aqua-text-secondary)]">{profile.id.slice(0, 8)}…</code>
          </div>
        </div>
      </div>
    </div>
  );
}
