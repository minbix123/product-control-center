import { cn } from '../../lib/utils';
import type { Profile } from '../../types';
import { ROLE_DISPLAY } from '../../types';

interface UserAvatarProps {
  profile: Profile | { name: string; email?: string; avatar_url?: string | null; role?: { name: string } };
  size?: 'sm' | 'md' | 'lg';
  showRole?: boolean;
  showName?: boolean;
  className?: string;
}

export function UserAvatar({ profile, size = 'md', showRole, showName, className }: UserAvatarProps) {
  const initials = profile.name
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const sizeClass = `aqua-avatar-${size}`;
  const sizePixels = size === 'sm' ? 28 : size === 'md' ? 36 : 48;
  const roleName = profile.role?.name as keyof typeof ROLE_DISPLAY | undefined;
  const roleInfo = roleName ? ROLE_DISPLAY[roleName] : null;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="relative flex-shrink-0">
        {profile.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={profile.name}
            className={cn('aqua-avatar', sizeClass)}
            width={sizePixels}
            height={sizePixels}
          />
        ) : (
          <div
            className={cn(
              'aqua-avatar flex items-center justify-center font-semibold text-white',
              sizeClass
            )}
            style={{
              width: sizePixels,
              height: sizePixels,
              fontSize: sizePixels * 0.38,
              background: `linear-gradient(135deg, ${roleInfo?.color || '#6b7280'}, ${roleInfo?.color || '#6b7280'}cc)`,
            }}
          >
            {initials}
          </div>
        )}
        {showRole && roleInfo && (
          <span
            className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white"
            style={{ background: roleInfo.color }}
            title={roleInfo.label}
          />
        )}
      </div>
      {showName && (
        <div className="min-w-0">
          <p className="text-sm font-medium text-[var(--aqua-text)] truncate m-0">{profile.name}</p>
          {showRole && roleInfo && (
            <p className="text-xs m-0" style={{ color: roleInfo.color }}>{roleInfo.label}</p>
          )}
        </div>
      )}
    </div>
  );
}
