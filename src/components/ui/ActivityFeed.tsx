import { PlusCircle, Edit, Trash2, UserPlus, Activity, Clock } from 'lucide-react';

import { formatRelativeTime } from '../../lib/utils';
import type { AuditLog } from '../../types';
import { cn } from '../../lib/utils';

interface ActivityFeedProps {
  logs: AuditLog[];
  loading?: boolean;
  maxItems?: number;
  compact?: boolean;
  className?: string;
}

function getActionIcon(action: string) {
  switch (action) {
    case 'CREATE': return PlusCircle;
    case 'UPDATE': case 'STATUS_CHANGE': return Edit;
    case 'DELETE': return Trash2;
    case 'ASSIGNMENT': return UserPlus;
    default: return Activity;
  }
}

function getActionColor(action: string) {
  switch (action) {
    case 'CREATE': return '#22c55e';
    case 'DELETE': return '#ef4444';
    case 'STATUS_CHANGE': return '#3b82f6';
    case 'ASSIGNMENT': return '#a855f7';
    default: return '#6b7280';
  }
}

function describeAction(log: AuditLog): string {
  const entity = log.entity_type;
  const newVal = log.new_value as Record<string, string> | null;
  const name = newVal?.name || newVal?.title || '';

  switch (log.action) {
    case 'CREATE': return `created ${entity}${name ? ` "${name}"` : ''}`;
    case 'UPDATE': return `updated ${entity}${name ? ` "${name}"` : ''}`;
    case 'DELETE': return `deleted ${entity}${name ? ` "${name}"` : ''}`;
    case 'STATUS_CHANGE': {
      const oldStatus = (log.old_value as Record<string, string> | null)?.status || '?';
      const newStatus = newVal?.status || '?';
      return `changed ${entity} status: ${oldStatus} → ${newStatus}`;
    }
    case 'ASSIGNMENT': return `assigned user to ${entity}`;
    case 'ROLE_CHANGE': return `changed role`;
    default: return `${log.action} on ${entity}`;
  }
}

export function ActivityFeed({ logs, loading, maxItems = 20, compact, className }: ActivityFeedProps) {
  if (loading) {
    return (
      <div className={cn('space-y-3', className)}>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="aqua-skeleton w-8 h-8 rounded-full" />
            <div className="flex-1 space-y-1">
              <div className="aqua-skeleton h-3 w-3/4 rounded" />
              <div className="aqua-skeleton h-2.5 w-1/2 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const items = logs.slice(0, maxItems);

  if (items.length === 0) {
    return <p className="text-sm text-[var(--aqua-text-muted)] text-center py-4">No recent activity</p>;
  }

  return (
    <div className={cn('space-y-1', className)}>
      {items.map(log => {
        const Icon = getActionIcon(log.action);
        const color = getActionColor(log.action);
        return (
          <div key={log.id} className="flex items-start gap-2.5 py-2 px-2 rounded-md hover:bg-[var(--aqua-hover)] transition-colors">
            <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: `${color}18` }}>
              <Icon size={12} style={{ color }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[var(--aqua-text)] m-0 leading-relaxed">
                {log.actor ? (
                  <span className="font-semibold">{log.actor.name}</span>
                ) : (
                  <span className="font-semibold">System</span>
                )}
                {' '}{describeAction(log)}
              </p>
              {!compact && (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Clock size={10} className="text-[var(--aqua-text-muted)]" />
                  <span className="text-[10px] text-[var(--aqua-text-muted)]">{formatRelativeTime(log.created_at)}</span>
                </div>
              )}
            </div>
            {compact && (
              <span className="text-[10px] text-[var(--aqua-text-muted)] flex-shrink-0">{formatRelativeTime(log.created_at)}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
