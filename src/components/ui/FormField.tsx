import type { ReactNode } from 'react';

export interface FormFieldProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}

export function FormField({
  id,
  label,
  hint,
  error,
  required = false,
  children,}: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-slate-900">
        {label}{required && <span aria-hidden="true"> *</span>}
      </label>
      {children}
      {hint && <p id={`${id}-hint`} className="text-sm text-slate-600">{hint}</p>}
      {error && (
        <p id={`${id}-error`} className="text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}