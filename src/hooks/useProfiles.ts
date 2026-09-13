import { useState, useEffect, useCallback } from 'react';
import { fetchProfiles, updateProfileRole, toggleProfileActive } from '../lib/api';
import { useToast } from '../context/ToastContext';
import { useRealtimeSubscription } from '../context/RealtimeContext';
import type { Profile } from '../types';

export function useProfiles() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchProfiles();
      setProfiles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profiles');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  useRealtimeSubscription('profiles' as never, () => { refetch(); }, [refetch]);

  const updateRole = async (profileId: string, roleId: string) => {
    const updated = await updateProfileRole(profileId, roleId);
    addToast({ type: 'success', title: 'Role updated', message: `${updated.name}'s role has been changed.` });
    await refetch();
  };

  const toggleActive = async (profileId: string, isActive: boolean) => {
    const updated = await toggleProfileActive(profileId, isActive);
    addToast({ type: 'success', title: isActive ? 'User activated' : 'User deactivated', message: `${updated.name} has been ${isActive ? 'activated' : 'deactivated'}.` });
    await refetch();
  };

  return { profiles, loading, error, refetch, updateRole, toggleActive };
}
