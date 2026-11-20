import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router';
import {
    Button,
    Card,
    StatusBadge,
    Textarea,
} from '../../../components/ui';
import { ROUTES } from '../../../routes/paths';
import { useAuthStore } from '../../../stores/useAuthStore';
import { useMobilityDataStore } from '../../../stores/useMobilityDataStore';
import type { Vehicle } from '../../../types/domain';

export function MyReservationsPage() {
    const navigate = useNavigate();
    const currentUser = useAuthStore((state) => state.currentUser);
    const userId = currentUser?.id ?? 'ST-01';

    const hubs = useMobilityDataStore((state) => state.hubs);
    const vehicles = useMobilityDataStore((state) => state.vehicles);
    const vehicleReservations = useMobilityDataStore(
        (state) => state.vehicleReservations
    );
    const trips = useMobilityDataStore((state) => state.trips);
    const expireVehicleReservation = useMobilityDataStore(
        (state) => state.expireVehicleReservation
    );
    const reportPreTripIssue = useMobilityDataStore(
        (state) => state.reportPreTripIssue
    );

    const [reportingReservationId, setReportingReservationId] = useState<
        string | null
    >(null);
    const [damageDescription, setDamageDescription] = useState('');
    const [photoAttached, setPhotoAttached] = useState(false);
    const [dismissedExpiredId, setDismissedExpiredId] = useState<string | null>(
        null
    );

    const [reportedOutcome, setReportedOutcome] = useState<{
        vehicleLabel: string;
        pickupHubName: string;
        alternativesSameHub: Vehicle[];
    } | null>(null);

    const myReservations = useMemo(
        () => vehicleReservations.filter((r) => r.userId === userId),
        [vehicleReservations, userId]
    );

    const activeReserved = useMemo(
        () => myReservations.find((r) => r.status === 'reserved'),
        [myReservations]
    );

    const latestExpired = useMemo(
        () => myReservations.find((r) => r.status === 'expired'),
        [myReservations]
    );

    const activeTrip = useMemo(
        () => trips.find((t) => t.userId === userId && t.status === 'active'),
        [trips, userId]
    );

    useEffect(() => {
        if (!activeReserved) return;
        const checkExpiry = () => {
            if (new Date(activeReserved.expiresAt).getTime() <= Date.now()) {
                expireVehicleReservation(activeReserved.id);
            }
        };
        checkExpiry();
        const timer = window.setInterval(checkExpiry, 1000);
        return () => window.clearInterval(timer);
    }, [activeReserved, expireVehicleReservation]);

    // Screen: UC03 Alternative A1 · Report outcome (Issue Reported)
    if (reportedOutcome) {
        return (
            <div className="space-y-6 font-sans">
                <div className="space-y-1">
                    <h1 className="font-heading text-3xl font-bold text-text-primary">
                        Issue Reported
                    </h1>
                    <p className="text-sm text-text-secondary">
                        The damage incident has been recorded. Choose another vehicle to
                        continue.
                    </p>
                </div>

                <div className="flex items-start gap-3 rounded-xl border border-border-mint bg-surface-subtle p-4">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-brand-primary text-xs font-bold text-brand-primary">
                        !
                    </span>
                    <div className="space-y-0.5">
                        <p className="font-heading text-sm font-bold text-text-primary">
                            Incident recorded
                        </p>
                        <p className="text-xs text-text-secondary">
                            Your reservation for faulty {reportedOutcome.vehicleLabel} has
                            been automatically cancelled.
                        </p>
                    </div>
                </div>

                <Card className="grid gap-4 rounded-xl p-5 sm:grid-cols-3">
                    <div>
                        <p className="text-xs text-text-secondary">Vehicle Name</p>
                        <p className="mt-1 font-heading text-base font-bold text-text-primary">
                            {reportedOutcome.vehicleLabel}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-text-secondary">Pickup Hub</p>
                        <p className="mt-1 font-heading text-base font-bold text-text-primary">
                            {reportedOutcome.pickupHubName}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-text-secondary">Reservation Status</p>
                        <div className="mt-1">
                            <StatusBadge
                                variant="danger"
                                className="font-heading text-xs font-bold"
                            >
                                Cancelled
                            </StatusBadge>
                        </div>
                    </div>
                </Card>

                <div>
                    <Button
                        variant="primary"
                        className="rounded-lg px-4 py-2 font-sans text-xs font-medium"
                        onClick={() => navigate(ROUTES.STUDENT.HUBS)}
                    >
                        Choose Another Vehicle
                    </Button>
                </div>

                {reportedOutcome.alternativesSameHub.length > 0 && (
                    <section className="space-y-3 pt-2">
                        <h2 className="font-heading text-xl font-bold text-text-primary">
                            Available at the Same Hub
                        </h2>
                        <div className="grid gap-5 sm:grid-cols-2">
                            {reportedOutcome.alternativesSameHub.map((alt) => (
                                <Card key={alt.id} className="rounded-xl p-5">
                                    <div className="flex h-40 items-center justify-center rounded-lg border border-border-default bg-surface-subtle text-xs text-text-muted">
                                        Vehicle Image
                                    </div>
                                    <p className="mt-4 text-xs text-text-secondary">
                                        Shared Electric Vehicle
                                    </p>
                                    <h3 className="font-heading text-lg font-bold text-text-primary">
                                        {alt.label}
                                    </h3>
                                    <p className="text-xs text-text-secondary">
                                        Pickup Hub: {reportedOutcome.pickupHubName}
                                    </p>
                                    <div className="mt-3 flex items-end justify-between">
                                        <div className="space-y-1">
                                            <p className="text-xs text-text-secondary">
                                                Availability Status
                                            </p>
                                            <StatusBadge
                                                variant="success"
                                                className="font-heading text-xs font-bold"
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
                                            View Details
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        );
    }

    // Screen: UC03 Alternative A1 · Damage before pickup
    if (reportingReservationId && activeReserved) {
        const reservedVehicle = vehicles.find(
            (v) => v.id === activeReserved.vehicleId
        );
        const pickupHub = hubs.find((h) => h.id === activeReserved.pickupHubId);

        const handleSubmitReport = (event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            const outcome = reportPreTripIssue({
                reservationId: activeReserved.id,
                userId,
                description: damageDescription,
            });
            setReportingReservationId(null);
            setDamageDescription('');
            setPhotoAttached(false);
            if (outcome.ok) {
                setReportedOutcome({
                    vehicleLabel: reservedVehicle?.label ?? activeReserved.vehicleId,
                    pickupHubName: pickupHub?.name ?? activeReserved.pickupHubId,
                    alternativesSameHub: outcome.alternativesSameHub,
                });
            }
        };

        return (
            <form
                onSubmit={handleSubmitReport}
                className="space-y-6 font-sans"
                noValidate
            >
                <div className="space-y-1">
                    <h1 className="font-heading text-3xl font-bold text-text-primary">
                        Report Issue Before Trip
                    </h1>
                    <p className="text-sm text-text-secondary">
                        Report damage to your reserved vehicle before starting your trip.
                    </p>
                </div>

                <Card className="grid gap-4 rounded-xl p-5 sm:grid-cols-3">
                    <div>
                        <p className="text-xs text-text-secondary">Vehicle Name</p>
                        <p className="mt-1 font-heading text-base font-bold text-text-primary">
                            {reservedVehicle?.label ?? activeReserved.vehicleId}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-text-secondary">Pickup Hub</p>
                        <p className="mt-1 font-heading text-base font-bold text-text-primary">
                            {pickupHub?.name ?? activeReserved.pickupHubId}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-text-secondary">Reservation Status</p>
                        <div className="mt-1">
                            <StatusBadge
                                variant="success"
                                className="font-heading text-xs font-bold"
                            >
                                Reserved
                            </StatusBadge>
                        </div>
                    </div>
                </Card>

                <Card className="space-y-5 rounded-xl p-6">
                    <h2 className="font-heading text-lg font-bold text-text-primary">
                        Damage Photo
                    </h2>

                    <div className="grid items-center gap-5 sm:grid-cols-[1fr_1.4fr]">
                        <div className="flex h-36 flex-col items-center justify-center rounded-lg border border-dashed border-border-strong bg-surface-subtle text-xs text-text-muted">
                            <span>{photoAttached ? 'damage-photo-01.jpg' : 'Damage Photo'}</span>
                        </div>

                        <div className="space-y-2.5">
                            <p className="text-xs text-text-secondary">
                                Add a photo showing the damage to{' '}
                                {reservedVehicle?.label ?? activeReserved.vehicleId}.
                            </p>
                            <Button
                                type="button"
                                variant="secondary"
                                className="rounded-lg px-4 py-2 font-sans text-xs font-medium"
                                onClick={() => setPhotoAttached(true)}
                            >
                                {photoAttached ? 'Photo Attached' : 'Add Photo'}
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label
                            htmlFor="pre-trip-damage-desc"
                            className="block font-heading text-xs font-bold text-text-primary"
                        >
                            Description (optional)
                        </label>
                        <Textarea
                            id="pre-trip-damage-desc"
                            rows={3}
                            placeholder="Describe the damage you noticed"
                            value={damageDescription}
                            onChange={(e) => setDamageDescription(e.target.value)}
                        />
                    </div>
                </Card>

                <p className="text-xs text-text-secondary">
                    Submitting records the incident and automatically cancels the
                    reservation for this faulty vehicle. Another vehicle will be
                    suggested.
                </p>

                <div className="flex flex-wrap items-center gap-3">
                    <Button
                        type="submit"
                        variant="primary"
                        className="rounded-lg px-5 py-2.5 font-sans text-xs font-medium"
                    >
                        Submit Report
                    </Button>
                    <Button
                        type="button"
                        variant="secondary"
                        className="rounded-lg px-5 py-2.5 font-sans text-xs font-medium"
                        onClick={() => setReportingReservationId(null)}
                    >
                        Back to My Reservations
                    </Button>
                </div>
            </form>
        );
    }

    // Screen: UC02 Alternative A2 — Reservation Expired
    const showExpiredNotice =
        !activeReserved &&
        !activeTrip &&
        latestExpired &&
        latestExpired.id !== dismissedExpiredId;

    if (showExpiredNotice) {
        const expiredVehicle = vehicles.find(
            (v) => v.id === latestExpired.vehicleId
        );
        const expiredHub = hubs.find((h) => h.id === latestExpired.pickupHubId);

        return (
            <div className="space-y-6 font-sans">
                <div className="space-y-1">
                    <h1 className="font-heading text-3xl font-bold text-text-primary">
                        Reservation Expired
                    </h1>
                    <p className="text-sm text-text-secondary">
                        Alternative A2 — the reservation hold has ended.
                    </p>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-border-default bg-surface-subtle p-4 text-xs text-text-secondary">
                    <span>◷</span>
                    <span>
                        The hold period ended without pickup or an extension. Your
                        reservation was automatically cancelled.
                    </span>
                </div>

                <Card className="grid gap-5 rounded-xl p-6 sm:grid-cols-2">
                    <div>
                        <p className="text-xs text-text-secondary">Vehicle Name</p>
                        <p className="mt-1 font-heading text-lg font-bold text-text-primary">
                            {expiredVehicle?.label ?? latestExpired.vehicleId}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-text-secondary">Pickup Hub</p>
                        <p className="mt-1 font-heading text-lg font-bold text-text-primary">
                            {expiredHub?.name ?? latestExpired.pickupHubId}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-text-secondary">Reservation Status</p>
                        <div className="mt-1">
                            <StatusBadge
                                variant="neutral"
                                className="font-heading text-xs font-bold"
                            >
                                Cancelled
                            </StatusBadge>
                        </div>
                    </div>
                    <div>
                        <p className="text-xs text-text-secondary">Vehicle Status</p>
                        <div className="mt-1">
                            <StatusBadge
                                variant="success"
                                className="font-heading text-xs font-bold"
                            >
                                Available
                            </StatusBadge>
                        </div>
                    </div>
                </Card>

                <div className="flex flex-wrap items-center gap-3">
                    <Button
                        variant="primary"
                        className="rounded-lg px-5 py-2.5 font-sans text-xs font-medium"
                        onClick={() => navigate(ROUTES.STUDENT.HUBS)}
                    >
                        Find Another Vehicle
                    </Button>
                    <Button
                        variant="secondary"
                        className="rounded-lg px-5 py-2.5 font-sans text-xs font-medium"
                        onClick={() => setDismissedExpiredId(latestExpired.id)}
                    >
                        Dismiss
                    </Button>
                </div>
            </div>
        );
    }

    // Screen: Main My Reservations (UC03 Entry)
    const reservedVehicle = activeReserved
        ? vehicles.find((v) => v.id === activeReserved.vehicleId)
        : undefined;
    const reservedHub = activeReserved
        ? hubs.find((h) => h.id === activeReserved.pickupHubId)
        : undefined;

    const activeTripVehicle = activeTrip
        ? vehicles.find((v) => v.id === activeTrip.vehicleId)
        : undefined;

    return (
        <div className="space-y-6 font-sans">
            <div className="space-y-1">
                <h1 className="font-heading text-3xl font-bold text-text-primary">
                    My Reservations
                </h1>
                <p className="text-sm text-text-secondary">
                    Your reserved vehicle is ready for pickup after you arrive at the
                    corresponding hub.
                </p>
            </div>

            {activeReserved && reservedVehicle && (
                <>
                    <div className="flex items-start gap-3 rounded-xl border border-border-mint bg-surface-subtle p-4">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-brand-primary text-xs font-bold text-brand-primary">
                            !
                        </span>
                        <div className="space-y-0.5">
                            <p className="font-heading text-sm font-bold text-text-primary">
                                Ready for pickup
                            </p>
                            <p className="text-xs text-text-secondary">
                                When you are at {reservedHub?.name ?? activeReserved.pickupHubId},
                                select Pick Up to verify the vehicle reserved for you.
                            </p>
                        </div>
                    </div>

                    <Card className="rounded-xl p-6">
                        <div className="grid items-center gap-6 md:grid-cols-[1.05fr_1fr]">
                            <div className="flex h-60 items-center justify-center rounded-lg border border-border-default bg-surface-subtle text-xs text-text-muted">
                                Vehicle Image
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs text-text-secondary">Reserved for you</p>
                                    <h2 className="mt-0.5 font-heading text-2xl font-bold text-text-primary">
                                        {reservedVehicle.label}
                                    </h2>
                                    <p className="mt-1 text-xs text-text-secondary">
                                        Pickup Hub: {reservedHub?.name ?? activeReserved.pickupHubId}
                                    </p>
                                </div>

                                <div className="space-y-1.5">
                                    <p className="text-xs text-text-secondary">
                                        Reservation Status
                                    </p>
                                    <StatusBadge
                                        variant="success"
                                        className="min-w-[120px] justify-center font-heading text-xs font-bold"
                                    >
                                        Reserved
                                    </StatusBadge>
                                </div>

                                <div className="space-y-1">
                                    <p className="text-xs text-text-secondary">Battery Level</p>
                                    <p className="font-heading text-xl font-bold text-text-primary">
                                        {reservedVehicle.batteryPercent}%
                                    </p>
                                </div>

                                <div className="pt-1">
                                    <Button
                                        variant="primary"
                                        className="rounded-lg px-6 py-2.5 font-sans text-xs font-medium"
                                        onClick={() =>
                                            navigate(
                                                ROUTES.STUDENT.PICKUP_VEHICLE(activeReserved.id)
                                            )
                                        }
                                    >
                                        Pick Up
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <div>
                        <Button
                            variant="secondary"
                            className="rounded-lg px-4 py-2 font-sans text-xs font-medium"
                            onClick={() => setReportingReservationId(activeReserved.id)}
                        >
                            Report Issue Before Trip
                        </Button>
                    </div>
                </>
            )}

            {activeTrip && activeTripVehicle && (
                <Card className="flex flex-wrap items-center justify-between gap-4 rounded-xl p-5">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2.5">
                            <h2 className="font-heading text-lg font-bold text-text-primary">
                                {activeTripVehicle.label}
                            </h2>
                            <StatusBadge
                                variant="success"
                                className="font-heading text-xs font-bold"
                            >
                                In Use
                            </StatusBadge>
                        </div>
                        <p className="text-xs text-text-secondary">
                            Active trip started at{' '}
                            {new Date(activeTrip.startedAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                            })}
                        </p>
                    </div>

                    <Button
                        variant="primary"
                        className="rounded-lg px-4 py-2 font-sans text-xs font-medium"
                        onClick={() => navigate(ROUTES.STUDENT.ACTIVE_TRIP(activeTrip.id))}
                    >
                        Return Vehicle
                    </Button>
                </Card>
            )}

            {!activeReserved && !activeTrip && (
                <Card className="space-y-4 rounded-xl p-8 text-center">
                    <p className="text-sm text-text-secondary">
                        You do not have any active vehicle reservations right now.
                    </p>
                    <div>
                        <Button
                            variant="primary"
                            className="rounded-lg px-5 py-2.5 font-sans text-xs font-medium"
                            onClick={() => navigate(ROUTES.STUDENT.HUBS)}
                        >
                            Explore Hubs
                        </Button>
                    </div>
                </Card>
            )}
        </div>
    );
}