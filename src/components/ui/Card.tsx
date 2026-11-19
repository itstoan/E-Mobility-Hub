
import type { ReactNode } from 'react';

export interface CardProps {
    children: ReactNode;
    className?: string;
}

export function Card({ children, className = '' }: CardProps) {
    return (
        <div
        className={`rounded-lg border border-border-default bg-surface-page p-4 ${className}`}
        >
        {children}
        </div>
    );
}
