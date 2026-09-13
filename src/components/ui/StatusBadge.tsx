import { cn } from '../../lib/utils';
import type { ProductStatus } from '../../types';
import { PRODUCT_STATUSES } from '../../types';

interface StatusBadgeProps {
  status: ProductStatus;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function StatusBadge({ status, size = 'md', showLabel = true, className }: StatusBadgeProps) {
  const meta = PRODUCT_STATUSES.find(s => s.value === status);
  const ledClass = `status-led-${status.toLowerCase()}`;
  const sizeClass = size === 'sm' ? 'status-led-sm' : size === 'lg' ? 'status-led-lg' : '';

  return (
    <span
      className={cn('status-led', ledClass, sizeClass, className)}
      aria-label={`Status: ${meta?.label || status}`}
      role="status"
    >
      {showLabel && (meta?.label || status)}
    </span>
  );
}
