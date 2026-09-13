import { useState } from 'react';
import { GitBranch } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { RetroButton } from '../ui/RetroButton';
import { PRODUCT_STATUSES, type ProductStatus } from '../../types';

interface VersionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { product_id: string; name: string; description: string; status: ProductStatus }) => Promise<unknown>;
  productId: string;
  productName: string;
}

export function VersionModal({ isOpen, onClose, onSave, productId, productName }: VersionModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ProductStatus>('PLANNING');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Version name is required'); return; }
    if (name.trim().length > 100) { setError('Name must be 100 characters or fewer'); return; }

    setLoading(true);
    setError('');
    try {
      await onSave({ product_id: productId, name: name.trim(), description: description.trim(), status });
      setName('');
      setDescription('');
      setStatus('PLANNING');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={loading ? () => {} : onClose} title={`New Version — ${productName}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-md p-2">{error}</div>
        )}

        <div>
          <label className="aqua-label" htmlFor="version-name">Version Name</label>
          <input
            id="version-name"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="aqua-input"
            placeholder="e.g., GOLD, SIMPLE"
            maxLength={100}
            autoFocus
            required
          />
        </div>

        <div>
          <label className="aqua-label" htmlFor="version-desc">Description</label>
          <textarea
            id="version-desc"
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="aqua-textarea"
            placeholder="Describe this version..."
            rows={3}
          />
        </div>

        <div>
          <label className="aqua-label" htmlFor="version-status">Initial Status</label>
          <select
            id="version-status"
            value={status}
            onChange={e => setStatus(e.target.value as ProductStatus)}
            className="aqua-select"
          >
            {PRODUCT_STATUSES.map(s => (
              <option key={s.value} value={s.value}>{s.icon} {s.label}</option>
            ))}
          </select>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <RetroButton type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </RetroButton>
          <RetroButton type="submit" variant="primary" loading={loading} icon={GitBranch}>
            Create Version
          </RetroButton>
        </div>
      </form>
    </Modal>
  );
}
