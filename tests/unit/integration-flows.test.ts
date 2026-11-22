import { describe, expect, it } from 'vitest';
import { state, addReportedIncident, returnInput, validWindow } from './fixtures';

describe('Cross-UC store integration (real Zustand actions; no UI)', () => {
  it('IT-UC02-UC03-UC04-001 | reserve → pickup → return synchronizes all entities', () => {
    const reserve = state().reserveVehicleAtomic({ userId: 'ST-01', vehicleId: 'EV-01', ...validWindow() });
    expect(reserve.ok).toBe(true);
    if (!reserve.ok) return;
    const pickup = state().verifyAndUnlockVehicle({ reservationId: reserve.reservation.id, enteredCode: reserve.reservation.pickupCode });
    expect(pickup.ok).toBe(true);
    if (!pickup.ok) return;
    const ret = state().confirmVehicleReturn(returnInput({ tripId: pickup.trip.id }));
    expect(ret.ok).toBe(true);
    expect(state().trips.find((t) => t.id === pickup.trip.id)?.status).toBe('completed');
    expect(state().vehicleReservations.find((r) => r.id === reserve.reservation.id)?.status).toBe('completed');
    expect(state().vehicles.find((v) => v.id === 'EV-01')).toMatchObject({ status: 'available', currentHubId: 'HUB-B' });
  });

  it('IT-UC03-UC10-001 | reported pickup issue becomes operator incident', () => {
    const report = state().reportPreTripIssue({ reservationId: 'VR-02', userId: 'ST-02', description: 'Pre-trip fault' });
    expect(report.ok).toBe(true);
    expect(report.incident).toBeDefined();
    const confirm = state().confirmIncident(report.incident!.id, 'OP-01');
    expect(confirm.ok).toBe(true);
    expect(state().vehicleReservations.find((r) => r.id === 'VR-02')?.status).toBe('cancelled');
    expect(state().vehicles.find((v) => v.id === 'EV-04')?.status).toBe('unavailable');
  });

  it('IT-UC04-UC10-001 | issue during return is actionable by operator', () => {
    const ret = state().confirmVehicleReturn(returnInput({ issueDetected: true }));
    expect(ret.ok).toBe(true);
    const incident = state().incidents.find((i) => i.resourceId === 'EV-02' && i.status === 'reported');
    expect(incident).toBeDefined();
    const confirmed = state().confirmIncident(incident!.id, 'OP-01');
    expect(confirmed.ok).toBe(true);
    expect(state().vehicles.find((v) => v.id === 'EV-02')?.status).toBe('unavailable');
  });

  it('IT-UC10-UC02-001 | resource blocked by incident cannot be reserved', () => {
    addReportedIncident('vehicle', 'EV-01', 'HUB-A');
    expect(state().confirmIncident('INC-NEW', 'OP-01').ok).toBe(true);
    const result = state().reserveVehicleAtomic({ userId: 'ST-01', vehicleId: 'EV-01', ...validWindow() });
    expect(result.ok).toBe(false);
    expect(state().vehicles.find((v) => v.id === 'EV-01')?.status).toBe('unavailable');
  });
});
