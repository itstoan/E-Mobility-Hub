
import type { HTMLAttributes, ReactNode } from 'react';

export type BannerVariant = 'success' | 'warning' | 'danger';

export interface BannerProps extends HTMLAttributes<HTMLDivElement> {
  variant: BannerVariant;
  title: string;
  description?: ReactNode;
}

const variantClasses: Record<BannerVariant, string> = {
  success: 'border-border-mint bg-status-success-bg',
  warning: 'border-status-warning-bg bg-status-warning-bg',
  danger: 'border-status-danger-border bg-status-danger-bg',
};

const titleClasses: Record<BannerVariant, string> = {
  success: 'text-text-primary',
  warning: 'text-status-warning-text',
  danger: 'text-status-danger-text',
};

export function Banner({
  variant,
  title,
  description,
  className = '',
  ...props
}: BannerProps) {
  return (
    <div
      {...props}
      role={variant === 'success' ? 'status' : 'alert'}
      className={[
        'rounded-md border px-4 py-3',
        variantClasses[variant],
        className,
      ].join(' ')}
    >
      <p className={`text-sm font-semibold leading-5 ${titleClasses[variant]}`}>
        {title}
      </p>

      {description && (
        <div className="mt-1 text-xs leading-5 text-text-primary">
          {description}
        </div>
      )}
    </div>
  );
}
