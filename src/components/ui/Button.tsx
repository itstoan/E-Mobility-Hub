import type { ButtonHTMLAttributes } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  isLoading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-teal-700 text-white hover:bg-teal-800',
  secondary: 'border border-teal-700 bg-white text-teal-800 hover:bg-teal-50',
  danger: 'bg-red-600 text-white hover:bg-red-700',
};

export function Button({
  type = 'button',
  variant = 'primary',
  isLoading = false,
  disabled,
  className = '',
  children,
  ...props}: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      className={[
        'inline-flex min-h-10 items-center justify-center gap-2 rounded-md',
        'px-4 py-2 font-medium transition-colors',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700',
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