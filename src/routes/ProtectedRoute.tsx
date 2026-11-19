import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuthStore } from '../stores/useAuthStore';
import type { UserRole } from '../types/domain';
import { ROUTES, getDefaultHomeByRole } from './paths';

interface ProtectedRouteProps {
    allowedRoles?: UserRole[];
    children?: ReactNode;
}

export function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
    const location = useLocation();
    const currentUser = useAuthStore((state) => state.currentUser);
    const authStatus = useAuthStore((state) => state.authStatus);
    const role = currentUser?.role ?? null;

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
    const role = currentUser?.role ?? null;

    if (authStatus === 'authenticated' && currentUser && role) {
        return <Navigate to={getDefaultHomeByRole(role)} replace />;
    }

    return children ? <>{children}</> : <Outlet />;
}