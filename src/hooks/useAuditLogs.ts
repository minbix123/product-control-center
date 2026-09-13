import { useState, useEffect, useCallback } from 'react';
import { fetchAuditLogs } from '../lib/api';
import { useRealtimeSubscription } from '../context/RealtimeContext';
import type { AuditLog, AuditAction } from '../types';

export function useAuditLogs(filters?: { entity_type?: string; action?: AuditAction; actor_id?: string }) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [offset, setOffset] = useState(0);

  const limit = 50;
  const hasMore = offset + limit < totalCount;

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchAuditLogs({ ...filters, limit, offset: 0 });
      setLogs(result.data);
      setTotalCount(result.count);
      setOffset(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [filters?.entity_type, filters?.action, filters?.actor_id]);

  useEffect(() => { refetch(); }, [refetch]);

  useRealtimeSubscription('audit_logs', () => { refetch(); }, [refetch]);

  const loadMore = async () => {
    if (!hasMore) return;
    const newOffset = offset + limit;
    const result = await fetchAuditLogs({ ...filters, limit, offset: newOffset });
    setLogs(prev => [...prev, ...result.data]);
    setOffset(newOffset);
  };

  return { logs, loading, error, totalCount, hasMore, loadMore, refetch };
}
