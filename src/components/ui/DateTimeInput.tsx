import type { InputHTMLAttributes } from 'react';

// UC06: chọn ngày, giờ bắt đầu, giờ kết thúc riêng.
// mode="datetime-local" chỉ dùng khi màn hình cần một control gộp.
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
  ...props}: DateTimeInputProps) {
  return (
    <input
      {...props}
      type={mode}
      aria-invalid={invalid || props['aria-invalid']}
      className={[
        'min-h-10 w-full rounded-md border bg-white px-3 py-2 text-slate-900',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700',
        'disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-60',
        invalid ? 'border-red-600' : 'border-slate-300',
        className,
      ].join(' ')}
    />
  );
}