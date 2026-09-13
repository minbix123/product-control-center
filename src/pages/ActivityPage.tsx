import { useState } from 'react';
import { Filter, ChevronDown } from 'lucide-react';
import { useAuditLogs } from '../hooks/useAuditLogs';
import { ActivityFeed } from '../components/ui/ActivityFeed';
import { RetroButton } from '../components/ui/RetroButton';
import { LoadingIndicator } from '../components/ui/LoadingIndicator';
import { EmptyState } from '../components/ui/EmptyState';
import { Activity } from 'lucide-react';
import type { AuditAction } from '../types';

const ACTION_OPTIONS: { value: AuditAction | ''; label: string }[] = [
  { value: '', label: 'All actions' },
  { value: 'CREATE', label: 'Created' },
  { value: 'UPDATE', label: 'Updated' },
  { value: 'DELETE', label: 'Deleted' },
  { value: 'STATUS_CHANGE', label: 'Status Change' },
  { value: 'ASSIGNMENT', label: 'Assignment' },
  { value: 'ROLE_CHANGE', label: 'Role Change' },
  { value: 'LOGIN', label: 'Login' },
];

const ENTITY_OPTIONS = [
  { value: '', label: 'All entities' },
  { value: 'product', label: 'Products' },
  { value: 'version', label: 'Versions' },
  { value: 'assignment', label: 'Assignments' },
];

export function ActivityPage() {
  const [action, setAction] = useState<AuditAction | ''>('');
  const [entityType, setEntityType] = useState('');

  const { logs, loading, error, totalCount, hasMore, loadMore } = useAuditLogs({
    action: action || undefined,
    entity_type: entityType || undefined,
  });

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--aqua-text)] m-0 flex items-center gap-2">
          <Activity size={22} />
          Activity Log
        </h1>
        <p className="text-sm text-[var(--aqua-text-muted)] mt-0.5">
          Complete immutable audit trail — {totalCount} events total
        </p>
      </div>

      {/* Filters */}
      <div className="aqua-panel p-3 flex flex-wrap items-center gap-3">
        <Filter size={14} className="text-[var(--aqua-text-muted)]" />
        <select
          value={action}
          onChange={e => setAction(e.target.value as AuditAction | '')}
          className="aqua-select w-auto text-xs py-1.5"
        >
          {ACTION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select
          value={entityType}
          onChange={e => setEntityType(e.target.value)}
          className="aqua-select w-auto text-xs py-1.5"
        >
          {ENTITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {(action || entityType) && (
          <RetroButton variant="secondary" size="sm" onClick={() => { setAction(''); setEntityType(''); }}>
            Clear filters
          </RetroButton>
        )}
      </div>

      {/* Feed */}
      <div className="aqua-panel">
        <div className="aqua-panel-body">
          {loading ? (
            <LoadingIndicator size="sm" label="Loading activity..." />
          ) : error ? (
            <p className="text-sm text-red-500">{error}</p>
          ) : logs.length === 0 ? (
            <EmptyState icon={Activity} title="No activity found" description="No events match your current filters." />
          ) : (
            <>
              <ActivityFeed logs={logs} maxItems={logs.length} />
              {hasMore && (
                <div className="flex justify-center mt-4 pt-4 border-t border-[var(--aqua-border-light)]">
                  <RetroButton variant="secondary" onClick={loadMore} icon={ChevronDown}>
                    Load more
                  </RetroButton>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
