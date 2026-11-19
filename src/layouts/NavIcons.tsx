import type { NavItemConfig } from '../routes/types';

interface IconProps {
    className?: string;
}

export function BrandBoltIcon({ className = 'h-6 w-6' }: IconProps) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            aria-hidden="true"
        >
            <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />
        </svg>
    );
}

export function ChevronLeftIcon({ className = 'h-4 w-4' }: IconProps) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            aria-hidden="true"
        >
            <path d="M15 18l-6-6 6-6" />
        </svg>
    );
}

export function ChevronRightIcon({ className = 'h-4 w-4' }: IconProps) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            aria-hidden="true"
        >
            <path d="M9 18l6-6-6-6" />
        </svg>
    );
}

export function MenuIcon({ className = 'h-5 w-5' }: IconProps) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            aria-hidden="true"
        >
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="18" x2="20" y2="18" />
        </svg>
    );
}

export function LogOutIcon({ className = 'h-4 w-4' }: IconProps) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            aria-hidden="true"
        >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
    );
}

export function NavItemIcon({
    name,
    className = 'h-5 w-5',
}: {
    name: NavItemConfig['iconName'];
    className?: string;
}) {
    switch (name) {
        case 'hubs':
        case 'monitoring':
            return (
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.9}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={className}
                    aria-hidden="true"
                >
                    <circle cx="12" cy="12" r="9" />
                    <path d="M3.6 9h16.8M3.6 15h16.8" />
                    <path d="M12 3a14.5 14.5 0 0 1 0 18M12 3a14.5 14.5 0 0 0 0 18" />
                </svg>
            );

        case 'parking':
            return (
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.9}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={className}
                    aria-hidden="true"
                >
                    <path d="M12 21s-6-5.33-6-10a6 6 0 1 1 12 0c0 4.67-6 10-6 10z" />
                    <circle cx="12" cy="11" r="2.2" />
                </svg>
            );

        case 'reservations':
            return (
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.9}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={className}
                    aria-hidden="true"
                >
                    <rect x="3" y="4" width="18" height="17" rx="2.5" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
            );

        case 'charging':
            return (
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.9}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={className}
                    aria-hidden="true"
                >
                    <rect x="2" y="7" width="18" height="10" rx="2" />
                    <line x1="22" y1="10" x2="22" y2="14" />
                    <path d="M11 9.5L8.5 12.5h3l-1 2.5 2.5-3h-3l1-2.5z" />
                </svg>
            );

        case 'coordination':
            return (
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.9}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={className}
                    aria-hidden="true"
                >
                    <path d="M17 3l4 4-4 4" />
                    <path d="M3 7h18" />
                    <path d="M7 21l-4-4 4-4" />
                    <path d="M21 17H3" />
                </svg>
            );

        case 'incidents':
            return (
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.9}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={className}
                    aria-hidden="true"
                >
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
            );

        case 'simulation':
            return (
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.9}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={className}
                    aria-hidden="true"
                >
                    <path d="M9 3h6" />
                    <path d="M10 3v5.5L4.8 17.6A2 2 0 0 0 6.5 20.5h11a2 2 0 0 0 1.7-2.9L14 8.5V3" />
                    <path d="M7.5 14h9" />
                </svg>
            );
    }
}