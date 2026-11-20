
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Banner,
  Button,
  Card,
  StatusBadge,
  Table,
} from '../../../components/ui';
import { createMockSeed } from '../../../data/mock/seed';
import type { MonitoringHubSnapshot } from '../../../types/domain';

interface HubRow {
  id: string;
  name: string;
  connectionStatus: 'online' | 'disconnected';
  vehicles: string;
  parking: string;
  charging: string;
  riskLabels: MonitoringHubSnapshot['risks'];
}

export function MonitorNetworkPage() {
  const navigate = useNavigate();
  const [showAtRiskOnly, setShowAtRiskOnly] = useState(false);

  const database = useMemo(() => createMockSeed(), []);

  const hubRows: HubRow[] = database.hubs.map((hub) => {
    const snapshot = database.monitoring.currentSnapshots.find(
      (item) => item.hubId === hub.id,
    );

    if (!snapshot) {
      const lastKnown = database.monitoring.lastKnownSnapshots.find(
        (item) => item.hubId === hub.id,
      );

      return {
        id: hub.id,
        name: hub.name,
        connectionStatus: hub.connectionStatus,
        vehicles: 'Current: Unknown',
        parking: lastKnown
          ? `Current: Unknown · Last known: ${lastKnown.parking.occupied}/${lastKnown.parking.total} occupied`
          : 'Current: Unknown',
        charging: lastKnown
          ? `Current: Unknown · Last known: ${lastKnown.charging.available}/${lastKnown.charging.total} available`
          : 'Current: Unknown',
        riskLabels: [],
      };
    }

    return {
      id: hub.id,
      name: hub.name,
      connectionStatus: hub.connectionStatus,
      vehicles: `${snapshot.vehicle.available} available · ${snapshot.vehicle.inUse ?? 0} in use · ${snapshot.vehicle.unavailable} unavailable`,
      parking: `${snapshot.parking.occupied ?? 0}/${snapshot.parking.total} occupied · ${snapshot.parking.available} available · ${snapshot.parking.unavailable} unavailable`,
      charging: `${snapshot.charging.available}/${snapshot.charging.total} available · ${snapshot.charging.occupied ?? 0} occupied · ${snapshot.charging.unavailable} unavailable`,
      riskLabels: snapshot.risks,
    };
  });

  const visibleHubs = showAtRiskOnly
    ? hubRows.filter((hub) => hub.riskLabels.length > 0)
    : hubRows;

  const alerts = database.monitoring.currentSnapshots.flatMap((snapshot) => {
    const hub = database.hubs.find(
      (item) => item.id === snapshot.hubId,
    );

    if (!hub) return [];

    return snapshot.risks.map((risk) => ({
      hubId: hub.id,
      hubName: hub.name,
      risk,
      message:
        risk === 'Vehicle shortage'
          ? `${snapshot.vehicle.available} vehicles available`
          : `${snapshot.parking.occupied ?? 0} of ${snapshot.parking.total} spaces occupied`,
    }));
  });

  const columns = [
    {
      key: 'name' as const,
      header: 'Hub / Connection',
      render: (hub: HubRow) => (
        <div className="space-y-1">
          <p className="font-medium text-text-primary">
            {hub.name}
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-text-muted">
              {hub.id}
            </span>

            <StatusBadge
              variant={
                hub.connectionStatus === 'online'
                  ? 'success'
                  : 'danger'
              }
            >
              {hub.connectionStatus === 'online'
                ? 'Online'
                : 'Disconnected'}
            </StatusBadge>

            {hub.riskLabels.map((risk) => (
              <StatusBadge key={risk} variant="warning">
                {risk}
              </StatusBadge>
            ))}
          </div>
        </div>
      ),
    },
    {
      key: 'vehicles' as const,
      header: 'Vehicles',
    },
    {
      key: 'parking' as const,
      header: 'Parking spaces',
    },
    {
      key: 'charging' as const,
      header: 'Charging ports',
    },
    {
      key: 'id' as const,
      header: 'View',
      render: (hub: HubRow) => (
        <Button
          variant="secondary"
          onClick={() => navigate(`/operator/monitoring/${hub.id}`)}
          className="whitespace-nowrap text-xs"
        >
          {hub.connectionStatus === 'disconnected'
            ? 'View Disconnection'
            : 'View Details'}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-medium text-text-muted">
          UC07 / Monitoring / Network Overview
        </p>

        <h1 className="mt-1 text-3xl font-semibold text-text-primary">
          Monitor Network
        </h1>

        <p className="mt-2 text-sm text-text-secondary">
          View network-wide resource status and identify resource
          shortage or overload risks across Mobility Hubs.
        </p>
      </div>

      {/* Resource alert banners */}
      {alerts.length > 0 && (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {alerts.map((alert) => (
            <Banner
              key={`${alert.hubId}-${alert.risk}`}
              variant="warning"
              title={alert.risk}
              description={`${alert.hubName} – ${alert.message}`}
            />
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">
            {showAtRiskOnly ? 'At-Risk Hubs' : 'Network Hub List'}
          </h2>

          {showAtRiskOnly && (
            <p className="mt-1 text-sm text-text-secondary">
              Only hubs with illustrative vehicle-shortage or
              parking-capacity risk are shown.
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant={showAtRiskOnly ? 'primary' : 'secondary'}
            onClick={() =>
              setShowAtRiskOnly((current) => !current)
            }
            className="text-xs"
          >
            Overload/Resource Shortage Alerts
          </Button>

          {showAtRiskOnly && (
            <Button
              variant="secondary"
              onClick={() => setShowAtRiskOnly(false)}
              className="text-xs"
            >
              Clear Filter
            </Button>
          )}
        </div>
      </div>

      <Card className="overflow-hidden p-0">
        <Table
          columns={columns}
          data={visibleHubs}
          getRowKey={(hub) => hub.id}
          emptyMessage="No hubs match the selected alert filter."
        />
      </Card>

      <p className="text-xs text-text-muted">
        {database.hubs.length} hubs ·{' '}
        {alerts.length > 0
          ? `${new Set(alerts.map((alert) => alert.hubId)).size} with sample resource alerts`
          : '0 with sample resource alerts'}{' '}
        ·{' '}
        {
          database.hubs.filter(
            (hub) => hub.connectionStatus === 'disconnected',
          ).length
        }{' '}
        disconnected. HUB-C last-known values are not current.
      </p>
    </div>
  );
}
