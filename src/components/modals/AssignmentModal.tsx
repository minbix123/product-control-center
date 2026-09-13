import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { RetroButton } from '../ui/RetroButton';

import type { Profile, Assignment, Version } from '../../types';

interface AssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (data: { user_id: string; product_id: string; version_id?: string }) => Promise<unknown>;
  profiles: Profile[];
  existingAssignments: Assignment[];
  productId: string;
  productName: string;
  versions?: Version[];
}

export function AssignmentModal({
  isOpen, onClose, onAssign, profiles, existingAssignments,
  productId, productName, versions,
}: AssignmentModalProps) {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedVersionId, setSelectedVersionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const existingUserIds = new Set(existingAssignments.map(a => a.user_id));
  const availableUsers = profiles.filter(p => p.is_active && !existingUserIds.has(p.id));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) { setError('Please select a user'); return; }

    setLoading(true);
    setError('');
    try {
      await onAssign({
        user_id: selectedUserId,
        product_id: productId,
        version_id: selectedVersionId || undefined,
      });
      setSelectedUserId('');
      setSelectedVersionId('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={loading ? () => {} : onClose} title={`Assign User — ${productName}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-md p-2">{error}</div>
        )}

        <div>
          <label className="aqua-label" htmlFor="assign-user">User</label>
          {availableUsers.length === 0 ? (
            <p className="text-sm text-[var(--aqua-text-muted)]">All active users are already assigned.</p>
          ) : (
            <select
              id="assign-user"
              value={selectedUserId}
              onChange={e => setSelectedUserId(e.target.value)}
              className="aqua-select"
              required
            >
              <option value="">Select a user...</option>
              {availableUsers.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.email})</option>
              ))}
            </select>
          )}
        </div>

        {versions && versions.length > 0 && (
          <div>
            <label className="aqua-label" htmlFor="assign-version">Version (optional)</label>
            <select
              id="assign-version"
              value={selectedVersionId}
              onChange={e => setSelectedVersionId(e.target.value)}
              className="aqua-select"
            >
              <option value="">All versions</option>
              {versions.map(v => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
            <p className="text-[10px] text-[var(--aqua-text-muted)] mt-1">
              Leave as "All versions" to grant access to the entire product.
            </p>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <RetroButton type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </RetroButton>
          <RetroButton type="submit" variant="primary" loading={loading} icon={UserPlus} disabled={availableUsers.length === 0}>
            Assign User
          </RetroButton>
        </div>
      </form>
    </Modal>
  );
}
