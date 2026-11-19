import type { UserRole } from '../types/domain';
import { ROUTES } from './paths';
import type { NavItemConfig } from './types';

export const STUDENT_NAV_ITEMS: NavItemConfig[] = [
    {
        id: 'explore-hubs',
        label: 'Explore Hubs',
        path: ROUTES.STUDENT.HUBS,
        useCases: ['UC01', 'UC02'],
        iconName: 'hubs',
    },
    {
        id: 'parking',
        label: 'Parking',
        path: ROUTES.STUDENT.PARKING,
        useCases: ['UC05'],
        iconName: 'parking',
    },
    {
        id: 'my-reservations',
        label: 'My Reservations',
        path: ROUTES.STUDENT.RESERVATIONS,
        useCases: ['UC02', 'UC03', 'UC04'],
        iconName: 'reservations',
    },
    {
        id: 'charging',
        label: 'Charging',
        path: ROUTES.STUDENT.CHARGING,
        useCases: ['UC06'],
        iconName: 'charging',
    },
];

export const OPERATOR_NAV_ITEMS: NavItemConfig[] = [
    {
        id: 'monitor-network',
        label: 'Monitor Network',
        path: ROUTES.OPERATOR.MONITORING,
        useCases: ['UC07'],
        iconName: 'monitoring',
    },
    {
        id: 'manage-charging',
        label: 'Manage Charging',
        path: ROUTES.OPERATOR.CHARGING,
        useCases: ['UC08'],
        iconName: 'charging',
    },
    {
        id: 'coordinate-vehicles',
        label: 'Coordinate Vehicles',
        path: ROUTES.OPERATOR.COORDINATION,
        useCases: ['UC09'],
        iconName: 'coordination',
    },
    {
        id: 'manage-incidents',
        label: 'Manage Incidents',
        path: ROUTES.OPERATOR.INCIDENTS,
        useCases: ['UC10'],
        iconName: 'incidents',
    },
    {
        id: 'operational-simulation',
        label: 'Operational Simulation',
        path: ROUTES.OPERATOR.SIMULATION,
        useCases: ['UC11'],
        iconName: 'simulation',
    },
];

export function getNavItemsByRole(role: UserRole | null): NavItemConfig[] {
    if (role === 'system_operator') return OPERATOR_NAV_ITEMS;
    if (role === 'student') return STUDENT_NAV_ITEMS;
    return [];
}