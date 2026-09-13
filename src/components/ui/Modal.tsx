import { useEffect, useCallback, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function Modal({ isOpen, onClose, title, children, size = 'md', className }: ModalProps) {
  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  const sizeClass = {
    sm: 'aqua-modal-sm',
    md: 'aqua-modal-md',
    lg: 'aqua-modal-lg',
    xl: 'aqua-modal-xl',
  }[size];

  return createPortal(
    <div className="aqua-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={cn('aqua-modal', sizeClass, className)} role="dialog" aria-modal="true" aria-label={title}>
        <div className="aqua-titlebar">
          <div className="traffic-lights">
            <button
              className="traffic-light traffic-light-close"
              onClick={onClose}
              aria-label="Close"
              type="button"
            />
            <span className="traffic-light traffic-light-minimize" />
            <span className="traffic-light traffic-light-maximize" />
          </div>
          <span className="aqua-titlebar-title">{title}</span>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-black/5 transition-colors"
            aria-label="Close"
            type="button"
          >
            <X size={14} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>,
    document.body
  );
}
