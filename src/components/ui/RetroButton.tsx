import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Loader2, type LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface RetroButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: LucideIcon;
  fullWidth?: boolean;
  children: ReactNode;
}

export const RetroButton = forwardRef<HTMLButtonElement, RetroButtonProps>(
  ({ variant = 'secondary', size = 'md', loading, icon: Icon, fullWidth, children, className, disabled, ...props }, ref) => {
    const variantClass = {
      primary: 'btn-aqua-primary',
      secondary: 'btn-aqua-secondary',
      danger: 'btn-aqua-danger',
      success: 'btn-aqua-success',
    }[variant];

    const sizeClass = {
      sm: 'btn-aqua-sm',
      md: '',
      lg: 'btn-aqua-lg',
    }[size];

    return (
      <button
        ref={ref}
        className={cn('btn-aqua', variantClass, sizeClass, fullWidth && 'w-full', className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <Loader2 size={size === 'sm' ? 14 : 16} className="animate-spin" />
        ) : Icon ? (
          <Icon size={size === 'sm' ? 14 : 16} />
        ) : null}
        {children}
      </button>
    );
  }
);

RetroButton.displayName = 'RetroButton';
