import { useNavigate, useParams } from 'react-router';
import { Button, Card, StatusBadge } from '../../../components/ui';
import type { StatusBadgeVariant } from '../../../components/ui';
import { ROUTES } from '../../../routes/paths';
import {
    MIN_SAFE_BATTERY_PERCENT,
    useMobilityDataStore,
} from '../../../stores/useMobilityDataStore';
import type { VehicleStatus } from '../../../types/domain';

function getDetailStatusBadge(status: VehicleStatus): {
    label: string;
    variant: StatusBadgeVariant;
} {
    if (status === 'available') {
        return { label: 'Available', variant: 'success' };
    }
    return { label: 'Unavailable', variant: 'danger' };
}

export function VehicleDetailsPage() {
    const { vehicleId = '' } = useParams();
    const navigate = useNavigate();

    const vehicle = useMobilityDataStore((state) =>
        state.vehicles.find((v) => v.id === vehicleId)
    );

    if (!vehicle) {
        return (
            <div className="space-y-5 font-sans">
                <div className="space-y-1.5">
                    <h1 className="font-heading text-3xl font-bold text-text-primary">
                        Shared Electric Vehicle Details
                    </h1>
                    <p className="font-sans text-sm font-normal text-text-secondary">
                        View availability and battery information for the selected vehicle.
                    </p>
                </div>

                <Button
                    variant="secondary"
                    onClick={() => navigate(ROUTES.STUDENT.HUBS)}
                    className="rounded-lg font-heading text-sm font-semibold"
                >
                    Back to Search Results
                </Button>

                <Card className="rounded-xl p-6">
                    <p className="font-sans text-sm font-normal text-text-secondary">
                        Vehicle <strong className="font-heading font-bold">{vehicleId}</strong> was not found.
                    </p>
                </Card>
            </div>
        );
    }

    const badge = getDetailStatusBadge(vehicle.status);
    const canReserve =
        vehicle.status === 'available' &&
        vehicle.batteryPercent >= MIN_SAFE_BATTERY_PERCENT &&
        Boolean(vehicle.currentHubId);

    return (
        <div className="space-y-6 font-sans">
            {/* Header */}
            <div className="space-y-1.5">
                <h1 className="font-heading text-3xl font-bold text-text-primary">
                    Shared Electric Vehicle Details
                </h1>
                <p className="font-sans text-sm font-normal text-text-secondary">
                    View availability and battery information for the selected vehicle.
                </p>
            </div>

            {/* Action Buttons xếp dọc 2 hàng đúng Figma */}
            <div className="flex flex-col items-start gap-3">
                <Button
                    variant="secondary"
                    onClick={() => navigate(ROUTES.STUDENT.HUBS)}
                    className="rounded-lg px-4 py-2 font-heading text-xs font-semibold"
                >
                    Back to Search Results
                </Button>

                <Button
                    variant="primary"
                    disabled={!canReserve}
                    onClick={() => navigate(ROUTES.STUDENT.VEHICLE_RESERVE(vehicle.id))}
                    className="rounded-lg px-5 py-2 font-heading text-xs font-semibold"
                >
                    Reserve
                </Button>
            </div>

            {/* Vehicle Details Card */}
            <Card className="rounded-xl p-6 sm:p-7">
                <div className="grid items-center gap-8 md:grid-cols-[1.05fr_1fr]">
                    {/* Left: Vehicle Image Box */}
                    <div className="flex h-72 items-center justify-center rounded-lg border border-border-default bg-surface-subtle font-sans text-xs font-normal text-text-muted">
                        Vehicle Image
                    </div>

                    {/* Right: Specs */}
                    <div className="space-y-5">
                        <div className="space-y-1.5 border-b border-border-default pb-5">
                            <p className="font-sans text-xs font-normal text-text-secondary">
                                Vehicle ID
                            </p>
                            <h2 className="font-heading text-2xl font-bold text-text-primary">
                                {vehicle.label}
                            </h2>
                        </div>

                        <div className="space-y-2">
                            <p className="font-sans text-xs font-normal text-text-secondary">
                                Availability Status
                            </p>
                            <StatusBadge
                                variant={badge.variant}
                                className="min-w-[140px] justify-center font-heading text-xs font-bold"
                            >
                                {badge.label}
                            </StatusBadge>
                        </div>

                        <div className="space-y-2.5 pt-1">
                            <div className="flex items-baseline justify-between">
                                <p className="font-sans text-xs font-normal text-text-secondary">
                                    Battery Level
                                </p>
                                <span className="font-heading text-2xl font-bold text-text-primary">
                                    {vehicle.batteryPercent}%
                                </span>
                            </div>

                            <div
                                role="progressbar"
                                aria-valuenow={vehicle.batteryPercent}
                                aria-valuemin={0}
                                aria-valuemax={100}
                                className="h-2 w-full overflow-hidden rounded-full bg-surface-muted"
                            >
                                <div
                                    className={[
                                        'h-full rounded-full transition-all',
                                        vehicle.batteryPercent >= MIN_SAFE_BATTERY_PERCENT
                                            ? 'bg-brand-primary'
                                            : 'bg-status-danger-text',
                                    ].join(' ')}
                                    style={{ width: `${vehicle.batteryPercent}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}