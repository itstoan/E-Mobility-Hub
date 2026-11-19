import type { InputHTMLAttributes } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export function Input({
  invalid = false,
  className = '',
  ...props}: InputProps) {
  return (
    <input
      {...props}
      aria-invalid={invalid || props['aria-invalid']}
      className={[
        'w-full min-h-10 rounded-md border bg-white px-3 py-2 text-slate-900',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700',
        'disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-60',
        invalid ? 'border-red-600' : 'border-slate-300',
        className,
      ].join(' ')}
    />
  );
}