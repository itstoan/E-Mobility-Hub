import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import {
    Button,
    Card,
    DateTimeInput,
} from '../../../components/ui';
import { useAuthStore } from '../../../stores/useAuthStore';
import { useMobilityDataStore } from '../../../stores/useMobilityDataStore';
import type { ParkingReservation } from '../../../types/domain';

type ParkingStep =
    | 'find_hub'
    | 'choose_space'
    | 'choose_time'
    | 'review'
    | 'confirmed'
    | 'space_unavailable';

function getTodayIsoDate(): string {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function formatDisplayDate(isoDate: string): string {
    if (!isoDate) return '';
    const parsed = new Date(`${isoDate}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return isoDate;
    return parsed.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

function combineDateAndTime(dateStr: string, timeStr: string): string {
    if (!dateStr || !timeStr) return '';
    const dt = new Date(`${dateStr}T${timeStr}:00`);
    if (Number.isNaN(dt.getTime())) return '';
    return dt.toISOString();
}

export function ParkingReservationPage() {
    const currentUser = useAuthStore((state) => state.currentUser);
    const hubs = useMobilityDataStore((state) => state.hubs);
    const parkingSpaces = useMobilityDataStore((state) => state.parkingSpaces);
    const reserveParkingSpaceAtomic = useMobilityDataStore(
        (state) => state.reserveParkingSpaceAtomic
    );

    const [step, setStep] = useState<ParkingStep>('find_hub');
    const [searchInput, setSearchInput] = useState('');
    const [submittedSearch, setSubmittedSearch] = useState('');

    const [selectedHubId, setSelectedHubId] = useState<string | null>(null);
    const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);

    const [dateValue, setDateValue] = useState(getTodayIsoDate());
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('11:00');
    const [timeValidationMessage, setTimeValidationMessage] = useState<
        string | null
    >(null);

    const [confirmedBooking, setConfirmedBooking] =
        useState<ParkingReservation | null>(null);

    const selectedHub = useMemo(
        () => hubs.find((h) => h.id === selectedHubId),
        [hubs, selectedHubId]
    );

    const hubSpaces = useMemo(
        () =>
            selectedHubId
                ? parkingSpaces.filter((s) => s.hubId === selectedHubId)
                : [],
        [parkingSpaces, selectedHubId]
    );

    const selectedSpace = useMemo(
        () => hubSpaces.find((s) => s.id === selectedSpaceId),
        [hubSpaces, selectedSpaceId]
    );

    const filteredHubs = useMemo(() => {
        const q = submittedSearch.trim().toLowerCase();
        if (!q) return hubs;
        return hubs.filter(
            (h) =>
                h.name.toLowerCase().includes(q) ||
                h.locationLabel.toLowerCase().includes(q) ||
                h.id.toLowerCase().includes(q)
        );
    }, [hubs, submittedSearch]);

    const handleHubSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSubmittedSearch(searchInput);
    };

    const handleSelectHub = (hubId: string) => {
        setSelectedHubId(hubId);
        const firstEmpty = parkingSpaces.find(
            (s) => s.hubId === hubId && s.occupancy === 'empty'
        );
        setSelectedSpaceId(firstEmpty?.id ?? null);
        setStep('choose_space');
    };

    const handleProceedToReview = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!dateValue) {
            setTimeValidationMessage(
                'The reservation date is missing. Complete the date and time window to continue.'
            );
            return;
        }
        if (!startTime || !endTime) {
            setTimeValidationMessage(
                !startTime
                    ? 'The start time is missing. Complete the time window to continue. No reservation has been recorded.'
                    : 'The end time is missing. Complete the time window to continue. No reservation has been recorded.'
            );
            return;
        }
        if (endTime <= startTime) {
            setTimeValidationMessage(
                'End time must be later than start time. Please select another valid time.'
            );
            return;
        }
        setTimeValidationMessage(null);
        setStep('review');
    };

    const handleConfirmParkingReservation = () => {
        if (!selectedHub || !selectedSpace) return;

        const result = reserveParkingSpaceAtomic({
            userId: currentUser?.id ?? 'ST-01',
            hubId: selectedHub.id,
            parkingSpaceId: selectedSpace.id,
            startAt: combineDateAndTime(dateValue, startTime),
            endAt: combineDateAndTime(dateValue, endTime),
        });

        if (!('reason' in result)) {
            setConfirmedBooking(result.reservation);
            setStep('confirmed');
            return;
        }

        if (result.reason === 'invalid_time') {
            setTimeValidationMessage(result.message);
            setStep('choose_time');
            return;
        }

        setStep('space_unavailable');
    };

    // Step 5b: Alternative A1 — Space unavailable
    if (step === 'space_unavailable' && selectedHub) {
        return (
            <div className="space-y-6 font-sans">
                <div className="space-y-1">
                    <h1 className="font-heading text-3xl font-bold text-text-primary">
                        Parking Space Unavailable
                    </h1>
                    <p className="text-sm text-text-secondary">
                        The selected space is no longer available for this time window.
                    </p>
                </div>

                <Card className="space-y-4 rounded-xl p-6">
                    <div>
                        <p className="text-xs text-text-secondary">Hub</p>
                        <p className="mt-1 font-heading text-lg font-bold text-text-primary">
                            {selectedHub.name}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs text-text-secondary">
                            Requested date and time window
                        </p>
                        <p className="mt-1 font-heading text-lg font-bold text-text-primary">
                            {formatDisplayDate(dateValue)} · {startTime}–{endTime}
                        </p>
                    </div>

                    <div
                        role="alert"
                        className="rounded-lg border border-status-danger-border bg-status-danger-surface p-4"
                    >
                        <p className="font-heading text-xs font-bold text-status-danger-text">
                            No suitable parking space available
                        </p>
                        <p className="mt-1 text-xs text-status-danger-text">
                            No suitable space is available for the selected time window. Your
                            reservation has not been recorded. Choose another space to
                            continue.
                        </p>
                    </div>
                </Card>

                <div>
                    <Button
                        variant="primary"
                        className="rounded-lg px-5 py-2.5 font-sans text-xs font-medium"
                        onClick={() => {
                            setSelectedSpaceId(null);
                            setStep('choose_space');
                        }}
                    >
                        Choose Another Space
                    </Button>
                </div>
            </div>
        );
    }

    // Step 5a: Reservation recorded (Success)
    if (step === 'confirmed' && confirmedBooking && selectedHub && selectedSpace) {
        return (
            <div className="space-y-6 font-sans">
                <div className="space-y-1">
                    <h1 className="font-heading text-3xl font-bold text-text-primary">
                        Parking Space Reserved Successfully
                    </h1>
                    <p className="text-sm text-text-secondary">
                        Your parking reservation is confirmed and recorded.
                    </p>
                </div>

                <Card className="space-y-5 rounded-xl p-6">
                    <div>
                        <span className="inline-flex min-w-[120px] items-center justify-center rounded-full bg-status-success-bg px-4 py-1 font-heading text-xs font-bold text-status-success-text">
                            Reserved
                        </span>
                    </div>

                    <div>
                        <p className="text-xs text-text-secondary">Hub</p>
                        <p className="mt-1 font-heading text-lg font-bold text-text-primary">
                            {selectedHub.name}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs text-text-secondary">Parking space</p>
                        <p className="mt-1 font-heading text-lg font-bold text-text-primary">
                            {selectedSpace.code}
                        </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <p className="text-xs text-text-secondary">Reservation date</p>
                            <p className="mt-1 font-heading text-lg font-bold text-text-primary">
                                {formatDisplayDate(dateValue)}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-text-secondary">
                                Reservation time window
                            </p>
                            <p className="mt-1 font-heading text-lg font-bold text-text-primary">
                                {startTime}–{endTime}
                            </p>
                        </div>
                    </div>

                    <div>
                        <p className="text-xs text-text-secondary">Vehicle</p>
                        <p className="mt-1 font-heading text-base font-bold text-text-primary">
                            Personal electric vehicle
                        </p>
                    </div>

                    <div className="rounded-lg border border-border-default bg-surface-subtle p-4">
                        <p className="font-heading text-xs font-bold text-text-primary">
                            Reservation recorded
                        </p>
                        <p className="mt-1 text-xs text-text-secondary">
                            Your reservation has been recorded. Parking space{' '}
                            {selectedSpace.code} is now marked Reserved for this time window.
                        </p>
                    </div>
                </Card>

                <div>
                    <Button
                        variant="primary"
                        className="rounded-lg px-5 py-2.5 font-sans text-xs font-medium"
                        onClick={() => {
                            setConfirmedBooking(null);
                            setSelectedHubId(null);
                            setSelectedSpaceId(null);
                            setStep('find_hub');
                        }}
                    >
                        Back to Parking Hubs
                    </Button>
                </div>
            </div>
        );
    }

    // Step 4: Review reservation
    if (step === 'review' && selectedHub && selectedSpace) {
        return (
            <div className="space-y-6 font-sans">
                <div className="space-y-1">
                    <h1 className="font-heading text-3xl font-bold text-text-primary">
                        Confirm Reservation
                    </h1>
                    <p className="text-sm text-text-secondary">
                        Review your selected parking space and time window before
                        confirming.
                    </p>
                </div>

                <Card className="space-y-5 rounded-xl p-6">
                    <h2 className="font-heading text-lg font-bold text-text-primary">
                        Reservation Details
                    </h2>

                    <div>
                        <p className="text-xs text-text-secondary">Hub</p>
                        <p className="mt-1 font-heading text-lg font-bold text-text-primary">
                            {selectedHub.name}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs text-text-secondary">Parking space</p>
                        <p className="mt-1 font-heading text-lg font-bold text-text-primary">
                            {selectedSpace.code}
                        </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <p className="text-xs text-text-secondary">Reservation date</p>
                            <p className="mt-1 font-heading text-lg font-bold text-text-primary">
                                {formatDisplayDate(dateValue)}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-text-secondary">
                                Reservation time window
                            </p>
                            <p className="mt-1 font-heading text-lg font-bold text-text-primary">
                                {startTime}–{endTime}
                            </p>
                        </div>
                    </div>

                    <div>
                        <p className="text-xs text-text-secondary">Vehicle</p>
                        <p className="mt-1 font-heading text-base font-bold text-text-primary">
                            Personal electric vehicle
                        </p>
                    </div>
                </Card>

                <div className="flex flex-wrap items-center gap-3">
                    <Button
                        type="button"
                        variant="primary"
                        className="rounded-lg px-5 py-2.5 font-sans text-xs font-medium"
                        onClick={handleConfirmParkingReservation}
                    >
                        Confirm Reservation
                    </Button>
                    <Button
                        type="button"
                        variant="secondary"
                        className="rounded-lg px-5 py-2.5 font-sans text-xs font-medium"
                        onClick={() => setStep('choose_time')}
                    >
                        Back to Edit
                    </Button>
                </div>
            </div>
        );
    }

    // Step 3: Choose a time (+ Alternative A2 · Time correction)
    if (step === 'choose_time' && selectedHub && selectedSpace) {
        const isInvalid = Boolean(timeValidationMessage);

        return (
            <form
                onSubmit={handleProceedToReview}
                className="space-y-6 font-sans"
                noValidate
            >
                <div className="space-y-1">
                    <h1 className="font-heading text-3xl font-bold text-text-primary">
                        {isInvalid ? 'Invalid Reservation Time' : 'Select Reservation Time'}
                    </h1>
                    <p className="text-sm text-text-secondary">
                        {isInvalid
                            ? 'Check your selected reservation time before continuing.'
                            : 'Choose the date and time window for your parking reservation.'}
                    </p>
                </div>

                <Card className="space-y-5 rounded-xl p-6">
                    <div>
                        <p className="text-xs text-text-secondary">Hub</p>
                        <p className="mt-1 font-heading text-lg font-bold text-text-primary">
                            {selectedHub.name}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs text-text-secondary">Parking space</p>
                        <p className="mt-1 font-heading text-lg font-bold text-text-primary">
                            {selectedSpace.code}
                        </p>
                    </div>

                    {isInvalid && (
                        <div
                            role="alert"
                            className="rounded-lg border border-status-danger-border bg-status-danger-surface p-4"
                        >
                            <p className="font-heading text-xs font-bold text-status-danger-text">
                                Please select another valid time
                            </p>
                            <p className="mt-1 text-xs text-status-danger-text">
                                {timeValidationMessage}
                            </p>
                        </div>
                    )}

                    <div className="space-y-3">
                        {!isInvalid && (
                            <h2 className="font-heading text-lg font-bold text-text-primary">
                                Reservation Time
                            </h2>
                        )}

                        <div className="grid gap-4 sm:grid-cols-3">
                            <div className="space-y-1.5">
                                <label
                                    htmlFor="parking-date"
                                    className="block font-heading text-xs font-bold text-text-primary"
                                >
                                    Date
                                </label>
                                <DateTimeInput
                                    id="parking-date"
                                    mode="date"
                                    value={dateValue}
                                    invalid={isInvalid && !dateValue}
                                    onChange={(e) => {
                                        setDateValue(e.target.value);
                                        if (timeValidationMessage) setTimeValidationMessage(null);
                                    }}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label
                                    htmlFor="parking-start-time"
                                    className="block font-heading text-xs font-bold text-text-primary"
                                >
                                    Start time
                                </label>
                                <DateTimeInput
                                    id="parking-start-time"
                                    mode="time"
                                    value={startTime}
                                    invalid={isInvalid && !startTime}
                                    onChange={(e) => {
                                        setStartTime(e.target.value);
                                        if (timeValidationMessage) setTimeValidationMessage(null);
                                    }}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label
                                    htmlFor="parking-end-time"
                                    className="block font-heading text-xs font-bold text-text-primary"
                                >
                                    End time
                                </label>
                                <DateTimeInput
                                    id="parking-end-time"
                                    mode="time"
                                    value={endTime}
                                    invalid={isInvalid && (!endTime || endTime <= startTime)}
                                    onChange={(e) => {
                                        setEndTime(e.target.value);
                                        if (timeValidationMessage) setTimeValidationMessage(null);
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </Card>

                <div className="flex flex-wrap items-center gap-3">
                    <Button
                        type="submit"
                        variant="primary"
                        className="rounded-lg px-5 py-2.5 font-sans text-xs font-medium"
                    >
                        {isInvalid ? 'Update Time' : 'Review Reservation'}
                    </Button>
                    <Button
                        type="button"
                        variant="secondary"
                        className="rounded-lg px-5 py-2.5 font-sans text-xs font-medium"
                        onClick={() => {
                            setTimeValidationMessage(null);
                            setStep('choose_space');
                        }}
                    >
                        Back to Spaces
                    </Button>
                </div>
            </form>
        );
    }

    // Step 2: Choose a space
    if (step === 'choose_space' && selectedHub) {
        const availableCount = hubSpaces.filter(
            (s) => s.occupancy === 'empty'
        ).length;

        return (
            <div className="space-y-6 font-sans">
                <div className="space-y-1">
                    <h1 className="font-heading text-3xl font-bold text-text-primary">
                        Select Parking Space
                    </h1>
                    <p className="text-sm text-text-secondary">
                        Select an available space for your personal electric vehicle.
                    </p>
                </div>

                <div className="space-y-1">
                    <h2 className="font-heading text-xl font-bold text-text-primary">
                        {selectedHub.name}
                    </h2>
                    <p className="text-xs text-text-secondary">
                        {availableCount} of {hubSpaces.length} spaces available.
                    </p>
                </div>

                {availableCount === 0 && (
                    <div
                        role="alert"
                        className="rounded-xl border border-status-warning-text/30 bg-status-warning-bg p-4 text-xs text-status-warning-text"
                    >
                        This hub currently has no available parking spaces. Please select
                        another hub.
                    </div>
                )}

                <div className="grid gap-4 sm:grid-cols-3">
                    {hubSpaces.map((space) => {
                        const isAvailable = space.occupancy === 'empty';
                        const isSelected = isAvailable && selectedSpaceId === space.id;

                        return (
                            <button
                                key={space.id}
                                type="button"
                                disabled={!isAvailable}
                                onClick={() => setSelectedSpaceId(space.id)}
                                className={[
                                    'flex flex-col justify-between rounded-xl border p-5 text-left transition-colors',
                                    isSelected
                                        ? 'border-brand-primary bg-surface-selected/50'
                                        : isAvailable
                                            ? 'border-border-default bg-surface-page hover:border-brand-primary'
                                            : 'cursor-not-allowed border-border-default bg-surface-subtle opacity-70',
                                ].join(' ')}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="font-heading text-xl font-bold text-text-primary">
                                        {space.code}
                                    </span>
                                    {isAvailable && (
                                        <span
                                            className={[
                                                'flex h-4 w-4 items-center justify-center rounded-full border',
                                                isSelected
                                                    ? 'border-brand-primary'
                                                    : 'border-border-strong',
                                            ].join(' ')}
                                        >
                                            {isSelected && (
                                                <span className="h-2 w-2 rounded-full bg-brand-primary" />
                                            )}
                                        </span>
                                    )}
                                </div>

                                <div className="mt-3 space-y-1">
                                    <p
                                        className={[
                                            'font-heading text-xs font-bold',
                                            isAvailable
                                                ? 'text-brand-primary'
                                                : 'text-text-secondary',
                                        ].join(' ')}
                                    >
                                        {isAvailable ? 'Available' : 'Occupied'}
                                    </p>
                                    <p className="text-xs text-text-muted">
                                        {isSelected
                                            ? 'Selected'
                                            : isAvailable
                                                ? 'Select space'
                                                : 'Selection disabled'}
                                    </p>
                                </div>
                            </button>
                        );
                    })}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <Button
                        type="button"
                        variant="primary"
                        disabled={!selectedSpace}
                        className="rounded-lg px-5 py-2.5 font-sans text-xs font-medium"
                        onClick={() => setStep('choose_time')}
                    >
                        Select Time
                    </Button>
                    <Button
                        type="button"
                        variant="secondary"
                        className="rounded-lg px-5 py-2.5 font-sans text-xs font-medium"
                        onClick={() => setStep('find_hub')}
                    >
                        Back to Parking Hubs
                    </Button>
                </div>
            </div>
        );
    }

    // Step 1: Find a hub / Search results
    const isSearchResultView = submittedSearch.trim().length > 0;

    return (
        <div className="space-y-6 font-sans">
            <div className="space-y-1">
                <h1 className="font-heading text-3xl font-bold text-text-primary">
                    Reserve a Parking Space
                </h1>
                <p className="text-sm text-text-secondary">
                    {isSearchResultView
                        ? 'Review the hubs matching your area / hub search.'
                        : 'Search for a hub and view parking availability for your personal electric vehicle.'}
                </p>
            </div>

            <form onSubmit={handleHubSearch} className="space-y-2">
                <label
                    htmlFor="parking-hub-search"
                    className="block font-sans text-xs font-normal text-text-primary"
                >
                    Area / Hub
                </label>
                <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                        <span
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-text-muted"
                        >
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="h-4 w-4"
                            >
                                <circle cx="11" cy="11" r="7" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                        </span>

                        <input
                            id="parking-hub-search"
                            type="text"
                            placeholder="Search by area or hub name"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="h-11 w-full rounded-xl border border-border-default bg-surface-page pr-4 pl-11 font-sans text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
                        />
                    </div>

                    <Button
                        type="submit"
                        variant="primary"
                        className="h-11 rounded-xl px-6 font-sans text-sm font-medium"
                    >
                        Search
                    </Button>
                </div>
            </form>

            <section className="space-y-3.5">
                <div className="space-y-1">
                    <h2 className="font-heading text-xl font-bold text-text-primary">
                        {isSearchResultView ? 'Parking Search Results' : 'Parking Hubs'}
                    </h2>
                    {isSearchResultView && (
                        <p className="text-xs text-text-secondary">
                            {filteredHubs.length} hubs found for &ldquo;{submittedSearch}&rdquo;.
                        </p>
                    )}
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                    {filteredHubs.map((hub) => {
                        const spacesAtHub = parkingSpaces.filter((s) => s.hubId === hub.id);
                        const emptyAtHub = spacesAtHub.filter(
                            (s) => s.occupancy === 'empty'
                        ).length;

                        return (
                            <Card
                                key={hub.id}
                                className="flex flex-col justify-between space-y-6 rounded-xl p-6"
                            >
                                <div className="space-y-1">
                                    <h3 className="font-heading text-xl font-bold text-text-primary">
                                        {hub.name}
                                    </h3>
                                    <p className="text-xs text-text-secondary">
                                        Location: {hub.locationLabel}
                                    </p>
                                </div>

                                <div className="flex items-center justify-between gap-3">
                                    <p className="font-heading text-xs font-bold text-brand-primary">
                                        {emptyAtHub} of {spacesAtHub.length} parking spaces available
                                    </p>

                                    <Button
                                        type="button"
                                        variant="secondary"
                                        className="rounded-lg px-4 py-2 font-sans text-xs font-medium"
                                        onClick={() => handleSelectHub(hub.id)}
                                    >
                                        View Parking Spaces →
                                    </Button>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            </section>
        </div>
    );
}