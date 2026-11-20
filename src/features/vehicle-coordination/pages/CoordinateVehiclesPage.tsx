import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import {
  Banner,
  Button,
  Card,
  StatusBadge,
  Table,
} from '../../../components/ui';
import { createMockSeed } from '../../../data/mock/seed';
import type { MonitoringHubSnapshot, VehicleTransferProposal } from '../../../types/domain';
import { ROUTES } from '../../../routes/paths';

const SAMPLE_PROPOSAL_ID = 'TP-2026-001';
type Decision = 'approved' | 'rejected';

type HubAvailabilityRow = {
  hub: string;
  hubId: string;
  condition: 'Proposed source' | 'Vehicle shortage' | 'Disconnected' | 'Online';
  vehicles: string;
  parking: string;
  charging: string;
};

const decisionLabel = (decision: Decision) =>
  decision === 'approved' ? 'Approved' : 'Rejected';

function getSnapshot(
  snapshots: MonitoringHubSnapshot[],
  hubId: string,
): MonitoringHubSnapshot | undefined {
  return snapshots.find((snapshot) => snapshot.hubId === hubId);
}

function getOccupied(snapshot: MonitoringHubSnapshot): number {
  return snapshot.parking.occupied ?? snapshot.parking.total - snapshot.parking.available;
}

function getHubRows(database: ReturnType<typeof createMockSeed>): HubAvailabilityRow[] {
  return database.hubs.map((hub) => {
    const snapshot = getSnapshot(database.monitoring.currentSnapshots, hub.id);

    if (!snapshot || hub.connectionStatus === 'disconnected') {
      return {
        hub: hub.name,
        hubId: hub.id,
        condition: 'Disconnected',
        vehicles: 'Current: unknown',
        parking: 'Current: unknown',
        charging: 'Current: unknown',
      };
    }

    const condition: HubAvailabilityRow['condition'] =
      hub.id === 'HUB-A'
        ? 'Proposed source'
        : snapshot.risks.includes('Vehicle shortage')
          ? 'Vehicle shortage'
          : 'Online';

    return {
      hub: hub.name,
      hubId: hub.id,
      condition,
      vehicles: `${snapshot.vehicle.available} available · ${snapshot.vehicle.inUse ?? 0} in use · ${snapshot.vehicle.unavailable} unavailable / ${snapshot.vehicle.total}`,
      parking: `${getOccupied(snapshot)}/${snapshot.parking.total} occupied · ${snapshot.parking.available} spaces free`,
      charging: `${snapshot.charging.available} available · ${snapshot.charging.occupied ?? 0} occupied · ${snapshot.charging.unavailable} unavailable / ${snapshot.charging.total}`,
    };
  });
}

function getConditionVariant(condition: HubAvailabilityRow['condition']) {
  if (condition === 'Proposed source') return 'info' as const;
  if (condition === 'Vehicle shortage') return 'warning' as const;
  if (condition === 'Disconnected') return 'danger' as const;
  return 'success' as const;
}

function PageHeading({ title, description, eyebrow = 'UC09 / Coordination overview' }: { title: string; description: string; eyebrow?: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-text-muted">{eyebrow}</p>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="mt-1 text-2xl font-semibold text-text-primary">{title}</h1>
          <p className="mt-1 text-sm text-text-secondary">{description}</p>
        </div>
        <span className="pt-1 text-xs font-medium text-brand-primary">
          System Operator · Management
        </span>
      </div>
    </div>
  );
}

