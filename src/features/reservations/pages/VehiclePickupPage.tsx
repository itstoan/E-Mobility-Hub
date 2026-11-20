import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
    Button,
    Card,
    Dialog,
    Input,
    StatusBadge,
} from '../../../components/ui';
import { ROUTES } from '../../../routes/paths';
import { useMobilityDataStore } from '../../../stores/useMobilityDataStore';
import type { Trip, Vehicle } from '../../../types/domain';

function pad2(n: number): string {
    return String(n).padStart(2, '0');
}

export function VehiclePickupPage() {
    const { reservationId = '' } = useParams();
    const navigate = useNavigate();

    const hubs = useMobilityDataStore((state) => state.hubs);
    const vehicles = useMobilityDataStore((state) => state.vehicles);
    const vehicleReservations = useMobilityDataStore(
        (state) => state.vehicleReservations
    );
    const verifyAndUnlockVehicle = useMobilityDataStore(
        (state) => state.verifyAndUnlockVehicle
    );

    const reservation = useMemo(
        () => vehicleReservations.find((r) => r.id === reservationId),
        [vehicleReservations, reservationId]
    );

    const vehicle = useMemo(
        () =>
            reservation
                ? vehicles.find((v) => v.id === reservation.vehicleId)
                : undefined,
        [vehicles, reservation]
    );

    const pickupHub = useMemo(
        () =>
            reservation
                ? hubs.find((h) => h.id === reservation.pickupHubId)
                : undefined,
        [hubs, reservation]
    );

    const [pinInput, setPinInput] = useState('');
    const [mismatchError, setMismatchError] = useState(false);
    const [generalError, setGeneralError] = useState<string | null>(null);
    const [isUnlocking, setIsUnlocking] = useState(false);
    const [unlockFailed, setUnlockFailed] = useState(false);
    const [startedSession, setStartedSession] = useState<{
        trip: Trip;
        vehicle: Vehicle;
    } | null>(null);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [guidanceOpen, setGuidanceOpen] = useState(false);

    const unlockTimerRef = useRef<number | null>(null);

    useEffect(() => {
        return () => {
            if (unlockTimerRef.current !== null) {
                window.clearTimeout(unlockTimerRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (!startedSession) return;
        const timer = window.setInterval(() => {
            setElapsedSeconds((prev) => prev + 1);
        }, 1000);
        return () => window.clearInterval(timer);
    }, [startedSession]);

    // Screen: Trip Started (chỉ xuất hiện sau khi khóa vật lý xác nhận mở)
    if (startedSession) {
        const mins = pad2(Math.floor(elapsedSeconds / 60));
        const secs = pad2(elapsedSeconds % 60);
        const startTimeText = new Date(
            startedSession.trip.startedAt
        ).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
        });

        return (
            <div className="space-y-6 font-sans">
                <div className="space-y-1">
                    <h1 className="font-heading text-3xl font-bold text-text-primary">
                        Trip Started
                    </h1>
                    <p className="text-sm text-text-secondary">
                        Pickup successful. Your trip controls are shown below.
                    </p>
                </div>

                <div className="flex items-center gap-3.5 rounded-xl border border-border-mint bg-surface-selected px-5 py-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-primary text-xs text-white">
                        ✓
                    </span>
                    <div>
                        <p className="font-heading text-sm font-bold text-text-primary">
                            Vehicle unlocked. Usage session started.
                        </p>
                        <p className="text-xs text-text-secondary">
                            {startedSession.vehicle.label} is now In Use.
                        </p>
                    </div>
                </div>

                <Card className="space-y-4 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                        <h2 className="font-heading text-base font-bold text-text-primary">
                            Usage Session
                        </h2>
                        <span className="inline-flex items-center gap-1.5 font-heading text-xs font-bold text-brand-primary">
                            <span className="h-2 w-2 rounded-full bg-brand-primary" />
                            Session active
                        </span>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <p className="text-xs text-text-secondary">Vehicle Name</p>
                            <p className="mt-1 font-heading text-lg font-bold text-text-primary">
                                {startedSession.vehicle.label}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-text-secondary">Vehicle Status</p>
                            <div className="mt-1">
                                <StatusBadge
                                    variant="success"
                                    className="min-w-[110px] justify-center font-heading text-xs font-bold"
                                >
                                    In Use
                                </StatusBadge>
                            </div>
                        </div>
                    </div>

                    <div>
                        <p className="text-xs text-text-secondary">Pickup Hub</p>
                        <p className="mt-1 font-heading text-base font-bold text-text-primary">
                            {pickupHub?.name ?? startedSession.trip.startHubId}
                        </p>
                    </div>
                </Card>

                <div className="grid gap-5 sm:grid-cols-3">
                    <Card className="space-y-2 rounded-xl p-5">
                        <p className="text-xs text-text-secondary">Battery Level</p>
                        <p className="font-heading text-2xl font-bold text-text-primary">
                            {startedSession.vehicle.batteryPercent}%
                        </p>
                    </Card>

                    <Card className="space-y-2 rounded-xl p-5">
                        <p className="text-xs text-text-secondary">Start Time</p>
                        <p className="font-heading text-2xl font-bold text-text-primary">
                            {startTimeText}
                        </p>
                    </Card>

                    <Card className="space-y-2 rounded-xl p-5">
                        <p className="text-xs text-text-secondary">Session Time</p>
                        <p className="font-heading text-2xl font-bold text-text-primary">
                            {mins}:{secs}
                        </p>
                    </Card>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <Button
                        variant="primary"
                        className="rounded-lg px-4 py-2.5 font-sans text-xs font-medium"
                        onClick={() =>
                            navigate(ROUTES.STUDENT.ACTIVE_TRIP(startedSession.trip.id))
                        }
                    >
                        Report Incident
                    </Button>
                    <Button
                        variant="primary"
                        className="rounded-lg px-4 py-2.5 font-sans text-xs font-medium"
                        onClick={() =>
                            navigate(ROUTES.STUDENT.ACTIVE_TRIP(startedSession.trip.id))
                        }
                    >
                        Return Vehicle
                    </Button>
                    <Button
                        variant="secondary"
                        className="rounded-lg px-4 py-2.5 font-sans text-xs font-medium"
                        onClick={() => setGuidanceOpen(true)}
                    >
                        Return Guidance
                    </Button>
                </div>

                <Dialog
                    open={guidanceOpen}
                    onClose={() => setGuidanceOpen(false)}
                    title="Return Guidance"
                    footer={
                        <Button
                            variant="primary"
                            className="font-sans text-xs font-medium"
                            onClick={() => setGuidanceOpen(false)}
                        >
                            Got it
                        </Button>
                    }
                >
                    <p className="text-sm leading-6 text-text-secondary">
                        Park the shared electric vehicle inside an available Mobility Hub
                        docking area, engage the physical stand lock, and select{' '}
                        <strong className="font-heading font-bold">Return Vehicle</strong>{' '}
                        to complete physical docking verification and end your usage
                        session.
                    </p>
                </Dialog>
            </div>
        );
    }

    // Screen: UC03 Alternative A3 · Unlock failure
    if (unlockFailed) {
        return (
            <div className="space-y-6 font-sans">
                <div className="space-y-1">
                    <h1 className="font-heading text-3xl font-bold text-text-primary">
                        Unable to Unlock the Vehicle
                    </h1>
                    <p className="text-sm text-text-secondary">
                        {vehicle?.label ?? reservation?.vehicleId} could not be unlocked
                        after three attempts.
                    </p>
                </div>

                <div
                    role="alert"
                    className="flex items-center gap-3 rounded-xl border border-status-danger-border bg-status-danger-surface p-4 text-xs text-status-danger-text"
                >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-status-danger-text font-bold">
                        !
                    </span>
                    <span>
                        Unable to unlock the vehicle. Please contact support or switch to
                        another vehicle.
                    </span>
                </div>

                <Card className="grid gap-4 rounded-xl p-5 sm:grid-cols-3">
                    <div>
                        <p className="text-xs text-text-secondary">Vehicle Name</p>
                        <p className="mt-1 font-heading text-base font-bold text-text-primary">
                            {vehicle?.label ?? reservation?.vehicleId}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-text-secondary">Pickup Hub</p>
                        <p className="mt-1 font-heading text-base font-bold text-text-primary">
                            {pickupHub?.name ?? reservation?.pickupHubId}
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

                <Card className="space-y-3 rounded-xl p-5">
                    <h2 className="font-heading text-base font-bold text-text-primary">
                        Unlock Attempts
                    </h2>
                    <div className="grid gap-3 sm:grid-cols-3">
                        {[1, 2, 3].map((attempt) => (
                            <div
                                key={attempt}
                                className="flex items-center gap-2 rounded-lg border border-border-default bg-surface-subtle px-4 py-3 text-xs text-text-primary"
                            >
                                <span className="text-status-danger-text">⊗</span>
                                <span className="font-heading font-bold">
                                    Attempt {attempt} — Failed
                                </span>
                            </div>
                        ))}
                    </div>
                </Card>

                <div className="flex items-start gap-3 rounded-xl border border-border-mint bg-surface-subtle p-4">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-brand-primary text-xs font-bold text-brand-primary">
                        !
                    </span>
                    <div className="space-y-0.5">
                        <p className="font-heading text-sm font-bold text-text-primary">
                            Cancellation and refund
                        </p>
                        <p className="text-xs text-text-secondary">
                            Your reservation has been cancelled/refunded. You can choose
                            another vehicle without penalty.
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <Button
                        variant="primary"
                        className="rounded-lg px-4 py-2.5 font-sans text-xs font-medium"
                        onClick={() => navigate(ROUTES.STUDENT.HUBS)}
                    >
                        Choose Another Vehicle
                    </Button>
                    <Button
                        variant="secondary"
                        className="rounded-lg px-4 py-2.5 font-sans text-xs font-medium"
                        onClick={() => navigate(ROUTES.STUDENT.RESERVATIONS)}
                    >
                        Back to My Reservations
                    </Button>
                </div>
            </div>
        );
    }

    // Chặn nếu đơn không tồn tại hoặc không còn ở trạng thái 'reserved'
    if (!reservation || !vehicle || reservation.status !== 'reserved') {
        return (
            <div className="space-y-4 font-sans">
                <h1 className="font-heading text-3xl font-bold text-text-primary">
                    Verify Vehicle
                </h1>
                <Card className="rounded-xl p-6">
                    <p className="text-sm text-text-secondary">
                        Reservation is no longer active (already completed, cancelled, or
                        expired).
                    </p>
                    <Button
                        variant="secondary"
                        className="mt-4 font-sans text-xs font-medium"
                        onClick={() => navigate(ROUTES.STUDENT.RESERVATIONS)}
                    >
                        Back to My Reservations
                    </Button>
                </Card>
            </div>
        );
    }

    const processVerification = (codeToVerify: string) => {
        setMismatchError(false);
        setGeneralError(null);
        setIsUnlocking(true);

        if (unlockTimerRef.current !== null) {
            window.clearTimeout(unlockTimerRef.current);
        }

        unlockTimerRef.current = window.setTimeout(() => {
            const simulateHardwareFail =
                codeToVerify.trim() === '0000' || vehicle.id === 'EV-05';

            const res = verifyAndUnlockVehicle({
                reservationId: reservation.id,
                enteredCode: codeToVerify,
                simulateHardwareFailure: simulateHardwareFail,
            });

            setIsUnlocking(false);

            if (!('reason' in res)) {
                setStartedSession({ trip: res.trip, vehicle: res.vehicle });
                return;
            }

            if (res.reason === 'mismatch') {
                setMismatchError(true);
                return;
            }

            if (res.reason === 'hardware_unlock_failed') {
                setUnlockFailed(true);
                return;
            }

            setGeneralError(res.message || 'Reservation is no longer available.');
        }, 450);
    };

    const handlePinSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        processVerification(pinInput);
    };

    // Screen: Verify Vehicle
    return (
        <div className="space-y-6 font-sans">
            <div className="space-y-1">
                <h1 className="font-heading text-3xl font-bold text-text-primary">
                    {mismatchError ? 'Vehicle Does Not Match' : 'Verify Vehicle'}
                </h1>
                <p className="text-sm text-text-secondary">
                    {mismatchError
                        ? 'Your reservation remains Reserved. Check the vehicle and try either verification method again.'
                        : 'Scan the vehicle QR code or enter its PIN. Only one method is needed.'}
                </p>
            </div>

            {mismatchError && (
                <div
                    role="alert"
                    className="flex items-center gap-3 rounded-xl border border-status-danger-border bg-status-danger-surface p-4 text-xs text-status-danger-text"
                >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-status-danger-text font-bold">
                        !
                    </span>
                    <span>
                        This is not the vehicle assigned to your reservation. Please check
                        the vehicle plate/ID.
                    </span>
                </div>
            )}

            {generalError && (
                <div
                    role="alert"
                    className="flex items-center gap-3 rounded-xl border border-status-danger-border bg-status-danger-surface p-4 text-xs text-status-danger-text"
                >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-status-danger-text font-bold">
                        !
                    </span>
                    <span>{generalError}</span>
                </div>
            )}

            <Card className="grid gap-4 rounded-xl p-5 sm:grid-cols-3">
                <div>
                    <p className="text-xs text-text-secondary">Vehicle Name</p>
                    <p className="mt-1 font-heading text-base font-bold text-text-primary">
                        {vehicle.label}
                    </p>
                </div>
                <div>
                    <p className="text-xs text-text-secondary">Pickup Hub</p>
                    <p className="mt-1 font-heading text-base font-bold text-text-primary">
                        {pickupHub?.name ?? reservation.pickupHubId}
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

            {!mismatchError && (
                <p className="text-xs text-text-secondary">
                    The identifier will be matched against the vehicle assigned to your
                    reservation. Once validated, an unlock command is sent.
                </p>
            )}

            <div className="space-y-3">
                <p className="font-heading text-xs font-bold text-text-primary">
                    Choose either method
                </p>

                <div className="grid items-stretch gap-4 md:grid-cols-[1fr_auto_1fr]">
                    <Card className="flex flex-col justify-between space-y-3 rounded-xl p-5">
                        <h2 className="font-heading text-lg font-bold text-text-primary">
                            Scan Vehicle QR Code
                        </h2>

                        <button
                            type="button"
                            disabled={isUnlocking}
                            onClick={() => processVerification(vehicle.id)}
                            className="flex h-44 w-full flex-col items-center justify-center gap-2 rounded-lg border border-border-default bg-surface-subtle p-4 text-center transition-colors hover:border-brand-primary hover:bg-surface-selected/40 disabled:opacity-60"
                        >
                            <span className="text-2xl text-text-muted">📷</span>
                            <span className="text-xs text-text-muted">
                                {isUnlocking
                                    ? 'Confirming physical unlock...'
                                    : 'Click to simulate scanning vehicle QR code'}
                            </span>
                        </button>

                        <p className="text-xs text-text-secondary">
                            Scan the QR code on the physical vehicle.
                        </p>
                    </Card>

                    <div className="flex items-center justify-center text-xs text-text-muted">
                        or
                    </div>

                    <Card className="flex flex-col justify-between space-y-4 rounded-xl p-5">
                        <div className="space-y-1.5">
                            <h2 className="font-heading text-lg font-bold text-text-primary">
                                Enter PIN
                            </h2>
                            <p className="text-xs text-text-secondary">
                                Use the vehicle PIN as an alternative to scanning.
                            </p>
                        </div>

                        <form onSubmit={handlePinSubmit} className="space-y-4">
                            <div className="space-y-1.5">
                                <label
                                    htmlFor="vehicle-pickup-pin"
                                    className="block font-heading text-xs font-bold text-text-primary"
                                >
                                    Vehicle PIN
                                </label>
                                <Input
                                    id="vehicle-pickup-pin"
                                    placeholder={`Enter vehicle PIN (e.g. ${reservation.pickupCode})`}
                                    value={pinInput}
                                    invalid={mismatchError}
                                    disabled={isUnlocking}
                                    onChange={(e) => {
                                        setPinInput(e.target.value);
                                        if (mismatchError) setMismatchError(false);
                                    }}
                                />
                            </div>

                            <Button
                                type="submit"
                                variant="primary"
                                isLoading={isUnlocking}
                                className="rounded-lg px-5 py-2 font-sans text-xs font-medium"
                            >
                                Verify Vehicle
                            </Button>
                        </form>
                    </Card>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                {mismatchError && (
                    <Button
                        type="button"
                        variant="primary"
                        className="rounded-lg px-4 py-2 font-sans text-xs font-medium"
                        onClick={() => {
                            setMismatchError(false);
                            setPinInput('');
                        }}
                    >
                        Try Again
                    </Button>
                )}

                <Button
                    type="button"
                    variant="secondary"
                    className="rounded-lg px-4 py-2 font-sans text-xs font-medium"
                    onClick={() => navigate(ROUTES.STUDENT.RESERVATIONS)}
                >
                    Back to My Reservations
                </Button>
            </div>
        </div>
    );
}