import { cn } from '../../lib/utils';

interface LoadingIndicatorProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  fullPage?: boolean;
  className?: string;
}

export function LoadingIndicator({ size = 'md', label, fullPage, className }: LoadingIndicatorProps) {
  const sizeMap = { sm: 20, md: 32, lg: 48 };
  const px = sizeMap[size];

  const spinner = (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)} aria-busy="true" aria-label={label || 'Loading'}>
      <div
        className="rounded-full border-[3px] border-[#e2e8f0] animate-[aqua-spin_0.8s_linear_infinite]"
        style={{
          width: px,
          height: px,
          borderTopColor: '#3b82f6',
          borderRightColor: '#3b82f6',
        }}
      />
      {label && <p className="text-sm text-[var(--aqua-text-muted)] m-0">{label}</p>}
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[var(--aqua-bg-solid)]/80 z-[300]">
        {spinner}
      </div>
    );
  }

  return spinner;
}
