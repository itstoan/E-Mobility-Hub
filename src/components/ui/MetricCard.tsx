
import type { ReactNode } from 'react';
import { Card } from './Card';

export interface MetricCardProps {
    title: string;
    value: ReactNode;
    description?: ReactNode;
    className?: string;
}

export function MetricCard({
    title,
    value,
    description,
    className = '',
}: MetricCardProps) {
    return (
        <Card className={className}>
        <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium text-text-muted">
            {title}
            </h3>

            <div className="text-2xl font-semibold text-text-primary">
            {value}
            </div>

            {description != null && (
            <p className="text-sm text-text-secondary">
                {description}
            </p>
            )}
        </div>
        </Card>
    );
}
