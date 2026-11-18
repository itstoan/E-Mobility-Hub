import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuthStore } from '../stores/useAuthStore';
import { ROUTES, getDefaultHomeByRole } from './paths';
import type { UserRole } from './types';

function extractUserRole(user: unknown): UserRole | null {
    if (!user || typeof user !== 'object') return null;
    const role = (user as { role?: unknown }).role;
    return role === 'student' || role === 'operator' ? role : null;
}

interface ProtectedRouteProps {
    allowedRoles?: UserRole[];
    children?: ReactNode;
}

export function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
    const location = useLocation();
    const currentUser = useAuthStore((state) => state.currentUser);
    const authStatus = useAuthStore((state) => state.authStatus);
    const role = extractUserRole(currentUser);

    if (authStatus === 'initializing') {
        return null;
    }

    if (authStatus !== 'authenticated' || !currentUser || !role) {
        return (
            <Navigate
                to={ROUTES.LOGIN}
                state={{ from: location, authError: authStatus === 'error' }}
                replace
            />
        );
    }

    if (allowedRoles && !allowedRoles.includes(role)) {
        return <Navigate to={getDefaultHomeByRole(role)} replace />;
    }

    return children ? <>{children}</> : <Outlet />;
}

export function PublicOnlyRoute({ children }: { children?: ReactNode }) {
    const currentUser = useAuthStore((state) => state.currentUser);
    const authStatus = useAuthStore((state) => state.authStatus);
    const role = extractUserRole(currentUser);

    if (authStatus === 'authenticated' && currentUser && role) {
        return <Navigate to={getDefaultHomeByRole(role)} replace />;
    }

    return children ? <>{children}</> : <Outlet />;
}