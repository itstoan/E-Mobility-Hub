import { create } from 'zustand';
import { createMockSeed } from '../data/mock/seed';
import type {
    Id,
    Incident,
    MockDatabase,
    ParkingReservation,
    Trip,
    Vehicle,
    VehicleReservation,
} from '../types/domain';

export const MIN_SAFE_BATTERY_PERCENT = 20;

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

    // UC05 actions
    reserveParkingSpaceAtomic: (input: ReserveParkingInput) => ReserveParkingResult;
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
}));