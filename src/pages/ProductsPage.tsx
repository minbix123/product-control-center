import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Package, Search, Filter, RefreshCw, Trash2, Edit } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProducts } from '../hooks/useProducts';
import { ProductModal } from '../components/modals/ProductModal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { StatusBadge } from '../components/ui/StatusBadge';
import { RetroButton } from '../components/ui/RetroButton';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingIndicator } from '../components/ui/LoadingIndicator';
import { formatRelativeTime } from '../lib/utils';
import { PRODUCT_STATUSES, type Product, type ProductStatus } from '../types';

export function ProductsPage() {
  const { permissions } = useAuth();
  const [statusFilter, setStatusFilter] = useState<ProductStatus | ''>('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const { products, loading, error, create, update, softDelete, refetch } = useProducts({
    status: statusFilter || undefined,
    search: search || undefined,
  });

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const handleDelete = async () => {
    if (!deleteProduct) return;
    setDeleteLoading(true);
    try {
      await softDelete(deleteProduct.id);
      setDeleteProduct(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--aqua-text)] m-0">Products</h1>
          <p className="text-sm text-[var(--aqua-text-muted)] mt-0.5">{products.length} product{products.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <RetroButton variant="secondary" size="sm" onClick={refetch} icon={RefreshCw}>Refresh</RetroButton>
          {permissions?.can_create_products && (
            <RetroButton variant="primary" size="sm" onClick={() => setShowCreateModal(true)} icon={Plus}>
              New Product
            </RetroButton>
          )}
        </div>
      </div>

      {/* Filters bar */}
      <div className="aqua-panel p-3 flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1 min-w-48">
          <Search size={15} className="text-[var(--aqua-text-muted)] flex-shrink-0" />
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Search products..."
            className="flex-1 bg-transparent border-none outline-none text-sm text-[var(--aqua-text)] placeholder-[var(--aqua-text-muted)]"
          />
          {searchInput && (
            <button type="button" onClick={() => { setSearchInput(''); setSearch(''); }} className="text-[var(--aqua-text-muted)] hover:text-[var(--aqua-text)]">✕</button>
          )}
        </form>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-[var(--aqua-text-muted)]" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as ProductStatus | '')}
            className="aqua-select w-auto text-xs py-1.5"
          >
            <option value="">All statuses</option>
            {PRODUCT_STATUSES.map(s => <option key={s.value} value={s.value}>{s.icon} {s.label}</option>)}
          </select>
        </div>
      </div>

      {/* Products grid */}
      {loading ? (
        <LoadingIndicator label="Loading products..." />
      ) : error ? (
        <div className="aqua-panel p-8 text-center text-red-500">{error}</div>
      ) : products.length === 0 ? (
        <EmptyState icon={Package} title={search || statusFilter ? 'No products match your filters' : 'No products yet'}
          description={!search && !statusFilter ? 'Create your first product to get started.' : undefined}
          action={permissions?.can_create_products && !search && !statusFilter
            ? { label: 'New Product', onClick: () => setShowCreateModal(true), icon: Plus }
            : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {products.map(product => (
            <div key={product.id} className="aqua-panel aqua-panel-hover flex flex-col" onClick={() => navigate(`/products/${product.id}`)}>
              <div className="aqua-panel-header flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base font-bold text-white flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}>
                    {product.name[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[var(--aqua-text)] m-0 truncate">{product.name}</p>
                    <StatusBadge status={product.status} size="sm" />
                  </div>
                </div>
                {(permissions?.can_edit_products || permissions?.can_delete_products) && (
                  <div className="flex gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                    {permissions?.can_edit_products && (
                      <button onClick={() => setEditProduct(product)} className="p-1.5 hover:bg-black/5 rounded" title="Edit">
                        <Edit size={13} />
                      </button>
                    )}
                    {permissions?.can_delete_products && (
                      <button onClick={() => setDeleteProduct(product)} className="p-1.5 hover:bg-red-50 text-red-500 rounded" title="Delete">
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div className="aqua-panel-body flex-1">
                <p className="text-xs text-[var(--aqua-text-muted)] line-clamp-2 m-0 mb-3">
                  {product.description || 'No description provided.'}
                </p>
                <div className="flex items-center justify-between text-[10px] text-[var(--aqua-text-muted)]">
                  <span>Updated {formatRelativeTime(product.updated_at)}</span>
                  {product.creator && <span>by {product.creator.name}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <ProductModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={create}
      />
      {editProduct && (
        <ProductModal
          isOpen={!!editProduct}
          onClose={() => setEditProduct(null)}
          onSave={(data) => update(editProduct.id, data).then(() => setEditProduct(null))}
          product={editProduct}
        />
      )}
      <ConfirmDialog
        isOpen={!!deleteProduct}
        onClose={() => setDeleteProduct(null)}
        onConfirm={handleDelete}
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteProduct?.name}"? This cannot be undone.`}
        confirmLabel="Delete Product"
        loading={deleteLoading}
      />
    </div>
  );
}
