import { create } from 'zustand';
import type { StoreApi } from 'zustand';
import { createMockSeed } from '../data/mock/seed';
import type {
    Id,
    ChargingRequest,
    ChargingSchedule,
    IncidentImpact,
    Incident,
    MockDatabase,
    ParkingReservation,
    Trip,
    Vehicle,
    VehicleReservation,

} from '../types/domain';

export const MIN_SAFE_BATTERY_PERCENT = 20;

export type ActionResult =
  | { ok: true; message: string; id?: string }
  | { ok: false; message: string };

type BusinessData = Pick<MockDatabase,
  'users' | 'hubs' | 'vehicles' | 'vehicleReservations' | 'trips' |
  'chargingPorts' | 'chargingRequests' | 'chargingSchedules' |
  'incidents' | 'incidentImpacts'
>;

export interface ReturnVehicleInput {
  tripId: Id;
  userId: Id;
  returnHubId: Id;
  sensorConfirmed: boolean; // demo
  observedBatteryPercent: number;
  issueDetected: boolean;
}
export interface ChargingRequestInput {
  userId: Id;
  hubId: Id;
  personalVehicleLabel: string;
  desiredDate: string;
  startTime: string;
  endTime: string;
}


function success(message: string, id?: string): ActionResult {
  return { ok: true, message, id };
}
function error(message: string): ActionResult { return { ok: false, message }; }
function nextId(prefix: string, records: readonly { id: string }[]): string {
  const ids = new Set(records.map((r) => r.id));
  for (let i = 1; ; i++) {
    const id = `${prefix}-${String(i).padStart(2, '0')}`;
    if (!ids.has(id)) return id;
  }
}

function commit(
    set: StoreApi<MobilityDataState>['setState'],
    change: (data: BusinessData) => ActionResult
): ActionResult {
    let result: ActionResult = error('Action was not completed.');
    set((state) => {
        const draft: BusinessData = structuredClone({
            users: state.users,
            hubs: state.hubs,
            vehicles: state.vehicles,
            vehicleReservations: state.vehicleReservations,
            trips: state.trips,
            chargingPorts: state.chargingPorts,
            chargingRequests: state.chargingRequests,
            chargingSchedules: state.chargingSchedules,
            incidents: state.incidents,
            incidentImpacts: state.incidentImpacts,
        });
        result = change(draft);
        return result.ok ? draft : state;
    });
    return result;
}

function isOperator(db: BusinessData, userId: Id): boolean {
  return db.users.some((u) => u.id === userId && u.role === 'system_operator');
}

function markImpact(db: BusinessData, incidentId: Id, type: IncidentImpact['affectedType'], affectedId: Id): void {
  if (db.incidentImpacts.some((i) => i.incidentId === incidentId && i.affectedType === type && i.affectedId === affectedId)) return;
  db.incidentImpacts.push({ id: nextId('IMP', db.incidentImpacts), incidentId,
    affectedType: type, affectedId, status: 'pending_review' });
}

function blockAffectedResource(db: BusinessData, incident: Incident): void {
  if (incident.resourceType === 'vehicle') {
    const vehicle = db.vehicles.find((v) => v.id === incident.resourceId);
    if (!vehicle) return;
    vehicle.status = 'unavailable';
    db.vehicleReservations.filter((r) => r.vehicleId === vehicle.id &&
      (r.status === 'reserved' || r.status === 'active'))
      .forEach((r) => markImpact(db, incident.id, 'vehicle_reservation', r.id));
    return;
  }
  const port = db.chargingPorts.find((p) => p.id === incident.resourceId);
  if (!port) return;
  port.physicalState = 'out_of_service';
  db.chargingSchedules.filter((s) => s.portId === port.id &&
    ['allocated', 'charging', 'disrupted'].includes(s.status)).forEach((schedule) => {
      schedule.status = 'disrupted';
      const request = db.chargingRequests.find((r) => r.id === schedule.requestId);
      if (request && request.status !== 'completed' && request.status !== 'cancelled') {
        request.status = 'needs_rescheduling';
      }
      markImpact(db, incident.id, 'charging_schedule', schedule.id);
    });
}

function parseLocalDateTime(date: string, time: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return null;
  const result = new Date(`${date}T${time}:00`);
  if (!Number.isFinite(result.getTime())) return null;
  const [y, m, d] = date.split('-').map(Number);
  const [h, min] = time.split(':').map(Number);
  if (result.getFullYear() !== y || result.getMonth() !== m - 1 || result.getDate() !== d ||
      result.getHours() !== h || result.getMinutes() !== min) return null;
  return result;
}

