import type { SelectHTMLAttributes } from 'react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  options: readonly SelectOption[];
  placeholder?: string;
  invalid?: boolean;
}

export function Select({
  options,
  placeholder,
  invalid = false,
  className = '',
  ...props
}: SelectProps) {
  return (
    <select
      {...props}
      aria-invalid={invalid || props['aria-invalid']}
      className={[
        'min-h-10 w-full rounded-md border px-3 py-2 text-text-primary',
        'focus-visible:outline-2 focus-visible:outline-offset-2',
        'disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-text-subtle',
        invalid
          ? 'border-status-danger-border bg-status-danger-surface focus-visible:outline-status-danger-text'
          : 'border-border-default bg-surface-page focus-visible:outline-brand-primary',
        className,
      ].join(' ')}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((option) => (
        <option key={option.value} value={option.value} disabled={option.disabled}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
