export type UserRole = 'student' | 'operator';

export interface AuthSession {
    isAuthenticated: boolean;
    userId: string | null;
    fullName: string | null;
    role: UserRole | null;
}

export interface NavItemConfig {
    id: string;
    label: string;
    path: string;
    useCases: string[];
    iconName:
    | 'hubs'
    | 'parking'
    | 'reservations'
    | 'charging'
    | 'monitoring'
    | 'coordination'
    | 'incidents'
    | 'simulation';
}