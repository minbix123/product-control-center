import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, FileText, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useUpdates } from '../hooks/useUpdates';
import { fetchVersion } from '../lib/api';
import { UpdateModal } from '../components/modals/UpdateModal';
import { StatusBadge } from '../components/ui/StatusBadge';
import { RetroButton } from '../components/ui/RetroButton';
import { UpdateTimeline } from '../components/ui/UpdateTimeline';
import { LoadingIndicator } from '../components/ui/LoadingIndicator';
import { formatDate, formatRelativeTime } from '../lib/utils';
import type { Version } from '../types';

export function VersionDetailPage() {
  const { productId, versionId } = useParams<{ productId: string; versionId: string }>();
  const navigate = useNavigate();
  const { permissions } = useAuth();

  const [version, setVersion] = useState<Version | null>(null);
  const [versionLoading, setVersionLoading] = useState(true);
  const [versionError, setVersionError] = useState('');
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  const { updates, loading: uLoading, totalCount, hasMore, loadMore, create } = useUpdates(versionId);

  useEffect(() => {
    if (!versionId) return;
    setVersionLoading(true);
    fetchVersion(versionId)
      .then(setVersion)
      .catch(e => setVersionError(e.message))
      .finally(() => setVersionLoading(false));
  }, [versionId]);

  // Keep version status in sync with latest update
  useEffect(() => {
    if (updates.length > 0 && version) {
      setVersion(prev => prev ? { ...prev, status: updates[0].new_status } : prev);
    }
  }, [updates]);

  const handleCreate = async (data: Parameters<typeof create>[0]) => {
    const u = await create(data);
    setVersion(prev => prev ? { ...prev, status: data.new_status } : prev);
    setShowUpdateModal(false);
    return u;
  };

  if (versionLoading) return <LoadingIndicator fullPage label="Loading version..." />;
  if (versionError || !version) {
    return (
      <div className="p-6">
        <p className="text-red-500">{versionError || 'Version not found'}</p>
        <RetroButton variant="secondary" onClick={() => navigate(`/products/${productId}`)} icon={ArrowLeft}>Back</RetroButton>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={() => navigate('/products')} className="text-sm text-[var(--aqua-text-muted)] hover:text-[var(--aqua-text)] transition-colors">
          Products
        </button>
        <span className="text-[var(--aqua-text-muted)]">/</span>
        <button onClick={() => navigate(`/products/${productId}`)} className="text-sm text-[var(--aqua-text-muted)] hover:text-[var(--aqua-text)] transition-colors">
          {version.product?.name || 'Product'}
        </button>
        <span className="text-[var(--aqua-text-muted)]">/</span>
        <span className="text-sm font-medium text-[var(--aqua-text)]">{version.name}</span>
      </div>

      {/* Version header */}
      <div className="aqua-panel">
        <div className="aqua-panel-header">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold text-white shadow-sm flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #5b21b6)' }}>
                {version.name[0]}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-bold text-[var(--aqua-text)] m-0">{version.name}</h1>
                  <span className="text-xs text-[var(--aqua-text-muted)] font-normal">({version.product?.name})</span>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <StatusBadge status={version.status} />
                  <span className="text-xs text-[var(--aqua-text-muted)]">Updated {formatRelativeTime(version.updated_at)}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {permissions?.can_create_updates && (
                <RetroButton variant="primary" size="sm" onClick={() => setShowUpdateModal(true)} icon={Plus}>
                  Log Update
                </RetroButton>
              )}
            </div>
          </div>
        </div>
        <div className="aqua-panel-body">
          {version.description ? (
            <p className="text-sm text-[var(--aqua-text-secondary)] m-0">{version.description}</p>
          ) : (
            <p className="text-sm text-[var(--aqua-text-muted)] italic m-0">No description provided.</p>
          )}
          <div className="flex items-center gap-4 mt-3 text-xs text-[var(--aqua-text-muted)]">
            <span>Created {formatDate(version.created_at)}</span>
            {version.creator && <span>by {version.creator.name}</span>}
            <span className="ml-auto">{totalCount} update{totalCount !== 1 ? 's' : ''} total</span>
          </div>
        </div>
      </div>

      {/* Update timeline */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-[var(--aqua-text)] m-0 flex items-center gap-2">
            <FileText size={16} />
            Update History
            {totalCount > 0 && (
              <span className="text-xs font-normal text-[var(--aqua-text-muted)] ml-1">({totalCount})</span>
            )}
          </h2>
        </div>

        <UpdateTimeline updates={updates} loading={uLoading} />

        {hasMore && (
          <div className="flex justify-center mt-4">
            <RetroButton variant="secondary" onClick={loadMore} icon={ChevronDown}>
              Load more updates
            </RetroButton>
          </div>
        )}
      </div>

      {/* Update Modal */}
      {version && (
        <UpdateModal
          isOpen={showUpdateModal}
          onClose={() => setShowUpdateModal(false)}
          onSave={handleCreate}
          versionId={version.id}
          versionName={version.name}
          currentStatus={version.status}
        />
      )}
    </div>
  );
}
