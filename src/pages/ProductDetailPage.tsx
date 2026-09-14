import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, GitBranch, Users, Trash2, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useVersions } from '../hooks/useVersions';
import { useAssignments } from '../hooks/useAssignments';
import { useProfiles } from '../hooks/useProfiles';
import { fetchProduct, updateProduct } from '../lib/api';
import { VersionModal } from '../components/modals/VersionModal';
import { AssignmentModal } from '../components/modals/AssignmentModal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { StatusBadge } from '../components/ui/StatusBadge';
import { RetroButton } from '../components/ui/RetroButton';
import { UserAvatar } from '../components/ui/UserAvatar';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingIndicator } from '../components/ui/LoadingIndicator';
import { formatRelativeTime, formatDate } from '../lib/utils';
import type { Product, ProductStatus } from '../types';

export function ProductDetailPage() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { permissions, isDev } = useAuth();
  const { addToast } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [productLoading, setProductLoading] = useState(true);
  const [productError, setProductError] = useState('');

  const { versions, loading: vLoading, create: createVersion, softDelete: deleteVersion, refetch: refetchVersions } = useVersions(productId);
  const { assignments, loading: aLoading, create: createAssignment, remove: removeAssignment } = useAssignments({ product_id: productId });
  const { profiles } = useProfiles();

  const [showVersionModal, setShowVersionModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [deleteVersionId, setDeleteVersionId] = useState<string | null>(null);
  const [removeAssignId, setRemoveAssignId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (!productId) return;
    setProductLoading(true);
    fetchProduct(productId)
      .then(setProduct)
      .catch(e => setProductError(e.message))
      .finally(() => setProductLoading(false));
  }, [productId]);

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!product) return;
    const oldStatus = product.status;
    const newStatus = e.target.value as ProductStatus;
    
    setProduct({ ...product, status: newStatus });
    
    try {
      await updateProduct(product.id, { status: newStatus });
      addToast({ type: 'success', title: 'Product status updated' });
    } catch (err: any) {
      console.error(err);
      addToast({ type: 'error', title: 'Failed to update status', message: err?.message });
      setProduct({ ...product, status: oldStatus });
    }
  };

  const handleDeleteVersion = async () => {
    if (!deleteVersionId) return;
    setDeleteLoading(true);
    try {
      await deleteVersion(deleteVersionId);
      setDeleteVersionId(null);
    } catch (e: any) {
      console.error(e);
      addToast({ type: 'error', title: 'Failed to delete version', message: e?.message });
      setDeleteVersionId(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleRemoveAssignment = async () => {
    if (!removeAssignId) return;
    setDeleteLoading(true);
    try {
      await removeAssignment(removeAssignId);
      setRemoveAssignId(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  if (productLoading) return <LoadingIndicator fullPage label="Loading product..." />;
  if (productError || !product) {
    return (
      <div className="p-6">
        <p className="text-red-500">{productError || 'Product not found'}</p>
        <RetroButton variant="secondary" onClick={() => navigate('/products')} icon={ArrowLeft}>Back</RetroButton>
      </div>
    );
  }

  const deleteTargetVersion = versions.find(v => v.id === deleteVersionId);

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <button onClick={() => navigate('/products')} className="flex items-center gap-1.5 text-sm text-[var(--aqua-text-muted)] hover:text-[var(--aqua-text)] transition-colors">
          <ArrowLeft size={14} />
          Products
        </button>
        <span className="text-[var(--aqua-text-muted)]">/</span>
        <span className="text-sm font-medium text-[var(--aqua-text)]">{product.name}</span>
      </div>

      {/* Product header */}
      <div className="aqua-panel">
        <div className="aqua-panel-header">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold text-white shadow-sm flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}>
                {product.name[0]}
              </div>
              <div>
                <h1 className="text-xl font-bold text-[var(--aqua-text)] m-0">{product.name}</h1>
                <div className="flex items-center gap-3 mt-1">
                  {permissions?.can_edit_products ? (
                    <select 
                      value={product.status} 
                      onChange={handleStatusChange}
                      className="text-xs bg-white border border-[var(--aqua-border)] rounded px-2 py-0.5 outline-none"
                    >
                      <option value="PLANNING">Planning</option>
                      <option value="TESTING">Testing</option>
                      <option value="MANUFACTURING">Manufacturing</option>
                      <option value="READY">Ready</option>
                      <option value="PAUSED">Paused</option>
                      <option value="BLOCKED">Blocked</option>
                      <option value="COMPLETED">Completed</option>
                    </select>
                  ) : (
                    <StatusBadge status={product.status} />
                  )}
                  <span className="text-xs text-[var(--aqua-text-muted)]">Updated {formatRelativeTime(product.updated_at)}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <RetroButton variant="secondary" size="sm" onClick={refetchVersions} icon={RefreshCw}>Refresh</RetroButton>
              {permissions?.can_create_versions && (
                <RetroButton variant="primary" size="sm" onClick={() => setShowVersionModal(true)} icon={Plus}>
                  New Version
                </RetroButton>
              )}
              {isDev && (
                <RetroButton variant="secondary" size="sm" onClick={() => setShowAssignModal(true)} icon={Users}>
                  Assign
                </RetroButton>
              )}
            </div>
          </div>
        </div>
        <div className="aqua-panel-body">
          {product.description ? (
            <p className="text-sm text-[var(--aqua-text-secondary)] m-0">{product.description}</p>
          ) : (
            <p className="text-sm text-[var(--aqua-text-muted)] italic m-0">No description provided.</p>
          )}
          <div className="flex items-center gap-4 mt-3 text-xs text-[var(--aqua-text-muted)]">
            <span>Created {formatDate(product.created_at)}</span>
            {product.creator && <span>by {product.creator.name}</span>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Versions */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-[var(--aqua-text)] m-0 flex items-center gap-2">
              <GitBranch size={16} />
              Versions ({versions.length})
            </h2>
          </div>

          {vLoading ? (
            <LoadingIndicator size="sm" label="Loading versions..." />
          ) : versions.length === 0 ? (
            <EmptyState icon={GitBranch} title="No versions yet"
              description="Create the first version for this product."
              action={permissions?.can_create_versions
                ? { label: 'New Version', onClick: () => setShowVersionModal(true), icon: Plus }
                : undefined}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {versions.map(version => (
                <div key={version.id} className="aqua-panel aqua-panel-hover flex flex-col" style={{ minHeight: '120px' }} onClick={() => navigate(`/products/${productId}/versions/${version.id}`)}>
                  <div className="p-4 flex items-start justify-between gap-3 flex-1">
                    <div className="flex-1 min-w-0 flex flex-col">
                      <div className="flex items-center gap-2.5 mb-1">
                        <span className="text-sm font-bold text-[var(--aqua-text)]">{version.name}</span>
                        <StatusBadge status={version.status} size="sm" />
                      </div>
                      <p className="text-xs text-[var(--aqua-text-muted)] m-0 mb-2 line-clamp-1 flex-1">
                        {version.description || '\u00A0'}
                      </p>
                      <div className="text-[10px] text-[var(--aqua-text-muted)] flex items-center gap-1.5 mt-auto">
                        {version.latest_update ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" />
                            Latest: {version.latest_update.title} — {formatRelativeTime(version.latest_update.created_at)}
                          </>
                        ) : (
                          <span className="italic">No updates yet</span>
                        )}
                      </div>
                    </div>
                    {permissions?.can_delete_versions && (
                      <button
                        onClick={e => { e.stopPropagation(); setDeleteVersionId(version.id); }}
                        className="p-1.5 hover:bg-red-50 text-red-400 hover:text-red-600 rounded flex-shrink-0"
                        title="Delete version"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Assignments sidebar */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-[var(--aqua-text)] m-0 flex items-center gap-2">
              <Users size={16} />
              Team ({assignments.length})
            </h2>
          </div>

          {aLoading ? (
            <LoadingIndicator size="sm" />
          ) : assignments.length === 0 ? (
            <div className="aqua-panel p-6 text-center">
              <p className="text-sm text-[var(--aqua-text-muted)]">No team members assigned.</p>
            </div>
          ) : (
            <div className="aqua-panel divide-y divide-[var(--aqua-border-light)]">
              {assignments.map(assignment => (
                <div key={assignment.id} className="p-3 flex items-center gap-2">
                  {assignment.user && (
                    <UserAvatar profile={assignment.user} size="sm" showName showRole />
                  )}
                  <div className="flex-1 min-w-0" />
                  {isDev && (
                    <button
                      onClick={() => setRemoveAssignId(assignment.id)}
                      className="p-1 hover:bg-red-50 text-red-400 rounded flex-shrink-0"
                      title="Remove"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <VersionModal
        isOpen={showVersionModal}
        onClose={() => setShowVersionModal(false)}
        onSave={createVersion}
        productId={product.id}
        productName={product.name}
      />
      <AssignmentModal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        onAssign={createAssignment}
        profiles={profiles}
        existingAssignments={assignments}
        productId={product.id}
        productName={product.name}
        versions={versions}
      />
      <ConfirmDialog
        isOpen={!!deleteVersionId}
        onClose={() => setDeleteVersionId(null)}
        onConfirm={handleDeleteVersion}
        title="Delete Version"
        message={`Delete version "${deleteTargetVersion?.name}"? This will also delete all its updates.`}
        confirmLabel="Delete Version"
        loading={deleteLoading}
      />
      <ConfirmDialog
        isOpen={!!removeAssignId}
        onClose={() => setRemoveAssignId(null)}
        onConfirm={handleRemoveAssignment}
        title="Remove Assignment"
        message="Remove this user's assignment from the product?"
        confirmLabel="Remove"
        loading={deleteLoading}
      />
    </div>
  );
}
