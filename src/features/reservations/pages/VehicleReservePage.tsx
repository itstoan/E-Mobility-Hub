import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
    Button,
    Card,
    DateTimeInput,
    StatusBadge,
} from '../../../components/ui';
import { ROUTES } from '../../../routes/paths';
import { useAuthStore } from '../../../stores/useAuthStore';
import {
    MIN_SAFE_BATTERY_PERCENT,
    useMobilityDataStore,
} from '../../../stores/useMobilityDataStore';
import type { Vehicle, VehicleReservation } from '../../../types/domain';

function pad2(n: number): string {
    return String(n).padStart(2, '0');
}

function getDefaultTimeWindow() {
    const now = new Date();
    const start = new Date(now.getTime() + 10 * 60_000);
    const end = new Date(start.getTime() + 60 * 60_000);
    return {
        startTime: `${pad2(start.getHours())}:${pad2(start.getMinutes())}`,
        endTime: `${pad2(end.getHours())}:${pad2(end.getMinutes())}`,
    };
}

function combineDateTime(
    timeStr: string,
    isEndAfterStart = false,
    startIso?: string
): string {
    if (!timeStr) return '';
    const [hh, mm] = timeStr.split(':').map(Number);
    if (Number.isNaN(hh) || Number.isNaN(mm)) return '';

    const d = startIso ? new Date(startIso) : new Date();
    d.setHours(hh, mm, 0, 0);

    if (isEndAfterStart && startIso) {
        const startDate = new Date(startIso);
        if (d.getTime() <= startDate.getTime()) {
            d.setDate(d.getDate() + 1);
        }
    }
    return d.toISOString();
}

