import type { InputHTMLAttributes } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export function Input({
  invalid = false,
  className = '',
  ...props
}: InputProps) {
  return (
    <input
      {...props}
      aria-invalid={invalid || props['aria-invalid']}
      className={[
        'min-h-10 w-full rounded-md border px-3 py-2',
        'text-text-primary placeholder:text-text-muted',
        'focus-visible:outline-2 focus-visible:outline-offset-2',
        'disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-text-subtle',
        invalid
          ? 'border-status-danger-border bg-status-danger-surface focus-visible:outline-status-danger-text'
          : 'border-border-default bg-surface-page focus-visible:outline-brand-primary',
        className,
      ].join(' ')}
    />
  );
}
