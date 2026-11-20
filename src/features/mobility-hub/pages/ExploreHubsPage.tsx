import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { Button, Card, StatusBadge } from '../../../components/ui';
import type { StatusBadgeVariant } from '../../../components/ui';
import { ROUTES } from '../../../routes/paths';
import { useMobilityDataStore } from '../../../stores/useMobilityDataStore';
import type { VehicleStatus } from '../../../types/domain';

function getVehicleBadge(status: VehicleStatus): {
    label: string;
    variant: StatusBadgeVariant;
} {
    if (status === 'available') {
        return { label: 'Available', variant: 'success' };
    }
    return { label: 'Unavailable', variant: 'danger' };
}

export function ExploreHubsPage() {
    const navigate = useNavigate();
    const hubs = useMobilityDataStore((state) => state.hubs);
    const vehicles = useMobilityDataStore((state) => state.vehicles);

    const [inputQuery, setInputQuery] = useState('');
    const [submittedQuery, setSubmittedQuery] = useState('');

    const hubMap = useMemo(
        () => new Map(hubs.map((hub) => [hub.id, hub])),
        [hubs]
    );

    const hasSearched = submittedQuery.trim().length > 0;

    const filteredHubs = useMemo(() => {
        const q = submittedQuery.trim().toLowerCase();
        if (!q) return [];
        return hubs.filter(
            (hub) =>
                hub.name.toLowerCase().includes(q) ||
                hub.id.toLowerCase().includes(q) ||
                hub.locationLabel.toLowerCase().includes(q)
        );
    }, [hubs, submittedQuery]);

    const filteredVehicles = useMemo(() => {
        const q = submittedQuery.trim().toLowerCase();
        if (!q) return [];
        return vehicles.filter((vehicle) => {
            const hubName = vehicle.currentHubId
                ? (hubMap.get(vehicle.currentHubId)?.name.toLowerCase() ?? '')
                : '';
            return (
                vehicle.label.toLowerCase().includes(q) ||
                vehicle.id.toLowerCase().includes(q) ||
                hubName.includes(q)
            );
        });
    }, [vehicles, submittedQuery, hubMap]);

    const recentlyViewedVehicles = useMemo(
        () => vehicles.slice(0, 2),
        [vehicles]
    );

    const handleSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSubmittedQuery(inputQuery);
    };

    const noResults =
        hasSearched && filteredHubs.length === 0 && filteredVehicles.length === 0;

    return (
        <div className="space-y-8 font-sans">
            {/* Header */}
            <div className="space-y-1.5">
                <h1 className="font-heading text-3xl font-bold text-text-primary">
                    Search Mobility Hubs and Resources
                </h1>
                <p className="font-sans text-sm font-normal text-text-secondary">
                    {hasSearched
                        ? 'Search for mobility hubs and shared electric vehicles by name or ID.'
                        : 'Start a new search by entering a hub name or vehicle ID.'}
                </p>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex items-center gap-3">
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
                        type="text"
                        aria-label="Search by Hub or vehicle"
                        placeholder="Search by Hub or vehicle"
                        value={inputQuery}
                        onChange={(e) => setInputQuery(e.target.value)}
                        className="h-11 w-full rounded-xl border border-border-default bg-surface-page pr-4 pl-11 font-sans text-sm font-normal text-text-primary placeholder:text-text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
                    />
                </div>

                <Button
                    type="submit"
                    variant="primary"
                    className="h-11 rounded-xl px-6 font-heading text-sm font-semibold"
                >
                    Search
                </Button>
            </form>

            {/* Frame 1: UC01 - Initial Search */}
            {!hasSearched && (
                <section className="space-y-4">
                    <div className="space-y-1.5">
                        <h2 className="font-heading text-xl font-bold text-text-primary">
                            Recently Viewed
                        </h2>
                        <p className="flex items-center gap-1.5 font-sans text-xs font-normal text-text-secondary">
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="h-3.5 w-3.5 shrink-0 text-text-secondary"
                                aria-hidden="true"
                            >
                                <circle cx="12" cy="12" r="9" />
                                <line x1="12" y1="16" x2="12" y2="12" />
                                <line x1="12" y1="8" x2="12.01" y2="8" />
                            </svg>
                            <span>Illustrative sample content — not saved history</span>
                        </p>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                        {recentlyViewedVehicles.map((vehicle) => (
                            <div
                                key={vehicle.id}
                                role="button"
                                tabIndex={0}
                                onClick={() =>
                                    navigate(ROUTES.STUDENT.VEHICLE_DETAILS(vehicle.id))
                                }
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        navigate(ROUTES.STUDENT.VEHICLE_DETAILS(vehicle.id));
                                    }
                                }}
                                className="cursor-pointer rounded-xl border border-border-default bg-surface-page p-5 transition-colors hover:border-brand-primary"
                            >
                                <div className="flex h-44 items-center justify-center rounded-lg border border-border-default bg-surface-subtle font-sans text-xs font-normal text-text-muted">
                                    Vehicle Image
                                </div>

                                <h3 className="mt-4 font-heading text-xl font-bold text-text-primary">
                                    {vehicle.label}
                                </h3>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Frame: UC01 - No Results */}
            {noResults && (
                <Card className="flex flex-col items-center justify-center rounded-xl py-20 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-selected text-brand-primary">
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-6 w-6"
                            aria-hidden="true"
                        >
                            <circle cx="11" cy="11" r="7" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            <line x1="9" y1="9" x2="13" y2="13" />
                            <line x1="13" y1="9" x2="9" y2="13" />
                        </svg>
                    </div>
                    <h2 className="mt-4 font-heading text-lg font-bold text-text-primary">
                        No matching results found
                    </h2>
                    <p className="mt-1 font-sans text-sm font-normal text-text-secondary">
                        Try a different hub name or vehicle ID, then search again.
                    </p>
                </Card>
            )}

            {/* Frame 2: UC01 - Search Results */}
            {hasSearched && !noResults && (
                <div className="space-y-8">
                    {filteredHubs.length > 0 && (
                        <section className="space-y-3.5">
                            <h2 className="font-heading text-xl font-bold text-text-primary">
                                Mobility Hubs
                            </h2>
                            <div className="grid gap-5 sm:grid-cols-2">
                                {filteredHubs.map((hub) => (
                                    <Card
                                        key={hub.id}
                                        className="flex min-h-[84px] items-center rounded-xl px-6 py-5"
                                    >
                                        <h3 className="font-heading text-xl font-bold text-text-primary">
                                            {hub.name}
                                        </h3>
                                    </Card>
                                ))}
                            </div>
                        </section>
                    )}

                    {filteredVehicles.length > 0 && (
                        <section className="space-y-3.5">
                            <h2 className="font-heading text-xl font-bold text-text-primary">
                                Shared Electric Vehicles
                            </h2>
                            <div className="grid gap-5 sm:grid-cols-2">
                                {filteredVehicles.map((vehicle) => {
                                    const badge = getVehicleBadge(vehicle.status);

                                    return (
                                        <Card key={vehicle.id} className="rounded-xl p-5">
                                            <div className="flex h-44 items-center justify-center rounded-lg border border-border-default bg-surface-subtle font-sans text-xs font-normal text-text-muted">
                                                Vehicle Image
                                            </div>

                                            <h3 className="mt-4 font-heading text-xl font-bold text-text-primary">
                                                {vehicle.label}
                                            </h3>

                                            <div className="mt-3 flex items-end justify-between gap-3">
                                                <div className="space-y-1.5">
                                                    <p className="font-sans text-xs font-normal text-text-secondary">
                                                        Availability Status
                                                    </p>
                                                    <StatusBadge
                                                        variant={badge.variant}
                                                        className="min-w-[132px] justify-center font-heading text-xs font-bold"
                                                    >
                                                        {badge.label}
                                                    </StatusBadge>
                                                </div>

                                                <Button
                                                    variant="secondary"
                                                    onClick={() =>
                                                        navigate(ROUTES.STUDENT.VEHICLE_DETAILS(vehicle.id))
                                                    }
                                                    className="rounded-lg px-4 py-2 font-heading text-xs font-semibold"
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
            )}
        </div>
    );
}