import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

const colors = {
  success: { bg: '#dcfce7', border: '#86efac', icon: '#16a34a' },
  error: { bg: '#fecaca', border: '#fca5a5', icon: '#dc2626' },
  info: { bg: '#dbeafe', border: '#93c5fd', icon: '#2563eb' },
  warning: { bg: '#fef3c7', border: '#fde68a', icon: '#d97706' },
};

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
      {toasts.map(toast => {
        const Icon = icons[toast.type];
        const color = colors[toast.type];
        return (
          <div
            key={toast.id}
            className="aqua-toast pointer-events-auto flex items-start gap-3"
            style={{ borderLeft: `3px solid ${color.border}`, background: color.bg }}
          >
            <Icon size={18} style={{ color: color.icon }} className="flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[var(--aqua-text)] m-0">{toast.title}</p>
              {toast.message && <p className="text-xs text-[var(--aqua-text-secondary)] m-0 mt-1">{toast.message}</p>}
            </div>
            <button onClick={() => removeToast(toast.id)} className="p-0.5 hover:bg-black/5 rounded flex-shrink-0" aria-label="Dismiss">
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
