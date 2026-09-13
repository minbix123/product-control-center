import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface RetroCardProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  hoverable?: boolean;
  onClick?: () => void;
  headerActions?: ReactNode;
  icon?: LucideIcon;
}

export function RetroCard({ title, subtitle, children, className, hoverable, onClick, headerActions, icon: Icon }: RetroCardProps) {
  return (
    <div
      className={cn('aqua-panel', hoverable && 'aqua-panel-hover', className)}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
    >
      {(title || headerActions) && (
        <div className="aqua-panel-header flex items-center justify-between">
          <div className="flex items-center gap-2">
            {Icon && <Icon size={16} className="text-[var(--aqua-text-secondary)]" />}
            <div>
              {title && <h3 className="text-sm font-semibold text-[var(--aqua-text)] m-0">{title}</h3>}
              {subtitle && <p className="text-xs text-[var(--aqua-text-muted)] m-0 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          {headerActions && <div className="flex items-center gap-2">{headerActions}</div>}
        </div>
      )}
      <div className="aqua-panel-body">{children}</div>
    </div>
  );
}
