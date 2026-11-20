import type { ButtonHTMLAttributes } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  isLoading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-brand-primary text-white hover:bg-brand-medium',
  secondary:
    'border border-brand-primary bg-surface-page text-brand-primary hover:bg-surface-selected',
  danger: 'bg-status-danger-text text-white hover:brightness-90',
};

export function Button({
  type = 'button',
  variant = 'primary',
  isLoading = false,
  disabled,
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      className={[
        'inline-flex min-h-10 items-center justify-center gap-2 rounded-md',
        'px-4 py-2 font-medium transition-colors',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary',
        'disabled:cursor-not-allowed disabled:opacity-50',
        variantClasses[variant],
        className,
      ].join(' ')}
    >
      {isLoading && <span aria-hidden="true">…</span>}
      {children}
    </button>
  );
}
