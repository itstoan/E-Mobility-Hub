import { describe, expect, it } from 'vitest';
import { state, parkingInput } from './fixtures';

describe('UC03 — vehicle pickup (business rules)', () => {
  it('TC-UC03-003 | incorrect PIN cannot create Trip', () => {
    const before = state().trips.length;
    const result = state().verifyAndUnlockVehicle({ reservationId: 'VR-02', enteredCode: 'WRONG' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('mismatch');
    expect(state().trips).toHaveLength(before);
    expect(state().vehicleReservations.find((r) => r.id === 'VR-02')?.status).toBe('reserved');
  });

  it('TC-UC03-004 | hardware unlock failure cancels reservation without Trip', () => {
    const before = state().trips.length;
    const result = state().verifyAndUnlockVehicle({ reservationId: 'VR-02', enteredCode: '2468', simulateHardwareFailure: true });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('hardware_unlock_failed');
      expect(result.attempts).toBe(3);
    }
    expect(state().trips).toHaveLength(before);
    expect(state().vehicleReservations.find((r) => r.id === 'VR-02')?.status).toBe('cancelled');
    expect(state().vehicles.find((v) => v.id === 'EV-04')?.status).toBe('unavailable');
  });
});

describe('UC05 — parking (business rules)', () => {
  it('TC-UC05-002 | occupied parking space is not reservable', () => {
    const before = state().parkingReservations.length;
    const result = state().reserveParkingSpaceAtomic(parkingInput({ parkingSpaceId: 'PS-A02' }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('space_unavailable');
    expect(state().parkingReservations).toHaveLength(before);
  });

  it('TC-UC05-003 | race conflict leaves no new reservation', () => {
    const before = state().parkingReservations.length;
    const result = state().reserveParkingSpaceAtomic(parkingInput({ simulateRaceConflict: true }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('conflict');
    expect(state().parkingReservations).toHaveLength(before);
    expect(state().parkingSpaces.find((p) => p.id === 'PS-A01')?.occupancy).toBe('occupied');
  });
});