function AlternativeScreen({
  kind,
  onBack,
}: {
  kind: 'no-longer-suitable' | 'conditions-not-met';
  onBack: () => void;
}) {
  const database = useMemo(() => createMockSeed(), []);
  const source = getSnapshot(database.monitoring.currentSnapshots, 'HUB-A');
  const destination = getSnapshot(database.monitoring.currentSnapshots, 'HUB-B');

  if (!source || !destination) return null;

  if (kind === 'no-longer-suitable') {
    const rows = [
      {
        condition: 'Hub B free parking spaces',
        proposalReview: `${destination.parking.available} spaces free`,
        laterSnapshot: '1 space free · 19/20 occupied',
      },
      {
        condition: 'Capacity for 2 vehicles',
        proposalReview: 'Sufficient in base sample',
        laterSnapshot: 'Cannot accept 2 vehicles',
      },
    ];

    return (
      <div className="space-y-5">
        <PageHeading
          title="Proposal No Longer Suitable"
          eyebrow="UC09 / Alternative A1 / Later snapshot"
          description="A later change invalidates the original proposal. This alternative is separate from the base reference snapshot."
        />
        <Banner
          variant="danger"
          title={`${SAMPLE_PROPOSAL_ID} cannot be approved`}
          description="Destination capacity changed after the proposal was prepared. The old plan is no longer suitable and has not been approved."
        />
        <Card className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">
              Campus Mobility Hub A → Campus Mobility Hub B
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusBadge variant="danger">Invalid · Not approved</StatusBadge>
              <span className="text-xs text-text-secondary">
                Proposed quantity: 2 vehicles · Source availability remains 3
              </span>
            </div>
          </div>
          <Table
            columns={[
              { key: 'condition', header: 'Condition' },
              { key: 'proposalReview', header: 'At proposal review' },
              { key: 'laterSnapshot', header: 'Later alternative snapshot' },
            ]}
            data={rows}
            getRowKey={(row) => row.condition}
          />
        </Card>
        <Card className="bg-surface-subtle">
          <p className="text-sm font-semibold text-text-primary">
            No updated proposal available in this example
          </p>
          <p className="mt-1 text-sm text-text-secondary">
            Return to the overview to review other proposals if available. No movement or resource-state update is initiated by this failed review.
          </p>
        </Card>
        <Button onClick={onBack}>Return to Overview</Button>
      </div>
    );
  }

  const rows = [
    {
      condition: 'Source Hub A availability',
      snapshot: '1 available · 7 in use · 2 unavailable / 10',
      result: 'Insufficient for quantity 2',
    },
    {
      condition: 'Destination Hub B capacity',
      snapshot: `${destination.parking.available} spaces free · ${getOccupied(destination)}/${destination.parking.total} occupied`,
      result: 'Can accept quantity 2',
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeading
        title="Transfer Conditions Not Met"
        eyebrow="UC09 / Alternative A2 / Later snapshot"
        description="The condition check fails in this separate alternative snapshot. The base proposal is not approved."
      />
      <Banner
        variant="danger"
        title="Insufficient source vehicles"
        description={`${SAMPLE_PROPOSAL_ID} requests 2 vehicles, but only 1 source vehicle is available in this later example.`}
      />
      <Card className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">
            Campus Mobility Hub A → Campus Mobility Hub B
          </h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge variant="danger">Review blocked</StatusBadge>
            <span className="text-xs text-text-secondary">
              Proposed quantity: 2 vehicles
            </span>
          </div>
        </div>
        <Table
          columns={[
            { key: 'condition', header: 'Checked condition' },
            { key: 'snapshot', header: 'Later alternative snapshot' },
            { key: 'result', header: 'Result' },
          ]}
          data={rows}
          getRowKey={(row) => row.condition}
        />
        <p className="text-xs text-text-muted">
          Hub A base availability was 3. This example shows a later availability change, not an edit to UC07 or the base snapshot.
        </p>
      </Card>
      <Card className="bg-surface-subtle">
        <p className="text-sm font-semibold text-text-primary">
          Last valid resource state preserved
        </p>
        <p className="mt-1 text-sm text-text-secondary">
          Failed review does not change the shown resource state. Choose another proposal if one is available, or cancel the review.
        </p>
      </Card>
      <div className="flex flex-wrap gap-2">
        <Button onClick={onBack}>Choose Another Proposal</Button>
        <Button variant="secondary" onClick={onBack}>Cancel Review</Button>
      </div>
    </div>
  );
}

export function CoordinateVehiclesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const database = useMemo(() => createMockSeed(), []);

  const scenario = searchParams.get('scenario');
  const decisionParam = searchParams.get('decision');
  const decision: Decision | null =
    decisionParam === 'approved' || decisionParam === 'rejected'
      ? decisionParam
      : null;

  if (scenario === 'no-longer-suitable' || scenario === 'conditions-not-met') {
    return (
      <AlternativeScreen
        kind={scenario}
        onBack={() => navigate(ROUTES.OPERATOR.COORDINATION)}
      />
    );
  }

  const proposal: VehicleTransferProposal | undefined =
    database.vehicleTransferProposals.find((item) => item.id === SAMPLE_PROPOSAL_ID)
      ?? database.vehicleTransferProposals.find((item) => item.status === 'proposed');

  const hubRows = getHubRows(database);
  const proposalColumns = [
    {
      key: 'plan' as const,
      header: 'Plan / route',
      render: () => (
        <div className="space-y-1">
          <p className="font-medium text-text-primary">
            {proposal?.id} · Hub A → Hub B
          </p>
          <p className="text-xs text-text-muted">Campus Mobility Hub A → Campus Mobility Hub B</p>
        </div>
      ),
    },
    { key: 'quantity' as const, header: 'Quantity' },
    {
      key: 'status' as const,
      header: 'Plan status',
      render: () => (
        <StatusBadge
          variant={decision === 'approved' ? 'success' : decision === 'rejected' ? 'danger' : 'warning'}
        >
          {decision ? decisionLabel(decision) : 'Proposed'}
        </StatusBadge>
      ),
    },
    {
      key: 'review' as const,
      header: 'Review',
      render: () => proposal && (
        <Button
          variant="secondary"
          className="whitespace-nowrap text-xs"
          onClick={() => navigate(
            `${ROUTES.OPERATOR.COORDINATION_PROPOSAL(proposal.id)}${decision ? `?decision=${decision}` : ''}`,
          )}
        >
          {decision ? 'View Decision' : 'Review Proposal'}
        </Button>
      ),
    },
  ];

  const proposalRows = proposal
    ? [{ plan: proposal.id, quantity: `${proposal.vehicleCount} vehicles`, status: decision ?? proposal.status, review: 'Review' }]
    : [];

  const hubName = (hubId: string) => database.hubs.find((hub) => hub.id === hubId)?.name ?? hubId;
  const hubA = getSnapshot(database.monitoring.currentSnapshots, 'HUB-A');
  const hubB = getSnapshot(database.monitoring.currentSnapshots, 'HUB-B');

  return (
    <div className="space-y-5">
      <PageHeading
        title="Coordinate Vehicles Between Hubs"
        description="Review transfer proposals and record a decision. Physical vehicle movement is outside this system."
      />

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {hubB?.risks.includes('Vehicle shortage') && (
          <Banner
            variant="warning"
            title="Vehicle shortage"
            description={`${hubName('HUB-B')} · ${hubB.vehicle.available} vehicles available.`}
          />
        )}
        {hubA?.risks.includes('Parking-capacity risk') && (
          <Banner
            variant="warning"
            title="Proposed source · Parking-capacity risk"
            description={`${hubName('HUB-A')} · ${hubA.vehicle.available} vehicles available · ${getOccupied(hubA)}/${hubA.parking.total} spaces occupied.`}
          />
        )}
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-text-primary">Hub Availability</h2>
        <Card className="overflow-hidden p-0">
          <Table
            columns={[
              {
                key: 'hub' as const,
                header: 'Hub / condition',
                render: (row: HubAvailabilityRow) => (
                  <div className="space-y-1">
                    <p className="font-medium text-text-primary">{row.hub}</p>
                    <p className="text-xs text-text-muted">{row.hubId}</p>
                    <StatusBadge variant={getConditionVariant(row.condition)}>
                      {row.condition}
                    </StatusBadge>
                  </div>
                ),
              },
              { key: 'vehicles' as const, header: 'Vehicles' },
              { key: 'parking' as const, header: 'Parking' },
              { key: 'charging' as const, header: 'Charging' },
            ]}
            data={hubRows}
            getRowKey={(row) => row.hubId}
          />
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-text-primary">Proposed Coordination Plan</h2>
        <Card className="overflow-hidden p-0">
          <Table
            columns={proposalColumns}
            data={proposalRows}
            getRowKey={(row) => row.plan}
            emptyMessage="No proposed coordination plans are available."
          />
        </Card>
      </section>

      <p className="text-xs text-text-muted">
        Base sample snapshot · No surplus threshold is assumed. Hub C is disconnected; last-known data is not used as a current source.
      </p>
      <div className="space-y-2">
        <p className="text-xs text-text-muted">
          Separate static alternatives · Review examples only, not connected controls.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={() => navigate(`${ROUTES.OPERATOR.COORDINATION}?scenario=no-longer-suitable`)}
          >
            Example: No Longer Suitable
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate(`${ROUTES.OPERATOR.COORDINATION}?scenario=conditions-not-met`)}
          >
            Example: Conditions Not Met
          </Button>
        </div>
      </div>
    </div>
  );
}
