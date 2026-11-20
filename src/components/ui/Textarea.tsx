import type { TextareaHTMLAttributes } from 'react';

// UC10: Handling Notes / Proposed Resolution.
export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export function Textarea({
  invalid = false,
  className = '',
  rows = 3,
  ...props
}: TextareaProps) {
  return (
    <textarea
      {...props}
      rows={rows}
      aria-invalid={invalid || props['aria-invalid']}
      className={[
        'w-full rounded-md border px-3 py-2 text-text-primary placeholder:text-text-muted',
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
