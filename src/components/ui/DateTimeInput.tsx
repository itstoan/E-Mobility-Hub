import type { InputHTMLAttributes } from 'react';

// UC06: chọn ngày, giờ bắt đầu và giờ kết thúc riêng.
export type DateTimeInputMode = 'date' | 'time' | 'datetime-local';

export interface DateTimeInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  mode?: DateTimeInputMode;
  invalid?: boolean;
}

export function DateTimeInput({
  mode = 'datetime-local',
  invalid = false,
  className = '',
  ...props
}: DateTimeInputProps) {
  return (
    <input
      {...props}
      type={mode}
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
    />
  );
}