export function canHubAcceptSharedVehicle(
    data: Pick<MockDatabase, 'hubs' | 'vehicles'>, hubId: Id
): { available: boolean; reason: string } {
    const hub = data.hubs.find((item) => item.id === hubId);
    if (!hub) return { available: false, reason: 'Hub not found.' };
    if (hub.connectionStatus !== 'online') {
        return { available: false, reason: 'Hub offline — return cannot be confirmed.' };
    }
    const occupied = data.vehicles.filter((vehicle) => vehicle.currentHubId === hub.id).length;
    if (occupied >= hub.sharedVehicleCapacity) {
        return { available: false, reason: `No shared-vehicle spaces left (${occupied}/${hub.sharedVehicleCapacity}).` };
    }
    return { available: true, reason: `${occupied}/${hub.sharedVehicleCapacity} shared-vehicle spaces occupied.` };
}

export interface ReserveVehicleInput {
    userId: Id;
    vehicleId: Id;
    requestedStartAt: string;
    requestedEndAt: string;
    /** flag demo/kiểm thử tình huống tranh chấp đồng thời (NFR-C01) */
    simulateRaceConflict?: boolean;
}

export type ReserveVehicleResult =
    | { ok: true; reservation: VehicleReservation; vehicle: Vehicle }
    | {
        ok: false;
        reason: 'invalid_time' | 'unavailable' | 'low_battery' | 'conflict';
        message: string;
        latestVehicle?: Vehicle;
        alternativesSameHub: Vehicle[];
        alternativesOtherHubs: Vehicle[];
    };

export interface ReserveParkingInput {
    userId: Id;
    hubId: Id;
    parkingSpaceId: Id;
    startAt: string;
    endAt: string;
    /** flag demo/kiểm thử hai sinh viên cùng đặt P-01 */
    simulateRaceConflict?: boolean;
}

export type ReserveParkingResult =
    | { ok: true; reservation: ParkingReservation }
    | {
        ok: false;
        reason: 'invalid_time' | 'space_unavailable' | 'conflict';
        message: string;
    };

export type PickupUnlockResult =
    | { ok: true; trip: Trip; vehicle: Vehicle }
    | {
        ok: false;
        reason: 'not_found' | 'mismatch' | 'hardware_unlock_failed';
        message: string;
        attempts: number;
    };

interface MobilityDataState extends MockDatabase {
    resetDemoData: () => void;

    // UC01 helper
    refreshVehicleSnapshot: (vehicleId: Id) => Vehicle | undefined;

    // UC02 actions
    reserveVehicleAtomic: (input: ReserveVehicleInput) => ReserveVehicleResult;
    expireVehicleReservation: (reservationId: Id) => void;
    
    // UC03 actions
    reportPreTripIssue: (params: {
        reservationId: Id;
        userId: Id;
        description: string;
    }) => { ok: boolean; incident?: Incident; alternativesSameHub: Vehicle[] };
    verifyAndUnlockVehicle: (params: {
        reservationId: Id;
        enteredCode: string;
        simulateHardwareFailure?: boolean;
    }) => PickupUnlockResult;

    // UC04: Return shared electric vehicle
    confirmVehicleReturn: (input: ReturnVehicleInput) => ActionResult;

    // UC05 actions
    reserveParkingSpaceAtomic: (input: ReserveParkingInput) => ReserveParkingResult;

    // UC06: Submit personal EV charging request (does not allocate a port)
    submitChargingRequest: (input: ChargingRequestInput) => ActionResult;

    // UC10: Incident lifecycle and dependent-workflow review
    confirmIncident: (incidentId: Id, operatorId: Id) => ActionResult;
    closeFalseAlarm: (incidentId: Id, operatorId: Id) => ActionResult;
    saveIncidentHandling: (
        incidentId: Id, operatorId: Id, notes: string, proposedResolution: string
    ) => ActionResult;
    reviewIncidentImpact: (impactId: Id, operatorId: Id) => ActionResult;
    resolveIncident: (incidentId: Id, operatorId: Id, repairConfirmed: boolean) => ActionResult;
}

