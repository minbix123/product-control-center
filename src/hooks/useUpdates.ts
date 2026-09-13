import { useState, useEffect, useCallback } from 'react';
import { fetchUpdatesByVersion, createUpdate } from '../lib/api';
import { useToast } from '../context/ToastContext';
import { useRealtimeSubscription } from '../context/RealtimeContext';
import type { Update, ProductStatus } from '../types';

export function useUpdates(versionId: string | undefined) {
  const [updates, setUpdates] = useState<Update[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [offset, setOffset] = useState(0);
  const { addToast } = useToast();

  const limit = 20;
  const hasMore = offset + limit < totalCount;

  const refetch = useCallback(async () => {
    if (!versionId) { setUpdates([]); setLoading(false); return; }
    try {
      setLoading(true);
      setError(null);
      const result = await fetchUpdatesByVersion(versionId, { limit, offset: 0 });
      setUpdates(result.data);
      setTotalCount(result.count);
      setOffset(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load updates');
    } finally {
      setLoading(false);
    }
  }, [versionId]);

  useEffect(() => { refetch(); }, [refetch]);

  useRealtimeSubscription('updates', () => { refetch(); }, [refetch]);

  const loadMore = async () => {
    if (!versionId || !hasMore) return;
    const newOffset = offset + limit;
    const result = await fetchUpdatesByVersion(versionId, { limit, offset: newOffset });
    setUpdates(prev => [...prev, ...result.data]);
    setOffset(newOffset);
  };

  const create = async (data: { version_id: string; title: string; description: string; new_status: ProductStatus }) => {
    const update = await createUpdate(data);
    addToast({ type: 'success', title: 'Update saved', message: 'Status has been updated.' });
    await refetch();
    return update;
  };

  return { updates, loading, error, totalCount, hasMore, loadMore, create, refetch };
}
