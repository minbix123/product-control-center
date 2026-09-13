import { useState, useEffect, useCallback } from 'react';
import { fetchAssignments, createAssignment, deleteAssignment } from '../lib/api';
import { useToast } from '../context/ToastContext';
import { useRealtimeSubscription } from '../context/RealtimeContext';
import type { Assignment } from '../types';

export function useAssignments(filters?: { product_id?: string; user_id?: string; version_id?: string }) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAssignments(filters);
      setAssignments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assignments');
    } finally {
      setLoading(false);
    }
  }, [filters?.product_id, filters?.user_id, filters?.version_id]);

  useEffect(() => { refetch(); }, [refetch]);

  useRealtimeSubscription('assignments', () => { refetch(); }, [refetch]);

  const create = async (data: { user_id: string; product_id: string; version_id?: string }) => {
    const assignment = await createAssignment(data);
    addToast({ type: 'success', title: 'Assignment created' });
    await refetch();
    return assignment;
  };

  const remove = async (id: string) => {
    await deleteAssignment(id);
    addToast({ type: 'success', title: 'Assignment removed' });
    await refetch();
  };

  return { assignments, loading, error, refetch, create, remove };
}
