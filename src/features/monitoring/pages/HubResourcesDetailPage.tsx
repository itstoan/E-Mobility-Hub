
import { Navigate, useNavigate, useParams } from 'react-router';
import {
  Banner,
  Button,
  Card,
  StatusBadge,
  Table,
} from '../../../components/ui';
import { createMockSeed } from '../../../data/mock/seed';
import type {
  ChargingPort,
  MonitoringHubSnapshot,
} from '../../../types/domain';

interface ChargingPortRow {
  id: string;
  code: string;
  status: 'Available' | 'Occupied' | 'Unavailable';
}

interface CurrentStateRow {
  resource: string;
  status: string;
  details: string;
}

interface LastKnownRow {
  resource: string;
  summary: string;
}

function getChargingPortStatus(
  port: ChargingPort,
): ChargingPortRow['status'] {
  switch (port.physicalState) {
    case 'idle':
      return 'Available';
    case 'charging':
      return 'Occupied';
    case 'out_of_service':
      return 'Unavailable';
  }
}

function ResourceSnapshot({
  snapshot,
}: {
  snapshot: MonitoringHubSnapshot;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
      <Card className="space-y-3">
        <h2 className="font-semibold text-text-primary">
          Vehicles
        </h2>

        <p className="text-2xl font-semibold text-text-primary">
          {snapshot.vehicle.available} available
        </p>

        <div className="space-y-1 text-sm text-text-secondary">
          <p>{snapshot.vehicle.inUse ?? 0} in use</p>
          <p>{snapshot.vehicle.unavailable} unavailable</p>
        </div>

        <p className="text-xs text-text-muted">
          {snapshot.vehicle.total} total vehicles
        </p>
      </Card>

      <Card className="space-y-3">
        <h2 className="font-semibold text-text-primary">
          Parking
        </h2>

        <p className="text-2xl font-semibold text-text-primary">
          {snapshot.parking.occupied ?? 0} / {snapshot.parking.total}{' '}
          occupied
        </p>

        <div className="space-y-1 text-sm text-text-secondary">
          <p>{snapshot.parking.available} available</p>
          <p>{snapshot.parking.unavailable} unavailable</p>
        </div>

        <p className="text-xs text-text-muted">
          Parking utilization is shown as occupied / total.
        </p>
      </Card>

      <Card className="space-y-3">
        <h2 className="font-semibold text-text-primary">
          Charging
        </h2>

        <p className="text-2xl font-semibold text-text-primary">
          {snapshot.charging.available} / {snapshot.charging.total}{' '}
          available
        </p>

        <div className="space-y-1 text-sm text-text-secondary">
          <p>{snapshot.charging.occupied ?? 0} occupied</p>
          <p>{snapshot.charging.unavailable} unavailable</p>
        </div>

        <p className="text-xs text-text-muted">
          Port status only; no allocation changes.
        </p>
      </Card>
    </div>
  );
}

const chargingPortColumns = [
  {
    key: 'code' as const,
    header: 'Port',
  },
  {
    key: 'status' as const,
    header: 'Resource status',
    render: (port: ChargingPortRow) => (
      <StatusBadge
        variant={
          port.status === 'Available'
            ? 'success'
            : port.status === 'Unavailable'
              ? 'danger'
              : 'warning'
        }
      >
        {port.status}
      </StatusBadge>
    ),
  },
  {
    key: 'id' as const,
    header: 'Monitoring context',
    render: (port: ChargingPortRow) => (
      <span>
        {port.status === 'Unavailable'
          ? 'Excluded from available charging resources'
          : 'No committed allocation in the pre-scheduling state'}
      </span>
    ),
  },
];

const currentStateColumns = [
  { key: 'resource' as const, header: 'Resource' },
  { key: 'status' as const, header: 'Status' },
  { key: 'details' as const, header: 'Current risk' },
];

const lastKnownColumns = [
  { key: 'resource' as const, header: 'Resource' },
  { key: 'summary' as const, header: 'Last known sample values' },
];

