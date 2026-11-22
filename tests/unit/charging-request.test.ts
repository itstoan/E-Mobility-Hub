import { describe, expect, it } from 'vitest';
import { chargingInput, state } from './fixtures';

describe('UC06 — personal EV charging requests (business rules)', () => {
  it('TC-UC06-004 | end time before start time is rejected', () => {
    const before = state().chargingRequests.length;
    const result = state().submitChargingRequest(chargingInput({ startTime: '11:00', endTime: '09:00' }));
    expect(result.ok).toBe(false);
    expect(state().chargingRequests).toHaveLength(before);
  });

  it('TC-UC06-005 | only creates pending request, without allocating port or schedule', () => {
    const beforeSchedules = state().chargingSchedules.length;
    const beforePorts = structuredClone(state().chargingPorts);
    const result = state().submitChargingRequest(chargingInput());
    expect(result.ok).toBe(true);
    if (result.ok) expect(state().chargingRequests.find((r) => r.id === result.id)?.status).toBe('pending_scheduling');
    expect(state().chargingSchedules).toHaveLength(beforeSchedules);
    expect(state().chargingPorts).toEqual(beforePorts);
  });

  it('TC-UC06-006 | refuses disconnected HUB-C', () => {
    const before = state().chargingRequests.length;
    const result = state().submitChargingRequest(chargingInput({ hubId: 'HUB-C' }));
    expect(result.ok).toBe(false);
    expect(state().chargingRequests).toHaveLength(before);
  });

  it('TC-UC06-007 | refuses blank vehicle label', () => {
    const before = state().chargingRequests.length;
    const result = state().submitChargingRequest(chargingInput({ personalVehicleLabel: '  ' }));
    expect(result.ok).toBe(false);
    expect(state().chargingRequests).toHaveLength(before);
  });
});
