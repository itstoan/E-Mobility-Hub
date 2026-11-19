
import type { ReactNode } from 'react';

export type StatusBadgeVariant =
    | 'success'
    | 'warning'
    | 'danger'
    | 'info'
    | 'neutral';

export interface StatusBadgeProps {
    children: ReactNode;
    variant?: StatusBadgeVariant;
    className?: string;
}

const variantClasses: Record<StatusBadgeVariant, string> = {
    success: 'bg-status-success-bg text-status-success-text',
    warning: 'bg-status-warning-bg text-status-warning-text',
    danger: 'bg-status-danger-bg text-status-danger-text',

    // Tạm giữ màu xanh dương, chưa thuộc palette chính thức từ Figma.
    info: 'bg-blue-50 text-blue-700',

    neutral: 'bg-status-neutral-bg text-status-neutral-text',
};

export function StatusBadge({
    children,
    variant = 'neutral',
    className = '',
}: StatusBadgeProps) {
    return (
        <span
        className={[
            'inline-flex items-center rounded-full px-2.5 py-1',
            'text-xs font-medium',
            variantClasses[variant],
            className,
        ].join(' ')}
        >
        {children}
        </span>
    );
}