export function HubResourcesDetailPage() {
  const { hubId = '' } = useParams();
  const navigate = useNavigate();

  const database = createMockSeed();

  const hub = database.hubs.find((item) => item.id === hubId);

  if (!hub) {
    return <Navigate to="/operator/monitoring" replace />;
  }

  const currentSnapshot = database.monitoring.currentSnapshots.find(
    (snapshot) => snapshot.hubId === hubId,
  );

  const lastKnownSnapshot = database.monitoring.lastKnownSnapshots.find(
    (snapshot) => snapshot.hubId === hubId,
  );

  const isDisconnected = hub.connectionStatus === 'disconnected';

  const chargingPorts: ChargingPortRow[] = database.chargingPorts
    .filter((port) => port.hubId === hubId)
    .map((port) => ({
      id: port.id,
      code: port.code,
      status: getChargingPortStatus(port),
    }));

  const currentStateRows: CurrentStateRow[] = [
    {
      resource: 'Vehicles',
      status: 'Unknown',
      details: 'Cannot assess from stale data',
    },
    {
      resource: 'Parking',
      status: 'Unknown',
      details: 'Cannot assess from stale data',
    },
    {
      resource: 'Charging',
      status: 'Unknown',
      details: 'Cannot assess from stale data',
    },
  ];

  const lastKnownRows: LastKnownRow[] = lastKnownSnapshot
    ? [
        {
          resource: 'Vehicles',
          summary: `${lastKnownSnapshot.vehicle.available} available · ${lastKnownSnapshot.vehicle.inUse ?? 0} in use · ${lastKnownSnapshot.vehicle.unavailable} unavailable / ${lastKnownSnapshot.vehicle.total} total`,
        },
        {
          resource: 'Parking',
          summary: `${lastKnownSnapshot.parking.occupied ?? 0}/${lastKnownSnapshot.parking.total} occupied · ${lastKnownSnapshot.parking.available} available · ${lastKnownSnapshot.parking.unavailable} unavailable`,
        },
        {
          resource: 'Charging',
          summary: `${lastKnownSnapshot.charging.available} available · ${lastKnownSnapshot.charging.occupied ?? 0} occupied · ${lastKnownSnapshot.charging.unavailable} unavailable / ${lastKnownSnapshot.charging.total} total`,
        },
      ]
    : [];

  if (isDisconnected) {
    return (
      <div className="space-y-5">
        <div>
          <p className="text-sm font-medium text-text-muted">
            UC07 / Monitoring / Hub Disconnected
          </p>

          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold text-text-primary">
              Hub Disconnected
            </h1>

            <StatusBadge variant="danger">
              Disconnected
            </StatusBadge>
          </div>

          <p className="mt-2 text-sm text-text-secondary">
            {hub.name} · Illustrative disconnected state, not
            actual outage detection.
          </p>
        </div>

        <Banner
          variant="danger"
          title="No updated status received"
          description={
            <>
              Current vehicles, parking and charging states are
              unknown. Record an incident through the established
              incident process; incident recording is outside this
              monitoring screen.
            </>
          }
        />

        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">
              Current resource state
            </h2>
          </div>

          <Card className="p-0">
            <Table
              columns={currentStateColumns}
              data={currentStateRows}
              getRowKey={(row) => row.resource}
            />
          </Card>
        </section>

        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">
              Last known sample resources — not current
            </h2>

            <p className="text-sm text-text-muted">
              Previously received sample values for reference.
              These values must not be read as current availability.
            </p>
          </div>

          {lastKnownSnapshot ? (
            <Card className="p-0">
              <Table
                columns={lastKnownColumns}
                data={lastKnownRows}
                getRowKey={(row) => row.resource}
              />
            </Card>
          ) : (
            <Card>
              <p className="text-sm text-text-muted">
                No last-known sample data available.
              </p>
            </Card>
          )}
        </section>

        <Button
          variant="primary"
          onClick={() => navigate('/operator/monitoring')}
        >
          Return to Network Overview
        </Button>
      </div>
    );
  }

  if (!currentSnapshot) {
    return <Navigate to="/operator/monitoring" replace />;
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-medium text-text-muted">
          UC07 / Monitoring / Hub Resource Details
        </p>

        <h1 className="mt-1 text-3xl font-semibold text-text-primary">
          Hub Resource Details
        </h1>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-sm text-text-secondary">
            {hub.name}
          </span>
          <StatusBadge variant="success">Online</StatusBadge>
        </div>

        <p className="mt-2 text-sm text-text-secondary">
          Read-only resource status for the selected Hub. No
          allocation or reservation controls.
        </p>
      </div>

      <Button
        variant="secondary"
        onClick={() => navigate('/operator/monitoring')}
      >
        Back to Network Overview
      </Button>

      <h2 className="text-lg font-semibold text-text-primary">
        {hub.name}
      </h2>

      <ResourceSnapshot snapshot={currentSnapshot} />

      {currentSnapshot.risks.includes('Parking-capacity risk') && (
        <Banner
          variant="warning"
          title="Parking-capacity risk"
          description={
            <>
              {currentSnapshot.parking.occupied ?? 0} of{' '}
              {currentSnapshot.parking.total} spaces occupied at{' '}
              {hub.name}.
              <p className="mt-1 text-xs text-text-secondary">
                This sample condition requires operator awareness,
                not automatic intervention.
              </p>
            </>
          }
        />
      )}

      {chargingPorts.length > 0 && (
        <Card className="space-y-3">
          <div>
            <h2 className="font-semibold text-text-primary">
              Charging resource detail
            </h2>

            <p className="mt-1 text-sm text-text-secondary">
              Port status only. No committed allocation in the
              pre-scheduling state.
            </p>
          </div>

          <Table
            columns={chargingPortColumns}
            data={chargingPorts}
            getRowKey={(port) => port.id}
          />
        </Card>
      )}
    </div>
  );
}
