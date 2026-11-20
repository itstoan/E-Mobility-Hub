import type { MockDatabase } from "../../types/domain";
import { mockUsers } from "./users";

/** Deterministic relative-time seed; invoke with a fixed Date for repeatable tests. */
export function createMockSeed(now: Date = new Date()): MockDatabase {
  const at = (deltaMinutes: number): string =>
    new Date(now.getTime() + deltaMinutes * 60_000).toISOString();
  const nextDayAt = (hour: number, minute = 0): string =>
    new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
      hour,
      minute,
    ).toISOString();
  const activeSessionStartAt = at(-30);
  const activeSessionEndAt = at(180);

  return {
    users: mockUsers.map((user) => ({ ...user })),
    hubs: [
      { id: "HUB-A", name: "Campus Mobility Hub A", locationLabel: "Campus A",
        connectionStatus: "online", lastTelemetryAt: at(-2), sharedVehicleCapacity: 3 },
      { id: "HUB-B", name: "Campus Mobility Hub B", locationLabel: "Campus B",
        connectionStatus: "online", lastTelemetryAt: at(-3), sharedVehicleCapacity: 3 },
      { id: "HUB-C", name: "Campus Mobility Hub C", locationLabel: "Campus C",
        connectionStatus: "disconnected", lastTelemetryAt: at(-90), sharedVehicleCapacity: 2 },
    ],
    vehicles: [
      { id: "EV-01", label: "Campus EV-01", type: "e_bike", currentHubId: "HUB-A", batteryPercent: 82, status: "available" },
      { id: "EV-02", label: "Campus EV-02", type: "e_bike", currentHubId: null, batteryPercent: 51, status: "in_use" },
      { id: "EV-03", label: "Campus EV-03", type: "e_scooter", currentHubId: "HUB-B", batteryPercent: 12, status: "needs_charging" },
      { id: "EV-04", label: "Campus EV-04", type: "e_bike", currentHubId: "HUB-A", batteryPercent: 70, status: "reserved" },
      { id: "EV-05", label: "Campus EV-05", type: "e_bike", currentHubId: "HUB-C", batteryPercent: 44, status: "unavailable" },
    ],
    // UC05: chỗ cho PERSONAL EVs; nơi cho phương tiện công cộng dùng sharedVehicleCapacity.
    parkingSpaces: [
      { id: "PS-A01", hubId: "HUB-A", code: "P-01", occupancy: "empty" },
      { id: "PS-A02", hubId: "HUB-A", code: "P-02", occupancy: "occupied" },
      { id: "PS-B01", hubId: "HUB-B", code: "P-01", occupancy: "empty" },
      { id: "PS-C01", hubId: "HUB-C", code: "P-01", occupancy: "empty" },
    ],
    chargingPorts: [
      // UC08: physical state is independent from a proposed or allocated slot.
      { id: "CP-A01", hubId: "HUB-A", code: "CP-01", physicalState: "idle" },
      { id: "CP-A02", hubId: "HUB-A", code: "CP-02", physicalState: "idle" },
      { id: "CP-A03", hubId: "HUB-A", code: "CP-03", physicalState: "out_of_service" },
      { id: "CP-A04", hubId: "HUB-A", code: "CP-04", physicalState: "out_of_service" },
      { id: "CP-B01", hubId: "HUB-B", code: "B-01", physicalState: "charging" },
      { id: "CP-B02", hubId: "HUB-B", code: "B-02", physicalState: "charging" },
      { id: "CP-B03", hubId: "HUB-B", code: "B-03", physicalState: "charging" },
      { id: "CP-B04", hubId: "HUB-B", code: "B-04", physicalState: "out_of_service" },
      { id: "CP-C01", hubId: "HUB-C", code: "CP-01", physicalState: "out_of_service" },
    ],
    vehicleReservations: [
      { id: "VR-01", userId: "ST-01", vehicleId: "EV-02", pickupHubId: "HUB-A",
        createdAt: at(-60), requestedStartAt: at(-40), requestedEndAt: at(40),
        expiresAt: at(-30), pickupCode: "1357", status: "active" },
      { id: "VR-02", userId: "ST-02", vehicleId: "EV-04", pickupHubId: "HUB-A",
        createdAt: at(-5), requestedStartAt: at(0), requestedEndAt: at(60),
        expiresAt: at(25), pickupCode: "2468", status: "reserved" },
    ],
    trips: [
      { id: "TR-01", reservationId: "VR-01", userId: "ST-01", vehicleId: "EV-02",
        startHubId: "HUB-A", returnHubId: null, startedAt: at(-35),
        endedAt: null, returnConfirmedAt: null, status: "active" },
    ],
    parkingReservations: [
      { id: "PR-01", userId: "ST-02", parkingSpaceId: "PS-B01",
        startAt: at(120), endAt: at(180), status: "confirmed" },
    ],
    chargingRequests: [
      // Existing shared records retained for UC06/UC10 compatibility.
      { id: "CR-01", userId: "ST-01", hubId: "HUB-B", personalVehicleLabel: "Personal EV A",
        requestedStartAt: at(60), requestedEndAt: at(120), batteryPercent: 28,
        neededByAt: at(150), status: "pending_scheduling" },
      { id: "CR-02", userId: "ST-02", hubId: "HUB-C", personalVehicleLabel: "Personal EV B",
        requestedStartAt: at(180), requestedEndAt: at(240), batteryPercent: 17,
        neededByAt: at(270), status: "needs_rescheduling" },

      // UC08 operator sample: three pending requests matching the management mockup.
      { id: "CR-2026-001", userId: "ST-01", hubId: "HUB-A",
        personalVehicleLabel: "Personal electric vehicle",
        requestedStartAt: nextDayAt(9), requestedEndAt: nextDayAt(11),
        batteryPercent: 42, neededByAt: nextDayAt(13), status: "pending_scheduling" },
      { id: "CR-2026-002", userId: "ST-02", hubId: "HUB-A",
        personalVehicleLabel: "Personal electric vehicle",
        requestedStartAt: nextDayAt(9), requestedEndAt: nextDayAt(11),
        batteryPercent: 16, neededByAt: nextDayAt(10), status: "pending_scheduling" },
      { id: "CR-2026-003", userId: "ST-01", hubId: "HUB-B",
        personalVehicleLabel: "Personal electric vehicle",
        requestedStartAt: nextDayAt(9), requestedEndAt: nextDayAt(11),
        batteryPercent: 46, neededByAt: nextDayAt(9, 30), status: "pending_scheduling" },

      // Requests belonging to the active sessions shown separately in UC08.
      { id: "CR-SESSION-101", userId: "ST-01", hubId: "HUB-B",
        personalVehicleLabel: "Active charging vehicle",
        requestedStartAt: activeSessionStartAt, requestedEndAt: activeSessionEndAt,
        status: "charging" },
      { id: "CR-SESSION-102", userId: "ST-02", hubId: "HUB-B",
        personalVehicleLabel: "Active charging vehicle",
        requestedStartAt: activeSessionStartAt, requestedEndAt: activeSessionEndAt,
        status: "charging" },
      { id: "CR-SESSION-103", userId: "ST-01", hubId: "HUB-B",
        personalVehicleLabel: "Active charging vehicle",
        requestedStartAt: activeSessionStartAt, requestedEndAt: activeSessionEndAt,
        status: "charging" },
    ],
    // UC07: Aggregate monitoring data for the network overview.
    // Parking figures are illustrative snapshots, not UC05 ParkingSpace records.
    monitoring: {
      currentSnapshots: [
        {
          hubId: "HUB-A",
          vehicle: {
            available: 3,
            inUse: 5,
            unavailable: 2,
            total: 10,
          },
          parking: {
            available: 2,
            occupied: 18,
            unavailable: 0,
            total: 20,
          },
          charging: {
            available: 2,
            occupied: 0,
            unavailable: 2,
            total: 4,
          },
          risks: ["Parking-capacity risk"],
        },
        {
          hubId: "HUB-B",
          vehicle: {
            available: 0,
            inUse: 6,
            unavailable: 2,
            total: 8,
          },
          parking: {
            available: 10,
            occupied: 10,
            unavailable: 0,
            total: 20,
          },
          charging: {
            available: 0,
            occupied: 3,
            unavailable: 1,
            total: 4,
          },
          risks: ["Vehicle shortage"],
        },
      ],
      lastKnownSnapshots: [
        {
          hubId: "HUB-C",
          vehicle: {
            available: 4,
            inUse: 3,
            unavailable: 1,
            total: 8,
          },
          parking: {
            available: 8,
            occupied: 8,
            unavailable: 0,
            total: 16,
          },
          charging: {
            available: 1,
            occupied: 0,
            unavailable: 1,
            total: 2,
          },
          risks: [],
        },
      ],
    },
    // UC08 proposals are not committed allocations until the operator confirms them.
    chargingScheduleProposals: [
      { id: "CSP-01", requestId: "CR-01", portId: "CP-B01",
        startAt: at(65), endAt: at(115), status: "outdated" },
      { id: "CSP-2026-001", requestId: "CR-2026-001", portId: "CP-A01",
        startAt: nextDayAt(9), endAt: nextDayAt(11), status: "proposed" },
      { id: "CSP-2026-002", requestId: "CR-2026-002", portId: "CP-A02",
        startAt: nextDayAt(9), endAt: nextDayAt(11), status: "proposed" },
    ],
    chargingSchedules: [
      // Historical disrupted allocation retained for the UC10 incident-impact flow.
      { id: "CS-01", requestId: "CR-02", portId: "CP-C01",
        startAt: at(180), endAt: at(240), status: "disrupted" },
      // Three live sessions occupy Hub B ports; they remain separate from pending requests.
      { id: "CS-101", requestId: "CR-SESSION-101", portId: "CP-B01",
        startAt: activeSessionStartAt, endAt: activeSessionEndAt, status: "charging" },
      { id: "CS-102", requestId: "CR-SESSION-102", portId: "CP-B02",
        startAt: activeSessionStartAt, endAt: activeSessionEndAt, status: "charging" },
      { id: "CS-103", requestId: "CR-SESSION-103", portId: "CP-B03",
        startAt: activeSessionStartAt, endAt: activeSessionEndAt, status: "charging" },
    ],
    // UC09: Quyết định approved/rejected/proposed không chuyển xe giữa các hub
    vehicleTransferProposals: [
      { id: "TP-01", sourceHubId: "HUB-A", destinationHubId: "HUB-B",
        vehicleCount: 1, createdAt: at(-4), status: "proposed" },
      { id: "TP-02", sourceHubId: "HUB-B", destinationHubId: "HUB-A",
        vehicleCount: 1, createdAt: at(-40), status: "rejected",
        reviewedByUserId: "OP-01", reviewedAt: at(-15) },
      { id: "TP-03", sourceHubId: "HUB-A", destinationHubId: "HUB-B",
        vehicleCount: 1, createdAt: at(-55), status: "approved",
        reviewedByUserId: "OP-01", reviewedAt: at(-25) },
    ],
    incidents: [
      { id: "INC-01", hubId: "HUB-C", resourceType: "vehicle", resourceId: "EV-05",
        description: "Vehicle unavailable (simulated)", status: "confirmed", reportedAt: at(-50) },
      { id: "INC-02", hubId: "HUB-C", resourceType: "charging_port", resourceId: "CP-C01",
        description: "Charging port fault (simulated)", status: "confirmed", reportedAt: at(-20),
        proposedResolution: "Inspect CP-C01 and propose a replacement charging slot" },
      { id: "INC-03", hubId: "HUB-A", resourceType: "charging_port", resourceId: "CP-A01",
        description: "False charging-port alert (simulated)", status: "false_alarm", reportedAt: at(-35) },
    ],
    incidentImpacts: [
      { id: "IMP-01", incidentId: "INC-02", affectedType: "charging_schedule",
        affectedId: "CS-01", status: "pending_review" },
    ],
  };
}
