import { describe, expect, it } from 'vitest';
import { useMobilityDataStore } from '../../src/stores/useMobilityDataStore';
import { addReportedIncident, state } from './fixtures';

describe('UC10 — incident lifecycle and dependencies (business rules)', () => {
  it('TC-UC10-003 | confirm issue reported by UC03 blocks resource', () => {
    const report = state().reportPreTripIssue({ reservationId: 'VR-02', userId: 'ST-02', description: 'Testing damage' });
    expect(report.ok).toBe(true);
    expect(report.incident).toBeDefined();
    const result = state().confirmIncident(report.incident!.id, 'OP-01');
    expect(result.ok).toBe(true);
    expect(state().incidents.find((i) => i.id === report.incident?.id)?.status).toBe('confirmed');
    expect(state().vehicles.find((v) => v.id === 'EV-04')?.status).toBe('unavailable');
  });

  it('TC-UC10-004 | false alarm closes report without editing port availability', () => {
    addReportedIncident('charging_port', 'CP-A01', 'HUB-A');
    const before = state().chargingPorts.find((p) => p.id === 'CP-A01')?.physicalState;
    const result = state().closeFalseAlarm('INC-NEW', 'OP-01');
    expect(result.ok).toBe(true);
    expect(state().incidents.find((i) => i.id === 'INC-NEW')?.status).toBe('false_alarm');
    expect(state().chargingPorts.find((p) => p.id === 'CP-A01')?.physicalState).toBe(before);
  });

  it('TC-UC10-005 | empty handling note is rejected', () => {
    const result = state().saveIncidentHandling('INC-01', 'OP-01', '', 'repair');
    expect(result.ok).toBe(false);
    expect(state().incidents.find((i) => i.id === 'INC-01')?.status).toBe('confirmed');
  });

  it('TC-UC10-006 | operator can record handling notes and proposed resolution', () => {
    const result = state().saveIncidentHandling('INC-01', 'OP-01', 'Inspected vehicle', 'Replace part');
    expect(result.ok).toBe(true);
    const incident = state().incidents.find((i) => i.id === 'INC-01');
    expect(incident?.status).toBe('in_progress');
    expect(incident?.handlingNotes).toBe('Inspected vehicle');
    expect(incident?.proposedResolution).toBe('Replace part');
  });

  it('TC-UC10-007 | pending schedule impact blocks incident resolution', () => {
    expect(state().saveIncidentHandling('INC-02', 'OP-01', 'Checked port', 'Repair port').ok).toBe(true);
    const result = state().resolveIncident('INC-02', 'OP-01', true);
    expect(result.ok).toBe(false);
    expect(state().incidents.find((i) => i.id === 'INC-02')?.status).toBe('in_progress');
    expect(state().chargingPorts.find((p) => p.id === 'CP-C01')?.physicalState).toBe('out_of_service');
  });

  it('TC-UC10-008 | student cannot confirm incident', () => {
    addReportedIncident('vehicle', 'EV-01', 'HUB-A');
    const result = state().confirmIncident('INC-NEW', 'ST-01');
    expect(result.ok).toBe(false);
    expect(state().incidents.find((i) => i.id === 'INC-NEW')?.status).toBe('reported');
  });

  it('TC-UC10-009 | recheck impact succeeds after UC08 marks schedule handled', () => {
    const first = state().reviewIncidentImpact('IMP-01', 'OP-01');
    expect(first.ok).toBe(false);
    // Fixture: UC08 is not implemented in this snapshot; simulate its completed decision only.
    useMobilityDataStore.setState((s) => ({
      chargingSchedules: s.chargingSchedules.map((schedule) =>
        schedule.id === 'CS-01' ? { ...schedule, status: 'cancelled' as const } : schedule),
    }));
    const second = state().reviewIncidentImpact('IMP-01', 'OP-01');
    expect(second.ok).toBe(true);
    expect(state().incidentImpacts.find((i) => i.id === 'IMP-01')?.status).toBe('resolved');
  });
});