function isOverlapping(
    startA: string,
    endA: string,
    startB: string,
    endB: string
): boolean {
    const a0 = new Date(startA).getTime();
    const a1 = new Date(endA).getTime();
    const b0 = new Date(startB).getTime();
    const b1 = new Date(endB).getTime();
    if (Number.isNaN(a0) || Number.isNaN(a1) || Number.isNaN(b0) || Number.isNaN(b1)) {
        return false;
    }
    return a0 < b1 && b0 < a1;
}

function buildInitialState(): MockDatabase {
    return structuredClone(createMockSeed(new Date()));
}

export const useMobilityDataStore = create<MobilityDataState>((set, get) => ({
    ...buildInitialState(),

    resetDemoData: () => {
        set(buildInitialState());
    },

    refreshVehicleSnapshot: (vehicleId) => {
        return get().vehicles.find((v) => v.id === vehicleId);
    },

    reserveVehicleAtomic: (input) => {
        const startMs = new Date(input.requestedStartAt).getTime();
        const endMs = new Date(input.requestedEndAt).getTime();

        if (
            !input.requestedStartAt ||
            !input.requestedEndAt ||
            Number.isNaN(startMs) ||
            Number.isNaN(endMs) ||
            startMs >= endMs
        ) {
            return {
                ok: false,
                reason: 'invalid_time',
                message: 'End time must be later than start time.',
                alternativesSameHub: [],
                alternativesOtherHubs: [],
            };
        }

        let result!: ReserveVehicleResult;

        // Thao tác kiểm tra & cập nhật nguyên tử trong cùng một state transition
        set((state) => {
            const target = state.vehicles.find((v) => v.id === input.vehicleId);
            const getAlternatives = (hubId: Id | null) => ({
                alternativesSameHub: state.vehicles.filter(
                    (v) =>
                        v.id !== input.vehicleId &&
                        v.currentHubId === hubId &&
                        v.status === 'available' &&
                        v.batteryPercent >= MIN_SAFE_BATTERY_PERCENT
                ),
                alternativesOtherHubs: state.vehicles.filter(
                    (v) =>
                        v.id !== input.vehicleId &&
                        v.currentHubId !== null &&
                        v.currentHubId !== hubId &&
                        v.status === 'available' &&
                        v.batteryPercent >= MIN_SAFE_BATTERY_PERCENT
                ),
            });

            if (!target || !target.currentHubId) {
                result = {
                    ok: false,
                    reason: 'unavailable',
                    message: 'Vehicle is no longer available at the pickup Hub.',
                    latestVehicle: target,
                    alternativesSameHub: [],
                    alternativesOtherHubs: state.vehicles.filter(
                        (v) =>
                            v.status === 'available' &&
                            v.batteryPercent >= MIN_SAFE_BATTERY_PERCENT
                    ),
                };
                return state;
            }

            // Mô phỏng trường hợp người dùng khác vừa đặt trước vài mili-giây
            if (input.simulateRaceConflict) {
                const updatedVehicles = state.vehicles.map((v) =>
                    v.id === target.id ? { ...v, status: 'reserved' as const } : v
                );
                const latest = updatedVehicles.find((v) => v.id === target.id);
                const alts = getAlternatives(target.currentHubId);
                result = {
                    ok: false,
                    reason: 'conflict',
                    message:
                        'Another student just reserved this vehicle seconds ago. Please choose another available vehicle.',
                    latestVehicle: latest,
                    ...alts,
                };
                return { vehicles: updatedVehicles };
            }

            const hasOverlap = state.vehicleReservations.some(
                (r) =>
                    r.vehicleId === target.id &&
                    (r.status === 'reserved' || r.status === 'active') &&
                    isOverlapping(
                        r.requestedStartAt,
                        r.requestedEndAt,
                        input.requestedStartAt,
                        input.requestedEndAt
                    )
            );

            if (target.status !== 'available' || hasOverlap) {
                const alts = getAlternatives(target.currentHubId);
                result = {
                    ok: false,
                    reason: 'unavailable',
                    message:
                        'This vehicle is no longer available for the selected time window.',
                    latestVehicle: target,
                    ...alts,
                };
                return state;
            }

            if (target.batteryPercent < MIN_SAFE_BATTERY_PERCENT) {
                const alts = getAlternatives(target.currentHubId);
                result = {
                    ok: false,
                    reason: 'low_battery',
                    message: `Vehicle battery (${target.batteryPercent}%) is below the safe operating threshold (${MIN_SAFE_BATTERY_PERCENT}%).`,
                    latestVehicle: target,
                    ...alts,
                };
                return state;
            }

            const now = new Date();
            const pinCode = String(Math.floor(1000 + Math.random() * 9000));
            const newReservation: VehicleReservation = {
                id: `VR-${String(state.vehicleReservations.length + 1).padStart(2, '0')}`,
                userId: input.userId,
                vehicleId: target.id,
                pickupHubId: target.currentHubId,
                createdAt: now.toISOString(),
                requestedStartAt: input.requestedStartAt,
                requestedEndAt: input.requestedEndAt,
                expiresAt: new Date(now.getTime() + 15 * 60_000).toISOString(),
                pickupCode: pinCode,
                status: 'reserved',
            };

            const updatedVehicle: Vehicle = {
                ...target,
                status: 'reserved',
            };

            result = {
                ok: true,
                reservation: newReservation,
                vehicle: updatedVehicle,
            };

            return {
                vehicleReservations: [newReservation, ...state.vehicleReservations],
                vehicles: state.vehicles.map((v) =>
                    v.id === target.id ? updatedVehicle : v
                ),
            };
        });

        return result;
    },

    expireVehicleReservation: (reservationId) => {
        set((state) => {
            const targetRes = state.vehicleReservations.find(
                (r) => r.id === reservationId
            );
            if (!targetRes || targetRes.status !== 'reserved') return state;

            return {
                vehicleReservations: state.vehicleReservations.map((r) =>
                    r.id === reservationId ? { ...r, status: 'expired' } : r
                ),
                vehicles: state.vehicles.map((v) =>
                    v.id === targetRes.vehicleId && v.status === 'reserved'
                        ? { ...v, status: 'available' }
                        : v
                ),
            };
        });
    },

    reportPreTripIssue: ({ reservationId, userId, description }) => {
        let outcome: {
            ok: boolean;
            incident?: Incident;
            alternativesSameHub: Vehicle[];
        } = { ok: false, alternativesSameHub: [] };

        set((state) => {
            const reservation = state.vehicleReservations.find(
                (r) => r.id === reservationId
            );
            if (!reservation) return state;

            const newIncident: Incident = {
                id: `INC-${String(state.incidents.length + 1).padStart(2, '0')}`,
                hubId: reservation.pickupHubId,
                resourceType: 'vehicle',
                resourceId: reservation.vehicleId,
                description:
                    description.trim() || 'Pre-trip damage reported by student (UC03)',
                status: 'reported',
                reportedAt: new Date().toISOString(),
                reportedByUserId: userId,
            };

            const updatedVehicles = state.vehicles.map((v) =>
                v.id === reservation.vehicleId
                    ? { ...v, status: 'unavailable' as const }
                    : v
            );

            const alternativesSameHub = updatedVehicles.filter(
                (v) =>
                    v.id !== reservation.vehicleId &&
                    v.currentHubId === reservation.pickupHubId &&
                    v.status === 'available' &&
                    v.batteryPercent >= MIN_SAFE_BATTERY_PERCENT
            );

            outcome = {
                ok: true,
                incident: newIncident,
                alternativesSameHub,
            };

            return {
                incidents: [newIncident, ...state.incidents],
                vehicles: updatedVehicles,
                vehicleReservations: state.vehicleReservations.map((r) =>
                    r.id === reservationId ? { ...r, status: 'cancelled' } : r
                ),
            };
        });

        return outcome;
    },

    verifyAndUnlockVehicle: ({
        reservationId,
        enteredCode,
        simulateHardwareFailure = false,
    }) => {
        let result: PickupUnlockResult = {
            ok: false,
            reason: 'not_found',
            message: 'Reservation not found or no longer active.',
            attempts: 0,
        };

        set((state) => {
            const reservation = state.vehicleReservations.find(
                (r) => r.id === reservationId && r.status === 'reserved'
            );
            if (!reservation) return state;

            const vehicle = state.vehicles.find((v) => v.id === reservation.vehicleId);
            if (!vehicle) return state;

            const normalized = enteredCode.trim().toUpperCase();
            const validCodes = [
                reservation.pickupCode.toUpperCase(),
                vehicle.id.toUpperCase(),
                vehicle.label.toUpperCase(),
            ];

            // Alternative A2: Quét sai mã QR / nhập sai PIN -> giữ nguyên trạng thái Reserved
            if (!normalized || !validCodes.includes(normalized)) {
                result = {
                    ok: false,
                    reason: 'mismatch',
                    message:
                        'This is not the vehicle assigned to your reservation. Please check the vehicle plate/ID or PIN.',
                    attempts: 0,
                };
                return state;
            }

            // Alternative A3: Thử gửi lệnh mở khóa 3 lần nhưng khóa vật lý không phản hồi
            // Theo góp ý giảng viên: Không tạo Trip hay đổi xe sang in_use nếu chưa có xác nhận mở khóa vật lý!
            if (simulateHardwareFailure) {
                result = {
                    ok: false,
                    reason: 'hardware_unlock_failed',
                    message:
                        'Unable to unlock the vehicle after 3 attempts. Your reservation has been cancelled/refunded without penalty.',
                    attempts: 3,
                };
                return {
                    vehicleReservations: state.vehicleReservations.map((r) =>
                        r.id === reservationId ? { ...r, status: 'cancelled' } : r
                    ),
                    vehicles: state.vehicles.map((v) =>
                        v.id === vehicle.id ? { ...v, status: 'unavailable' } : v
                    ),
                };
            }

            // Main flow: Thiết bị xác nhận đã mở khóa vật lý -> khởi tạo Trip & chuyển xe sang in_use
            const nowIso = new Date().toISOString();
            const newTrip: Trip = {
                id: `TR-${String(state.trips.length + 1).padStart(2, '0')}`,
                reservationId: reservation.id,
                userId: reservation.userId,
                vehicleId: vehicle.id,
                startHubId: reservation.pickupHubId,
                returnHubId: null,
                startedAt: nowIso,
                endedAt: null,
                returnConfirmedAt: null,
                status: 'active',
            };

            const updatedVehicle: Vehicle = {
                ...vehicle,
                status: 'in_use',
                currentHubId: null,
            };

            result = {
                ok: true,
                trip: newTrip,
                vehicle: updatedVehicle,
            };

            return {
                trips: [newTrip, ...state.trips],
                vehicleReservations: state.vehicleReservations.map((r) =>
                    r.id === reservationId ? { ...r, status: 'active' } : r
                ),
                vehicles: state.vehicles.map((v) =>
                    v.id === vehicle.id ? updatedVehicle : v
                ),
            };
        });

        return result;
    },

    reserveParkingSpaceAtomic: (input) => {
        const startMs = new Date(input.startAt).getTime();
        const endMs = new Date(input.endAt).getTime();

        if (
            !input.startAt ||
            !input.endAt ||
            Number.isNaN(startMs) ||
            Number.isNaN(endMs) ||
            startMs >= endMs
        ) {
            return {
                ok: false,
                reason: 'invalid_time',
                message: 'Please select a valid date and time window (end time must be after start time).',
            };
        }

        let result!: ReserveParkingResult;

        set((state) => {
            const space = state.parkingSpaces.find(
                (s) => s.id === input.parkingSpaceId && s.hubId === input.hubId
            );

            if (!space) {
                result = {
                    ok: false,
                    reason: 'space_unavailable',
                    message: 'Selected parking space was not found at this Hub.',
                };
                return state;
            }

            // Mô phỏng hai sinh viên cùng chọn P-01 và một người xác nhận trước
            if (input.simulateRaceConflict) {
                result = {
                    ok: false,
                    reason: 'conflict',
                    message: `Parking space ${space.code} was just reserved by another student for an overlapping time window. Please choose another space.`,
                };
                return {
                    parkingSpaces: state.parkingSpaces.map((s) =>
                        s.id === space.id ? { ...s, occupancy: 'occupied' } : s
                    ),
                };
            }

            const hasOverlap = state.parkingReservations.some(
                (r) =>
                    r.parkingSpaceId === space.id &&
                    r.status === 'confirmed' &&
                    isOverlapping(r.startAt, r.endAt, input.startAt, input.endAt)
            );

            if (space.occupancy !== 'empty' || hasOverlap) {
                result = {
                    ok: false,
                    reason: 'space_unavailable',
                    message: `Parking space ${space.code} is no longer available for the selected time window. Please select another space.`,
                };
                return state;
            }

            const newReservation: ParkingReservation = {
                id: `PR-${String(state.parkingReservations.length + 1).padStart(2, '0')}`,
                userId: input.userId,
                parkingSpaceId: space.id,
                startAt: input.startAt,
                endAt: input.endAt,
                status: 'confirmed',
            };

            result = {
                ok: true,
                reservation: newReservation,
            };

            return {
                parkingReservations: [newReservation, ...state.parkingReservations],
                parkingSpaces: state.parkingSpaces.map((s) =>
                    s.id === space.id ? { ...s, occupancy: 'occupied' } : s
                ),
            };
        });

        return result;
    },

    confirmVehicleReturn(input: ReturnVehicleInput): ActionResult {
      return commit(set, (db) => {
        const trip: Trip | undefined = db.trips.find((t) => t.id === input.tripId);
        if (!trip || trip.status !== 'active' || trip.userId !== input.userId) {
          return error('No active trip belonging to this student.');
        }
        const reservation: VehicleReservation | undefined = db.vehicleReservations.find((r) => r.id === trip.reservationId);
        const vehicle: Vehicle | undefined = db.vehicles.find((v) => v.id === trip.vehicleId);
        if (!reservation || reservation.status !== 'active' || !vehicle || vehicle.status !== 'in_use') {
          return error('Trip, reservation and vehicle are not in compatible states.');
        }
        const hub = db.hubs.find((h) => h.id === input.returnHubId);
        const availability = canHubAcceptSharedVehicle(db, input.returnHubId);
        if (!hub || !availability.available) return error(availability.reason);
        if (!input.sensorConfirmed) return error('Simulated docking confirmation has not been received. Trip stays active.');
        if (!Number.isFinite(input.observedBatteryPercent) || input.observedBatteryPercent < 0 || input.observedBatteryPercent > 100) {
          return error('Battery percentage must be in the range 0–100.');
        }
        const now = new Date().toISOString();
        trip.status = 'completed';
        trip.endedAt = now;
        trip.returnConfirmedAt = now;
        trip.returnHubId = hub.id;
        reservation.status = 'completed';
        vehicle.currentHubId = hub.id;
        vehicle.batteryPercent = input.observedBatteryPercent;
        vehicle.status = input.issueDetected ? 'maintenance' :
          input.observedBatteryPercent < MIN_SAFE_BATTERY_PERCENT ? 'needs_charging' : 'available';
        if (input.issueDetected) {
          db.incidents.unshift({ id: nextId('INC', db.incidents), hubId: hub.id,
            resourceType: 'vehicle', resourceId: vehicle.id,
            description: 'Issue detected during simulated return.',
            status: 'reported', reportedAt: now, reportedByUserId: input.userId });
        }
        return success(`Vehicle returned to ${hub.name}. State: ${vehicle.status}.`, trip.id);
      });
    },

    submitChargingRequest(input: ChargingRequestInput): ActionResult {
      return commit(set, (db) => {
        if (!db.users.some((u) => u.id === input.userId && u.role === 'student')) return error('Student account is required.');
        const hub = db.hubs.find((h) => h.id === input.hubId);
        if (!hub || hub.connectionStatus !== 'online') return error('Choose an online Hub. Offline status cannot confirm availability.');
        if (!db.chargingPorts.some((p) => p.hubId === hub.id && p.physicalState === 'idle')) {
          return error('No idle charging port at this Hub; choose another Hub.');
        }
        const label = input.personalVehicleLabel.trim();
        if (!label) return error('Personal electric vehicle information is required.');
        const start = parseLocalDateTime(input.desiredDate, input.startTime);
        const end = parseLocalDateTime(input.desiredDate, input.endTime);
        if (!start || !end || start >= end || start <= new Date()) {
          return error('Select a valid future time window with end after start.');
        }
        const request: ChargingRequest = {
          id: nextId('CR', db.chargingRequests), userId: input.userId, hubId: hub.id,
          personalVehicleLabel: label, requestedStartAt: start.toISOString(),
          requestedEndAt: end.toISOString(), status: 'pending_scheduling',
        };
        db.chargingRequests.unshift(request);
        return success('Request recorded as Pending Scheduling; no port allocated.', request.id);
      });
    },

    confirmIncident(incidentId: Id, operatorId: Id): ActionResult {
      return commit(set, (db) => {
        if (!isOperator(db, operatorId)) return error('System Operator required.');
        const incident = db.incidents.find((i) => i.id === incidentId);
        if (!incident || incident.status !== 'reported') return error('Only reported incidents can be confirmed.');
        const exists = incident.resourceType === 'vehicle' ?
          db.vehicles.some((v) => v.id === incident.resourceId) :
          db.chargingPorts.some((p) => p.id === incident.resourceId);
        if (!exists) return error('Incident resource not found.');
        blockAffectedResource(db, incident);
        incident.status = 'confirmed';
        return success('Incident confirmed. Resource blocked; dependencies queued for review.');
      });
    },

    saveIncidentHandling(incidentId: Id, operatorId: Id, notes: string, proposedResolution: string): ActionResult {
      return commit(set, (db) => {
        if (!isOperator(db, operatorId)) return error('System Operator required.');
        const incident = db.incidents.find((i) => i.id === incidentId);
        if (!incident || !['confirmed', 'in_progress'].includes(incident.status)) return error('Confirm incident before updating handling.');
        if (!notes.trim() || !proposedResolution.trim()) return error('Handling notes and proposed resolution are required.');
        incident.handlingNotes = notes.trim();
        incident.proposedResolution = proposedResolution.trim();
        incident.status = 'in_progress';
        return success('Handling record saved.');
      });
    },

    closeFalseAlarm(incidentId: Id, operatorId: Id): ActionResult {
      return commit(set, (db) => {
        if (!isOperator(db, operatorId)) return error('System Operator required.');
        const incident = db.incidents.find((i) => i.id === incidentId);
        if (!incident || incident.status !== 'reported') return error('Only unconfirmed reports may be marked as false alarms.');
        incident.status = 'false_alarm';
        return success('False alarm recorded. Availability was not automatically restored.');
      });
    },

    reviewIncidentImpact(impactId: Id, operatorId: Id): ActionResult {
      return commit(set, (db) => {
        if (!isOperator(db, operatorId)) return error('System Operator required.');
        const impact = db.incidentImpacts.find((i) => i.id === impactId);
        if (!impact || impact.status !== 'pending_review') return error('Impact not awaiting review.');
        if (impact.affectedType === 'vehicle_reservation') {
          const reservation = db.vehicleReservations.find((r) => r.id === impact.affectedId);
          if (!reservation || ['reserved', 'active'].includes(reservation.status)) {
            return error('Reservation requires handling by UC02/03 first (e.g. explicit cancellation).');
          }
        } else {
          const schedule: ChargingSchedule | undefined = db.chargingSchedules.find((s) => s.id === impact.affectedId);
          if (!schedule || !['completed', 'cancelled'].includes(schedule.status)) {
            return error('Charging schedule requires UC08 review/rescheduling before clearing impact.');
          }
        }
        impact.status = 'resolved';
        return success('Dependency acknowledged after the related workflow completed.');
      });
    },

    resolveIncident(incidentId: Id, operatorId: Id, repairConfirmed: boolean): ActionResult {
      return commit(set, (db) => {
        if (!isOperator(db, operatorId)) return error('System Operator required.');
        const incident = db.incidents.find((i) => i.id === incidentId);
        if (!incident || incident.status !== 'in_progress') return error('Save handling notes first.');
        if (!repairConfirmed) return error('Simulated repair verification is required.');
        if (db.incidentImpacts.some((i) => i.incidentId === incident.id && i.status === 'pending_review')) {
          return error('Dependent reservations/schedules need review by A/UC08 before resolution.');
        }
        const otherOpenFault = db.incidents.some((i) => i.id !== incident.id &&
          i.resourceId === incident.resourceId && i.resourceType === incident.resourceType &&
          ['reported', 'confirmed', 'in_progress'].includes(i.status));
        if (otherOpenFault) return error('Other open incidents still affect this resource.');
        if (incident.resourceType === 'vehicle') {
          const vehicle = db.vehicles.find((v) => v.id === incident.resourceId);
          if (!vehicle) return error('Vehicle not found.');
          const hub = db.hubs.find((h) => h.id === vehicle.currentHubId);
          if (!hub || hub.connectionStatus !== 'online') return error('Vehicle is not at an online Hub.');
          if (db.trips.some((t) => t.vehicleId === vehicle.id && t.status === 'active')) return error('Vehicle has an active trip.');
          vehicle.status = vehicle.batteryPercent < MIN_SAFE_BATTERY_PERCENT ? 'needs_charging' : 'available';
        } else {
          const port = db.chargingPorts.find((p) => p.id === incident.resourceId);
          if (!port) return error('Charging port not found.');
          port.physicalState = 'idle';
        }
        incident.status = 'resolved';
        return success('Incident resolved after simulated repair confirmation.');
      });
    },
}));