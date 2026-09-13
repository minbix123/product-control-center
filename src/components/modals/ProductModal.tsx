import { useState } from 'react';
import { Package } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { RetroButton } from '../ui/RetroButton';
import { PRODUCT_STATUSES, type ProductStatus, type Product } from '../../types';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; description: string; status: ProductStatus }) => Promise<unknown>;
  product?: Product;
}

export function ProductModal({ isOpen, onClose, onSave, product }: ProductModalProps) {
  const [name, setName] = useState(product?.name || '');
  const [description, setDescription] = useState(product?.description || '');
  const [status, setStatus] = useState<ProductStatus>(product?.status || 'PLANNING');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isEdit = !!product;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Product name is required'); return; }
    if (name.trim().length > 100) { setError('Name must be 100 characters or fewer'); return; }

    setLoading(true);
    setError('');
    try {
      await onSave({ name: name.trim(), description: description.trim(), status });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={loading ? () => {} : onClose} title={isEdit ? 'Edit Product' : 'New Product'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-md p-2">{error}</div>
        )}

        <div>
          <label className="aqua-label" htmlFor="product-name">Product Name</label>
          <input
            id="product-name"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="aqua-input"
            placeholder="e.g., TRIMAX"
            maxLength={100}
            autoFocus
            required
          />
        </div>

        <div>
          <label className="aqua-label" htmlFor="product-desc">Description</label>
          <textarea
            id="product-desc"
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="aqua-textarea"
            placeholder="Describe this product..."
            rows={3}
          />
        </div>

        <div>
          <label className="aqua-label" htmlFor="product-status">Initial Status</label>
          <select
            id="product-status"
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
          <RetroButton type="submit" variant="primary" loading={loading} icon={Package}>
            {isEdit ? 'Save Changes' : 'Create Product'}
          </RetroButton>
        </div>
      </form>
    </Modal>
  );
}
