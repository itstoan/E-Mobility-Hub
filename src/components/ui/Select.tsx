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
  ...props}: SelectProps) {
  return (
    <select
      {...props}
      aria-invalid={invalid || props['aria-invalid']}
      className={[
        'w-full min-h-10 rounded-md border bg-white px-3 py-2 text-slate-900',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700',
        'disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-60',
        invalid ? 'border-red-600' : 'border-slate-300',
        className,
      ].join(' ')}
    >
      {placeholder && <option value="" disabled>{placeholder}</option>}
      {options.map((option) => (
        <option key={option.value} value={option.value} disabled={option.disabled}>
          {option.label}
        </option>
      ))}
    </select>
  );
}