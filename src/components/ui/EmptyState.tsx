import type { LucideIcon } from 'lucide-react';
import { PackageOpen } from 'lucide-react';
import { RetroButton } from './RetroButton';
import { cn } from '../../lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void; icon?: LucideIcon };
  className?: string;
}

export function EmptyState({ icon: Icon = PackageOpen, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}>
      <div className="w-16 h-16 rounded-full bg-[var(--aqua-bg-solid)] flex items-center justify-center mb-4 border border-[var(--aqua-border-light)]">
        <Icon size={28} className="text-[var(--aqua-text-muted)]" />
      </div>
      <h3 className="text-lg font-semibold text-[var(--aqua-text)] mb-1">{title}</h3>
      {description && <p className="text-sm text-[var(--aqua-text-muted)] mb-4 max-w-sm">{description}</p>}
      {action && (
        <RetroButton variant="primary" onClick={action.onClick} icon={action.icon}>
          {action.label}
        </RetroButton>
      )}
    </div>
  );
}