export function VehicleReservePage() {
    const { vehicleId = '' } = useParams();
    const navigate = useNavigate();

    const currentUser = useAuthStore((state) => state.currentUser);
    const hubs = useMobilityDataStore((state) => state.hubs);
    const vehicles = useMobilityDataStore((state) => state.vehicles);
    const reserveVehicleAtomic = useMobilityDataStore(
        (state) => state.reserveVehicleAtomic
    );
    const expireVehicleReservation = useMobilityDataStore(
        (state) => state.expireVehicleReservation
    );

    const vehicle = useMemo(
        () => vehicles.find((v) => v.id === vehicleId),
        [vehicles, vehicleId]
    );

    const pickupHub = useMemo(
        () =>
            vehicle?.currentHubId
                ? hubs.find((h) => h.id === vehicle.currentHubId)
                : undefined,
        [hubs, vehicle]
    );

    const defaultWindow = useMemo(() => getDefaultTimeWindow(), []);
    const [startTime, setStartTime] = useState(defaultWindow.startTime);
    const [endTime, setEndTime] = useState(defaultWindow.endTime);
    const [timeError, setTimeError] = useState<string | null>(null);

    const [confirmedReservation, setConfirmedReservation] =
        useState<VehicleReservation | null>(null);
    const [unavailableState, setUnavailableState] = useState<{
        message: string;
        alternatives: Vehicle[];
        isSameHub: boolean;
    } | null>(null);
    const [secondsRemaining, setSecondsRemaining] = useState(15 * 60);

    useEffect(() => {
        if (!confirmedReservation) return;

        const updateCountdown = () => {
            const diffSec = Math.max(
                0,
                Math.floor(
                    (new Date(confirmedReservation.expiresAt).getTime() - Date.now()) /
                    1000
                )
            );
            setSecondsRemaining(diffSec);
            if (diffSec === 0) {
                expireVehicleReservation(confirmedReservation.id);
            }
        };

        updateCountdown();
        const timer = window.setInterval(updateCountdown, 1000);
        return () => window.clearInterval(timer);
    }, [confirmedReservation, expireVehicleReservation]);

    const initiallyUnavailable =
        !confirmedReservation &&
        !unavailableState &&
        vehicle &&
        (vehicle.status !== 'available' ||
            vehicle.batteryPercent < MIN_SAFE_BATTERY_PERCENT ||
            !vehicle.currentHubId);

    const fallbackAlternatives = useMemo(() => {
        if (!vehicle) return { list: [] as Vehicle[], isSameHub: true };
        const sameHub = vehicles.filter(
            (v) =>
                v.id !== vehicle.id &&
                v.currentHubId === vehicle.currentHubId &&
                v.status === 'available' &&
                v.batteryPercent >= MIN_SAFE_BATTERY_PERCENT
        );
        if (sameHub.length > 0) {
            return { list: sameHub, isSameHub: true };
        }
        return {
            list: vehicles.filter(
                (v) =>
                    v.id !== vehicle.id &&
                    v.currentHubId !== null &&
                    v.status === 'available' &&
                    v.batteryPercent >= MIN_SAFE_BATTERY_PERCENT
            ),
            isSameHub: false,
        };
    }, [vehicles, vehicle]);

    if (!vehicle) {
        return (
            <div className="space-y-4 font-sans">
                <h1 className="font-heading text-3xl font-bold text-text-primary">
                    Confirm Vehicle Reservation
                </h1>
                <Card className="rounded-xl p-6">
                    <p className="text-sm text-text-secondary">
                        Vehicle <strong className="font-heading font-bold">{vehicleId}</strong> was not found.
                    </p>
                    <Button
                        variant="secondary"
                        className="mt-4 font-sans text-xs font-medium"
                        onClick={() => navigate(ROUTES.STUDENT.HUBS)}
                    >
                        Back to Explore Hubs
                    </Button>
                </Card>
            </div>
        );
    }

    // Screen 3 (Alternative A1): Vehicle No Longer Available
    if (unavailableState || initiallyUnavailable) {
        const alternatives =
            unavailableState?.alternatives ?? fallbackAlternatives.list;
        const isSameHub =
            unavailableState?.isSameHub ?? fallbackAlternatives.isSameHub;
        const message =
            unavailableState?.message ??
            'Another student may have reserved this vehicle, or its battery may have fallen below the safe operating threshold.';

        return (
            <div className="space-y-6 font-sans">
                <div className="space-y-1">
                    <h1 className="font-heading text-3xl font-bold text-text-primary">
                        Vehicle No Longer Available
                    </h1>
                    <p className="text-sm text-text-secondary">
                        Alternative A1 — the selected vehicle cannot be reserved.
                    </p>
                </div>

                <div
                    role="alert"
                    className="flex items-start gap-3 rounded-xl border border-status-warning-text/30 bg-status-warning-bg p-4"
                >
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-status-warning-text text-xs font-bold text-status-warning-text">
                        !
                    </span>
                    <div className="space-y-1">
                        <p className="font-heading text-sm font-bold text-text-primary">
                            {vehicle.label}
                        </p>
                        <p className="text-xs text-text-secondary">{message}</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <Button
                        variant="primary"
                        className="rounded-lg px-4 py-2 font-sans text-xs font-medium"
                        onClick={() => navigate(ROUTES.STUDENT.HUBS)}
                    >
                        Choose Another Vehicle
                    </Button>
                    <Button
                        variant="secondary"
                        className="rounded-lg px-4 py-2 font-sans text-xs font-medium"
                        onClick={() => navigate(ROUTES.STUDENT.VEHICLE_DETAILS(vehicle.id))}
                    >
                        Back to Vehicle Details
                    </Button>
                </div>

                {alternatives.length > 0 && (
                    <section className="space-y-3.5 pt-2">
                        <h2 className="font-heading text-xl font-bold text-text-primary">
                            {isSameHub
                                ? 'Available at the Same Hub'
                                : 'Available at Nearby Hubs'}
                        </h2>
                        <div className="grid gap-5 sm:grid-cols-2">
                            {alternatives.map((alt) => {
                                const altHub = hubs.find((h) => h.id === alt.currentHubId);
                                return (
                                    <Card key={alt.id} className="rounded-xl p-5">
                                        <div className="flex h-40 items-center justify-center rounded-lg border border-border-default bg-surface-subtle text-xs text-text-muted">
                                            Vehicle Image
                                        </div>

                                        <div className="mt-4 space-y-1">
                                            <h3 className="font-heading text-lg font-bold text-text-primary">
                                                {alt.label}
                                            </h3>
                                            <p className="text-xs text-text-secondary">
                                                Pickup Hub: {altHub?.name ?? alt.currentHubId}
                                            </p>
                                        </div>

                                        <div className="mt-3 flex items-end justify-between gap-3">
                                            <div className="space-y-1.5">
                                                <p className="text-xs text-text-secondary">
                                                    Availability Status
                                                </p>
                                                <StatusBadge
                                                    variant="success"
                                                    className="min-w-[120px] justify-center font-heading text-xs font-bold"
                                                >
                                                    Available
                                                </StatusBadge>
                                            </div>

                                            <Button
                                                variant="secondary"
                                                className="rounded-lg px-4 py-2 font-sans text-xs font-medium"
                                                onClick={() =>
                                                    navigate(ROUTES.STUDENT.VEHICLE_DETAILS(alt.id))
                                                }
                                            >
                                                View Details →
                                            </Button>
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    </section>
                )}
            </div>
        );
    }

    // Screen 2: Vehicle Reserved Successfully
    if (confirmedReservation) {
        const mins = pad2(Math.floor(secondsRemaining / 60));
        const secs = pad2(secondsRemaining % 60);

        return (
            <div className="space-y-6 font-sans">
                <div className="space-y-1">
                    <h1 className="font-heading text-3xl font-bold text-text-primary">
                        Vehicle Reserved Successfully
                    </h1>
                    <p className="text-sm text-text-secondary">
                        Your reservation is confirmed. Pick up the vehicle before your
                        reservation expires.
                    </p>
                </div>

                <div className="flex items-center gap-3.5 rounded-xl border border-border-mint bg-surface-selected px-5 py-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-primary text-xs text-white">
                        ✓
                    </span>
                    <div>
                        <p className="text-xs text-text-secondary">Reservation Status</p>
                        <p className="font-heading text-sm font-bold text-brand-primary">
                            Reserved
                        </p>
                    </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                    <Card className="space-y-3 rounded-xl p-5">
                        <h2 className="font-heading text-base font-bold text-text-primary">
                            Reservation Code
                        </h2>
                        <div className="flex h-16 items-center justify-center rounded-lg bg-surface-subtle">
                            <span className="font-heading text-2xl font-bold tracking-widest text-text-primary">
                                {confirmedReservation.pickupCode}
                            </span>
                        </div>
                        <p className="text-xs text-text-muted">
                            Use this PIN or vehicle QR code at pickup
                        </p>
                    </Card>

                    <Card className="space-y-3 rounded-xl p-5">
                        <h2 className="font-heading text-base font-bold text-text-primary">
                            Time Remaining
                        </h2>
                        <div className="flex h-16 items-center gap-2.5 text-text-primary">
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-brand-primary text-xs text-brand-primary">
                                ◷
                            </span>
                            <span className="font-heading text-3xl font-bold tracking-wider">
                                {mins}:{secs}
                            </span>
                        </div>
                        <p className="text-xs text-text-muted">
                            Hold window countdown before automatic release
                        </p>
                    </Card>
                </div>

                <Card className="space-y-4 rounded-xl p-5">
                    <h2 className="font-heading text-base font-bold text-text-primary">
                        Reservation Summary
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <p className="text-xs text-text-secondary">Vehicle Name</p>
                            <p className="mt-1 font-heading text-base font-bold text-text-primary">
                                {vehicle.label}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-text-secondary">Pickup Hub</p>
                            <p className="mt-1 font-heading text-base font-bold text-text-primary">
                                {pickupHub?.name ?? confirmedReservation.pickupHubId}
                            </p>
                        </div>
                    </div>
                </Card>

                <div>
                    <Button
                        variant="primary"
                        className="rounded-lg px-5 py-2.5 font-sans text-xs font-medium"
                        onClick={() => navigate(ROUTES.STUDENT.RESERVATIONS)}
                    >
                        View Reservation
                    </Button>
                </div>
            </div>
        );
    }

    // Screen 1: Confirm Vehicle Reservation
    const handleConfirm = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setTimeError(null);

        if (!startTime || !endTime) {
            setTimeError('Please select both start and end times.');
            return;
        }

        const startIso = combineDateTime(startTime);
        const endIso = combineDateTime(endTime, true, startIso);

        if (!startIso || !endIso || new Date(endIso).getTime() <= new Date(startIso).getTime()) {
            setTimeError('End time must be later than start time.');
            return;
        }

        const res = reserveVehicleAtomic({
            userId: currentUser?.id ?? 'ST-01',
            vehicleId: vehicle.id,
            requestedStartAt: startIso,
            requestedEndAt: endIso,
        });

        if (!('reason' in res)) {
            setConfirmedReservation(res.reservation);
            return;
        }

        if (res.reason === 'invalid_time') {
            setTimeError(res.message);
            return;
        }

        const hasSameHubAlts = res.alternativesSameHub.length > 0;
        setUnavailableState({
            message: res.message,
            alternatives: hasSameHubAlts
                ? res.alternativesSameHub
                : res.alternativesOtherHubs,
            isSameHub: hasSameHubAlts,
        });
    };

    return (
        <form onSubmit={handleConfirm} className="space-y-6 font-sans" noValidate>
            <div className="space-y-1">
                <h1 className="font-heading text-3xl font-bold text-text-primary">
                    Confirm Vehicle Reservation
                </h1>
                <p className="text-sm text-text-secondary">
                    Review the selected vehicle and choose your desired reservation time
                    window.
                </p>
            </div>

            <Card className="space-y-5 rounded-xl p-6">
                <div className="grid items-center gap-6 border-b border-border-default pb-5 sm:grid-cols-2">
                    <div>
                        <p className="text-xs text-text-secondary">Vehicle Name</p>
                        <h2 className="mt-1 font-heading text-xl font-bold text-text-primary">
                            {vehicle.label}
                        </h2>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-baseline justify-between">
                            <p className="text-xs text-text-secondary">Battery Level</p>
                            <span className="font-heading text-xl font-bold text-text-primary">
                                {vehicle.batteryPercent}%
                            </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
                            <div
                                className="h-full rounded-full bg-brand-primary"
                                style={{ width: `${vehicle.batteryPercent}%` }}
                            />
                        </div>
                    </div>
                </div>

                <div>
                    <p className="text-xs text-text-secondary">Pickup Hub</p>
                    <p className="mt-1 font-heading text-lg font-bold text-text-primary">
                        {pickupHub?.name ?? vehicle.currentHubId}
                    </p>
                </div>
            </Card>

            <div className="grid gap-5 sm:grid-cols-2">
                <div className="rounded-xl border border-border-default bg-surface-subtle p-4">
                    <p className="font-heading text-xs font-bold text-text-primary">
                        Expected Hold Duration
                    </p>
                    <p className="mt-1 text-xs text-text-secondary">
                        15 minutes hold window from confirmation
                    </p>
                </div>

                <div className="rounded-xl border border-border-default bg-surface-subtle p-4">
                    <p className="font-heading text-xs font-bold text-text-primary">
                        Cancellation Policy / Fee
                    </p>
                    <p className="mt-1 text-xs text-text-secondary">
                        No cancellation fee if cancelled before hold expiry
                    </p>
                </div>
            </div>

            <Card className="space-y-4 rounded-xl p-6">
                <h2 className="font-heading text-lg font-bold text-text-primary">
                    Desired Reservation Time Window
                </h2>

                <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-1.5">
                        <label
                            htmlFor="reserve-start-time"
                            className="block text-xs text-text-secondary"
                        >
                            Start Time
                        </label>
                        <DateTimeInput
                            id="reserve-start-time"
                            mode="time"
                            value={startTime}
                            invalid={Boolean(timeError)}
                            onChange={(e) => {
                                setStartTime(e.target.value);
                                if (timeError) setTimeError(null);
                            }}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label
                            htmlFor="reserve-end-time"
                            className="block text-xs text-text-secondary"
                        >
                            End Time
                        </label>
                        <DateTimeInput
                            id="reserve-end-time"
                            mode="time"
                            value={endTime}
                            invalid={Boolean(timeError)}
                            onChange={(e) => {
                                setEndTime(e.target.value);
                                if (timeError) setTimeError(null);
                            }}
                        />
                    </div>
                </div>

                {timeError && (
                    <p role="alert" className="text-xs text-status-danger-text">
                        {timeError}
                    </p>
                )}
            </Card>

            <div className="flex flex-wrap items-center gap-3">
                <Button
                    type="submit"
                    variant="primary"
                    className="rounded-lg px-5 py-2.5 font-sans text-xs font-medium"
                >
                    Confirm Reservation
                </Button>

                <Button
                    type="button"
                    variant="secondary"
                    className="rounded-lg px-5 py-2.5 font-sans text-xs font-medium"
                    onClick={() => navigate(ROUTES.STUDENT.VEHICLE_DETAILS(vehicle.id))}
                >
                    Back to Vehicle Details
                </Button>
            </div>
        </form>
    );
}