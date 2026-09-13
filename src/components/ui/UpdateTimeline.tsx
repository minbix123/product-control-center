import { ArrowRight, Shield } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { UserAvatar } from './UserAvatar';
import { formatDate, formatTime, formatRelativeTime, cn } from '../../lib/utils';
import type { Update } from '../../types';

interface UpdateTimelineProps {
  updates: Update[];
  loading?: boolean;
  className?: string;
}

export function UpdateTimeline({ updates, loading, className }: UpdateTimelineProps) {
  if (loading) {
    return (
      <div className={cn('space-y-4', className)}>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="aqua-skeleton w-3 h-3 rounded-full" />
              <div className="aqua-skeleton w-0.5 h-20 mt-1" />
            </div>
            <div className="flex-1 space-y-2 pb-6">
              <div className="aqua-skeleton h-4 w-1/3 rounded" />
              <div className="aqua-skeleton h-3 w-2/3 rounded" />
              <div className="aqua-skeleton h-3 w-1/4 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (updates.length === 0) {
    return <p className="text-sm text-[var(--aqua-text-muted)] text-center py-8">No updates recorded yet.</p>;
  }

  return (
    <div className={cn('relative', className)}>
      {updates.map((update, idx) => (
        <div key={update.id} className="flex gap-4 relative">
          {/* Timeline line */}
          <div className="flex flex-col items-center flex-shrink-0 w-4">
            <div className="w-3 h-3 rounded-full bg-[#3b82f6] border-2 border-white shadow-sm mt-1.5 z-10" />
            {idx < updates.length - 1 && (
              <div className="w-0.5 flex-1 bg-[var(--aqua-border)] mt-1" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 pb-8 min-w-0">
            <div className="aqua-panel">
              <div className="p-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="text-sm font-semibold text-[var(--aqua-text)] m-0">{update.title}</h4>
                  <span className="text-[10px] text-[var(--aqua-text-muted)] flex-shrink-0">{formatRelativeTime(update.created_at)}</span>
                </div>

                {/* Description */}
                {update.description && (
                  <p className="text-xs text-[var(--aqua-text-secondary)] m-0 mb-3">{update.description}</p>
                )}

                {/* Status transition */}
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <StatusBadge status={update.old_status} size="sm" />
                  <ArrowRight size={12} className="text-[var(--aqua-text-muted)]" />
                  <StatusBadge status={update.new_status} size="sm" />
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    {update.author && <UserAvatar profile={update.author} size="sm" showName />}
                  </div>
                  <div className="text-[10px] text-[var(--aqua-text-muted)]">
                    {formatDate(update.created_at)} {formatTime(update.created_at)}
                  </div>
                </div>

                {/* Immutable seal */}
                <div className="flex items-center gap-1 mt-2 pt-2 border-t border-[var(--aqua-border-light)]">
                  <Shield size={10} className="text-[var(--aqua-text-muted)]" />
                  <span className="text-[9px] text-[var(--aqua-text-muted)] uppercase tracking-wider font-medium">
                    Immutable Audit Record
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
