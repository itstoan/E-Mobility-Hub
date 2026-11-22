import { describe, expect, it } from 'vitest';
import { returnInput, state } from './fixtures';

describe('UC04 — vehicle return (business rules)', () => {
  it('TC-UC04-004 | low battery puts returned vehicle into needs_charging', () => {
    const result = state().confirmVehicleReturn(returnInput({ observedBatteryPercent: 10 }));
    expect(result.ok).toBe(true);
    expect(state().trips.find((t) => t.id === 'TR-01')?.status).toBe('completed');
    expect(state().vehicles.find((v) => v.id === 'EV-02')?.status).toBe('needs_charging');
  });

  it('TC-UC04-005 | return with issue creates incident and blocks vehicle', () => {
    const before = state().incidents.length;
    const result = state().confirmVehicleReturn(returnInput({ issueDetected: true }));
    expect(result.ok).toBe(true);
    expect(state().incidents).toHaveLength(before + 1);
    expect(state().incidents.some((i) => i.resourceId === 'EV-02' && i.status === 'reported')).toBe(true);
    expect(state().vehicles.find((v) => v.id === 'EV-02')?.status).toBe('maintenance');
  });

  it('TC-UC04-006 | second return of same Trip is rejected', () => {
    const first = state().confirmVehicleReturn(returnInput());
    const second = state().confirmVehicleReturn(returnInput());
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(false);
    expect(state().trips.filter((t) => t.id === 'TR-01')).toHaveLength(1);
  });
});
