import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';
import { RetroButton } from './RetroButton';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  loading?: boolean;
}

export function ConfirmDialog({
  isOpen, onClose, onConfirm, title, message,
  confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  variant = 'danger', loading,
}: ConfirmDialogProps) {
  const confirmVariant = variant === 'danger' ? 'danger' : variant === 'warning' ? 'primary' : 'primary';

  return (
    <Modal isOpen={isOpen} onClose={loading ? () => {} : onClose} title={title} size="sm">
      <div className="flex flex-col items-center text-center gap-4">
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
          <AlertTriangle size={24} className={variant === 'danger' ? 'text-red-500' : 'text-amber-500'} />
        </div>
        <p className="text-sm text-[var(--aqua-text-secondary)]">{message}</p>
        <div className="flex gap-3 w-full">
          <RetroButton variant="secondary" onClick={onClose} disabled={loading} fullWidth>
            {cancelLabel}
          </RetroButton>
          <RetroButton variant={confirmVariant} onClick={onConfirm} loading={loading} fullWidth>
            {confirmLabel}
          </RetroButton>
        </div>
      </div>
    </Modal>
  );
}
