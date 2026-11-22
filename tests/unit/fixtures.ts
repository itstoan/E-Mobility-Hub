import { useMobilityDataStore } from '../../src/stores/useMobilityDataStore';
import type { ChargingRequestInput, ReturnVehicleInput, ReserveParkingInput } from '../../src/stores/useMobilityDataStore';
import type { Incident } from '../../src/types/domain';

export const state = () => useMobilityDataStore.getState();

export function validWindow() {
  return {
    requestedStartAt: new Date(Date.now() + 60 * 60_000).toISOString(),
    requestedEndAt: new Date(Date.now() + 120 * 60_000).toISOString(),
  };
}

export function returnInput(overrides: Partial<ReturnVehicleInput> = {}): ReturnVehicleInput {
  return {
    tripId: 'TR-01', userId: 'ST-01', returnHubId: 'HUB-B',
    sensorConfirmed: true, observedBatteryPercent: 51, issueDetected: false,
    ...overrides,
  };
}

export function chargingInput(overrides: Partial<ChargingRequestInput> = {}): ChargingRequestInput {
  const date = new Date();
  date.setDate(date.getDate() + 2);
  const desiredDate = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
  return {
    userId: 'ST-01', hubId: 'HUB-A', personalVehicleLabel: 'Personal E-Bike',
    desiredDate, startTime: '09:00', endTime: '11:00',
    ...overrides,
  };
}

export function parkingInput(overrides: Partial<ReserveParkingInput> = {}): ReserveParkingInput {
  const window = validWindow();
  return {
    userId: 'ST-01', hubId: 'HUB-A', parkingSpaceId: 'PS-A01',
    startAt: window.requestedStartAt, endAt: window.requestedEndAt,
    ...overrides,
  };
}

export function addReportedIncident(resourceType: Incident['resourceType'], resourceId: string, hubId: string): void {
  useMobilityDataStore.setState((current) => ({
    incidents: [
      {
        id: 'INC-NEW', hubId, resourceType, resourceId,
        description: 'Test fixture report', status: 'reported',
        reportedAt: new Date().toISOString(),
      },
      ...current.incidents,
    ],
  }));
}
