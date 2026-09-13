import { useState } from 'react';
import { FileText } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { RetroButton } from '../ui/RetroButton';
import { StatusBadge } from '../ui/StatusBadge';
import { PRODUCT_STATUSES, type ProductStatus } from '../../types';

interface UpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { version_id: string; title: string; description: string; new_status: ProductStatus }) => Promise<unknown>;
  versionId: string;
  versionName: string;
  currentStatus: ProductStatus;
}

export function UpdateModal({ isOpen, onClose, onSave, versionId, versionName, currentStatus }: UpdateModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [newStatus, setNewStatus] = useState<ProductStatus>(currentStatus);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError('Title is required'); return; }
    if (title.trim().length > 200) { setError('Title must be 200 characters or fewer'); return; }

    setLoading(true);
    setError('');
    try {
      await onSave({ version_id: versionId, title: title.trim(), description: description.trim(), new_status: newStatus });
      setTitle('');
      setDescription('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={loading ? () => {} : onClose} title={`New Update — ${versionName}`} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-md p-2">{error}</div>
        )}

        {/* Current status indicator */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-[var(--aqua-text-muted)]">Current status:</span>
          <StatusBadge status={currentStatus} />
        </div>

        <div>
          <label className="aqua-label" htmlFor="update-title">Title</label>
          <input
            id="update-title"
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="aqua-input"
            placeholder="e.g., Passed QA testing, Moved to production"
            maxLength={200}
            autoFocus
            required
          />
        </div>

        <div>
          <label className="aqua-label" htmlFor="update-desc">Description</label>
          <textarea
            id="update-desc"
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="aqua-textarea"
            placeholder="Describe what changed and why..."
            rows={4}
          />
        </div>

        <div>
          <label className="aqua-label" htmlFor="update-status">New Status</label>
          <select
            id="update-status"
            value={newStatus}
            onChange={e => setNewStatus(e.target.value as ProductStatus)}
            className="aqua-select"
          >
            {PRODUCT_STATUSES.map(s => (
              <option key={s.value} value={s.value}>{s.icon} {s.label}</option>
            ))}
          </select>
          {newStatus !== currentStatus && (
            <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
              ⓘ This will change the version status from <StatusBadge status={currentStatus} size="sm" /> to <StatusBadge status={newStatus} size="sm" />
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <RetroButton type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </RetroButton>
          <RetroButton type="submit" variant="primary" loading={loading} icon={FileText}>
            Save Update
          </RetroButton>
        </div>
      </form>
    </Modal>
  );
}
