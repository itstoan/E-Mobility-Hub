import type { UserRole } from '../types/domain';

export type { UserRole };

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