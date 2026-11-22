import { describe, expect, it } from 'vitest';
import { state, validWindow } from './fixtures';
import { useMobilityDataStore } from '../../src/stores/useMobilityDataStore';

describe('UC02 — vehicle reservation (business rules)', () => {
  it('TC-UC02-003 | rejects a vehicle that is already reserved', () => {
    const before = state().vehicleReservations.length;
    const result = state().reserveVehicleAtomic({ userId: 'ST-01', vehicleId: 'EV-04', ...validWindow() });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('unavailable');
    expect(state().vehicleReservations).toHaveLength(before);
  });

  it('TC-UC02-004 | low-battery vehicle is not reservable', () => {
    const before = state().vehicleReservations.length;
    // Seed EV-03 is needs_charging (12%): current action checks status first.
    const result = state().reserveVehicleAtomic({ userId: 'ST-01', vehicleId: 'EV-03', ...validWindow() });
    expect(result.ok).toBe(false);
    expect(state().vehicleReservations).toHaveLength(before);
    // Also isolate the battery threshold against a vehicle with available status.
    useMobilityDataStore.setState((s) => ({ vehicles: s.vehicles.map((v) =>
      v.id === 'EV-01' ? { ...v, batteryPercent: 10 } : v),
    }));
    const lowBattery = state().reserveVehicleAtomic({ userId: 'ST-01', vehicleId: 'EV-01', ...validWindow() });
    expect(lowBattery.ok).toBe(false);
    if (!lowBattery.ok) expect(lowBattery.reason).toBe('low_battery');
    expect(state().vehicleReservations).toHaveLength(before);
  });

  it('TC-UC02-005 | simulates a concurrent reservation conflict without creating reservation', () => {
    const before = state().vehicleReservations.length;
    const result = state().reserveVehicleAtomic({ userId: 'ST-01', vehicleId: 'EV-01', ...validWindow(), simulateRaceConflict: true });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('conflict');
    expect(state().vehicleReservations).toHaveLength(before);
    expect(state().vehicles.find((v) => v.id === 'EV-01')?.status).toBe('reserved');
  });

  it('TC-UC02-006 | rejects invalid time window', () => {
    const { requestedStartAt, requestedEndAt } = validWindow();
    const before = state().vehicleReservations.length;
    const result = state().reserveVehicleAtomic({ userId: 'ST-01', vehicleId: 'EV-01', requestedStartAt: requestedEndAt, requestedEndAt: requestedStartAt });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('invalid_time');
    expect(state().vehicleReservations).toHaveLength(before);
  });
});

