import type { TextareaHTMLAttributes } from 'react';

// Đề xuất UC10: Handling notes / Proposed resolution.
export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export function Textarea({
  invalid = false,
  className = '',
  rows = 3,
  ...props}: TextareaProps) {
  return (
    <textarea
      {...props}
      rows={rows}
      aria-invalid={invalid || props['aria-invalid']}
      className={[
        'w-full rounded-md border bg-white px-3 py-2 text-slate-900',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700',
        'disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-60',
        invalid ? 'border-red-600' : 'border-slate-300',
        className,
      ].join(' ')}
    />
  );
}