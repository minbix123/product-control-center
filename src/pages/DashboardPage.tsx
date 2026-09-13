import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Package, GitBranch, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProducts } from '../hooks/useProducts';
import { useAuditLogs } from '../hooks/useAuditLogs';
import { ProductModal } from '../components/modals/ProductModal';
import { StatusBadge } from '../components/ui/StatusBadge';
import { RetroButton } from '../components/ui/RetroButton';
import { RetroCard } from '../components/ui/RetroCard';
import { ActivityFeed } from '../components/ui/ActivityFeed';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingIndicator } from '../components/ui/LoadingIndicator';
import { formatRelativeTime } from '../lib/utils';
import type { ProductStatus } from '../types';
import { PRODUCT_STATUSES } from '../types';

export function DashboardPage() {
  const { profile, permissions } = useAuth();
  const { products, loading: pLoading, error: pError, create, refetch } = useProducts();
  const { logs, loading: lLoading } = useAuditLogs({ limit: 15 } as never);
  const [showProductModal, setShowProductModal] = useState(false);
  const navigate = useNavigate();

  // Stats
  const totalProducts = products.length;
  const byStatus = PRODUCT_STATUSES.map(s => ({
    ...s,
    count: products.filter(p => p.status === s.value).length,
  })).filter(s => s.count > 0);
  const blockedCount = products.filter(p => p.status === 'BLOCKED').length;
  const readyCount = products.filter(p => p.status === 'READY').length;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--aqua-text)] m-0">
            {greeting()}, {profile?.display_name || profile?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-sm text-[var(--aqua-text-muted)] mt-1">
            Here's your product landscape at a glance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RetroButton variant="secondary" size="sm" onClick={refetch} icon={RefreshCw}>
            Refresh
          </RetroButton>
          {permissions?.can_create_products && (
            <RetroButton variant="primary" size="sm" onClick={() => setShowProductModal(true)} icon={Plus}>
              New Product
            </RetroButton>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="aqua-panel p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: '#dbeafe' }}>
              <Package size={18} style={{ color: '#2563eb' }} />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--aqua-text)] m-0">{totalProducts}</p>
              <p className="text-xs text-[var(--aqua-text-muted)] m-0">Total Products</p>
            </div>
          </div>
        </div>

        <div className="aqua-panel p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: '#dcfce7' }}>
              <TrendingUp size={18} style={{ color: '#16a34a' }} />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--aqua-text)] m-0">{readyCount}</p>
              <p className="text-xs text-[var(--aqua-text-muted)] m-0">Ready</p>
            </div>
          </div>
        </div>

        <div className="aqua-panel p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: '#fecaca' }}>
              <AlertCircle size={18} style={{ color: '#dc2626' }} />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--aqua-text)] m-0">{blockedCount}</p>
              <p className="text-xs text-[var(--aqua-text-muted)] m-0">Blocked</p>
            </div>
          </div>
        </div>

        <div className="aqua-panel p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: '#f3e8ff' }}>
              <GitBranch size={18} style={{ color: '#7c3aed' }} />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--aqua-text)] m-0">
                {byStatus.length}
              </p>
              <p className="text-xs text-[var(--aqua-text-muted)] m-0">Active Statuses</p>
            </div>
          </div>
        </div>
      </div>

      {/* Status breakdown + Products list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products list */}
        <div className="lg:col-span-2">
          <RetroCard title="Products" subtitle={`${totalProducts} total`} icon={Package}
            headerActions={
              <RetroButton variant="secondary" size="sm" onClick={() => navigate('/products')}>
                View all
              </RetroButton>
            }
          >
            {pLoading ? (
              <LoadingIndicator size="sm" label="Loading products..." />
            ) : pError ? (
              <p className="text-sm text-red-500">{pError}</p>
            ) : products.length === 0 ? (
              <EmptyState icon={Package} title="No products yet"
                description="Create your first product to get started."
                action={permissions?.can_create_products ? { label: 'New Product', onClick: () => setShowProductModal(true), icon: Plus } : undefined}
              />
            ) : (
              <div className="space-y-2">
                {products.slice(0, 8).map(product => (
                  <button
                    key={product.id}
                    onClick={() => navigate(`/products/${product.id}`)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--aqua-hover)] transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}>
                      {product.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[var(--aqua-text)] m-0 truncate">{product.name}</p>
                      <p className="text-xs text-[var(--aqua-text-muted)] m-0 truncate">{product.description || 'No description'}</p>
                    </div>
                    <div className="flex-shrink-0">
                      <StatusBadge status={product.status} size="sm" />
                    </div>
                    <p className="text-[10px] text-[var(--aqua-text-muted)] flex-shrink-0 hidden sm:block">
                      {formatRelativeTime(product.updated_at)}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </RetroCard>
        </div>

        {/* Status breakdown + Activity */}
        <div className="space-y-4">
          {/* Status breakdown */}
          {byStatus.length > 0 && (
            <RetroCard title="Status Breakdown">
              <div className="space-y-2">
                {byStatus.map(s => (
                  <div key={s.value} className="flex items-center justify-between">
                    <StatusBadge status={s.value as ProductStatus} size="sm" />
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 rounded-full bg-[var(--aqua-bg-solid)] overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${(s.count / totalProducts) * 100}%`,
                            background: 'linear-gradient(90deg, #3b82f6, #1d4ed8)',
                          }}
                        />
                      </div>
                      <span className="text-xs font-medium text-[var(--aqua-text)] w-4 text-right">{s.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </RetroCard>
          )}

          {/* Recent activity */}
          <RetroCard title="Recent Activity"
            headerActions={
              <RetroButton variant="secondary" size="sm" onClick={() => navigate('/activity')}>
                View all
              </RetroButton>
            }
          >
            <ActivityFeed logs={logs} loading={lLoading} maxItems={10} compact />
          </RetroCard>
        </div>
      </div>

      {/* Product Create Modal */}
      <ProductModal
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        onSave={create}
      />
    </div>
  );
}
