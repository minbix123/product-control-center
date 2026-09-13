import { useState, useEffect, useCallback } from 'react';
import { fetchVersionsByProduct, createVersion, softDeleteVersion, updateVersion } from '../lib/api';
import { useToast } from '../context/ToastContext';
import { useRealtimeSubscription } from '../context/RealtimeContext';
import type { Version, ProductStatus } from '../types';

export function useVersions(productId: string | undefined) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();

  const refetch = useCallback(async () => {
    if (!productId) { setVersions([]); setLoading(false); return; }
    try {
      setLoading(true);
      setError(null);
      const data = await fetchVersionsByProduct(productId);
      setVersions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load versions');
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => { refetch(); }, [refetch]);

  useRealtimeSubscription('versions', () => { refetch(); }, [refetch]);
  useRealtimeSubscription('updates', () => { refetch(); }, [refetch]);

  const create = async (data: { product_id: string; name: string; description: string; status: ProductStatus }) => {
    const version = await createVersion(data);
    addToast({ type: 'success', title: 'Version created', message: `${version.name} has been created.` });
    await refetch();
    return version;
  };

  const softDelete = async (id: string) => {
    await softDeleteVersion(id);
    addToast({ type: 'success', title: 'Version deleted' });
    await refetch();
  };

  const update = async (id: string, data: Partial<Version>) => {
    const version = await updateVersion(id, data);
    addToast({ type: 'success', title: 'Version updated' });
    await refetch();
    return version;
  };

  return { versions, loading, error, refetch, create, update, softDelete };
}
