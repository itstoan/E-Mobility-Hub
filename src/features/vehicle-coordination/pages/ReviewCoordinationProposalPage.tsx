import { useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import {
  Banner,
  Button,
  Card,
  StatusBadge,
  Table,
} from '../../../components/ui';
import { createMockSeed } from '../../../data/mock/seed';
import type {
  MonitoringHubSnapshot,
  VehicleTransferProposal,
} from '../../../types/domain';
import { ROUTES } from '../../../routes/paths';

type Decision = 'approved' | 'rejected';

interface ConditionRow {
  condition: string;
  result: string;
}

interface ImpactRow {
  hub: string;
  reference: string;
  outcome: string;
}

function snapshotFor(database: ReturnType<typeof createMockSeed>, hubId: string) {
  return database.monitoring.currentSnapshots.find((item) => item.hubId === hubId);
}

function occupied(snapshot: MonitoringHubSnapshot) {
  return snapshot.parking.occupied ?? snapshot.parking.total - snapshot.parking.available;
}

function evaluateProposal(
  database: ReturnType<typeof createMockSeed>,
  proposal: VehicleTransferProposal,
) {
  const sourceHub = database.hubs.find((hub) => hub.id === proposal.sourceHubId);
  const destinationHub = database.hubs.find((hub) => hub.id === proposal.destinationHubId);
  const source = snapshotFor(database, proposal.sourceHubId);
  const destination = snapshotFor(database, proposal.destinationHubId);

  const sourceVehicleRecords = database.vehicles.filter(
    (vehicle) => vehicle.currentHubId === proposal.sourceHubId && vehicle.status === 'available',
  );
  const sourceEnough = Boolean(
    source
      && source.vehicle.available >= proposal.vehicleCount
      && sourceVehicleRecords.length >= proposal.vehicleCount,
  );
  const destinationEnough = Boolean(destination && destination.parking.available >= proposal.vehicleCount);
  const hubsConnected = Boolean(
    sourceHub && destinationHub
      && sourceHub.connectionStatus === 'online'
      && destinationHub.connectionStatus === 'online',
  );

  return {
    sourceHub,
    destinationHub,
    source,
    destination,
    sourceEnough,
    destinationEnough,
    hubsConnected,
    valid: sourceEnough && destinationEnough && hubsConnected,
  };
}

function Heading({ title, description, eyebrow = 'UC09 / Review proposal / Base snapshot' }: { title: string; description: string; eyebrow?: string }) {
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

function DecisionResult({
  decision,
  proposal,
  onReturn,
}: {
  decision: Decision;
  proposal: VehicleTransferProposal;
  onReturn: () => void;
}) {
  const database = useMemo(() => createMockSeed(), []);
  const source = snapshotFor(database, proposal.sourceHubId);
  const destination = snapshotFor(database, proposal.destinationHubId);
  if (!source || !destination) return null;

  const approved = decision === 'approved';
  const sourceName = database.hubs.find((hub) => hub.id === proposal.sourceHubId)?.name ?? proposal.sourceHubId;
  const destinationName = database.hubs.find((hub) => hub.id === proposal.destinationHubId)?.name ?? proposal.destinationHubId;
  const rows = [
    {
      hub: sourceName,
      available: `${source.vehicle.available} available`,
      parking: `${occupied(source)}/${source.parking.total}`,
    },
    {
      hub: destinationName,
      available: `${destination.vehicle.available} available`,
      parking: `${occupied(destination)}/${destination.parking.total}`,
    },
  ];

  return (
    <div className="space-y-5">
      <Heading
        eyebrow={approved ? 'UC09 / Decision recorded / Approved branch' : 'UC09 / Alternative A3 / Rejected branch'}
        title={approved ? 'Proposal Approved' : 'Proposal Rejected'}
        description={approved
          ? 'Illustrative saved decision · The operator approved the base coordination proposal.'
          : 'Illustrative saved decision · The operator rejected the base coordination proposal.'}
      />
      {approved ? (
        <Banner
          variant="success"
          title="Approval recorded in the example plan record"
          description={`${proposal.id} · Decision: Approved · Recorded by System Operator. This is a static saved-result example.`}
        />
      ) : (
        <Card className="bg-surface-subtle">
          <p className="text-sm font-semibold text-text-primary">
            Rejection recorded in the example plan record
          </p>
          <p className="mt-1 text-xs text-text-secondary">
            {proposal.id} · Decision: Rejected · Recorded by System Operator. This is a static saved-result example.
          </p>
        </Card>
      )}
      <Card className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-text-primary">
            {proposal.id} · {proposal.vehicleCount} vehicles
          </h2>
          <StatusBadge variant={approved ? 'success' : 'danger'}>
            {approved ? 'Approved' : 'Rejected'}
          </StatusBadge>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs text-text-muted">Source Hub</p>
            <p className="mt-1 font-semibold text-text-primary">{sourceName}</p>
            <p className="text-xs text-text-secondary">
              {source.vehicle.available} vehicles available · {occupied(source)}/{source.parking.total} parking occupied
            </p>
          </div>
          <div>
            <p className="text-xs text-text-muted">Destination Hub</p>
            <p className="mt-1 font-semibold text-text-primary">{destinationName}</p>
            <p className="text-xs text-text-secondary">
              {destination.vehicle.available} vehicles available · {destination.parking.available} parking spaces free
            </p>
          </div>
        </div>
      </Card>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-text-primary">
          {approved ? 'Resource State Remains Unchanged' : 'Original Reference Availability Preserved'}
        </h2>
        <Card className="overflow-hidden p-0">
          <Table
            columns={[
              { key: 'hub', header: 'Hub' },
              { key: 'available', header: 'Available vehicles' },
              { key: 'parking', header: 'Parking occupied' },
            ]}
            data={rows}
            getRowKey={(row) => row.hub}
          />
        </Card>
      </section>

      <Card className="bg-surface-subtle">
        <p className="text-sm font-semibold text-text-primary">
          {approved ? 'Physical movement is outside the system' : 'No movement initiated'}
        </p>
        <p className="mt-1 text-sm text-text-secondary">
          {approved
            ? 'The operating organization carries out any physical transfer outside this software. Approval does not mean vehicles have transferred, arrived, or completed movement; it does not adjust resource counts.'
            : 'Rejection updates only the example plan decision. It does not initiate physical movement or change vehicle, parking, or charging resources.'}
        </p>
      </Card>
      <Button onClick={onReturn}>Return to Overview</Button>
    </div>
  );
}

export function ReviewCoordinationProposalPage() {
  const navigate = useNavigate();
  const { planId } = useParams();
  const [searchParams] = useSearchParams();
  const database = useMemo(() => createMockSeed(), []);

  const proposal = database.vehicleTransferProposals.find((item) => item.id === planId);
  const decisionParam = searchParams.get('decision');
  const decision: Decision | null =
    decisionParam === 'approved' || decisionParam === 'rejected'
      ? decisionParam
      : null;

  const backToOverview = () => {
    navigate(`${ROUTES.OPERATOR.COORDINATION}${decision ? `?decision=${decision}` : ''}`);
  };

  if (!proposal) {
    return (
      <div className="space-y-4">
        <Banner
          variant="danger"
          title="Coordination proposal not found"
          description="The requested proposal is not available in the current mock dataset."
        />
        <Button onClick={() => navigate(ROUTES.OPERATOR.COORDINATION)}>
          Back to Overview
        </Button>
      </div>
    );
  }

  if (decision) {
    return (
      <DecisionResult
        decision={decision}
        proposal={proposal}
        onReturn={backToOverview}
      />
    );
  }

  if (proposal.status !== 'proposed') {
    return (
      <div className="space-y-4">
        <Banner
          variant="warning"
          title="Proposal already reviewed"
          description={`${proposal.id} is already recorded as ${proposal.status}. A reviewed proposal cannot be approved or rejected again.`}
        />
        <Button onClick={backToOverview}>Back to Overview</Button>
      </div>
    );
  }

  const check = evaluateProposal(database, proposal);
  const source = check.source;
  const destination = check.destination;

  if (!check.sourceHub || !check.destinationHub || !source || !destination) {
    return (
      <div className="space-y-4">
        <Heading
          title="Review Coordination Proposal"
          description="Review the checked allocation context before approving or rejecting."
        />
        <Banner
          variant="danger"
          title="Transfer conditions not met"
          description="A current Hub snapshot is unavailable. The proposal cannot be approved using last-known data."
        />
        <Button onClick={backToOverview}>Back to Overview</Button>
      </div>
    );
  }

  const sourceName = check.sourceHub.name;
  const destinationName = check.destinationHub.name;
  const candidates = database.vehicles
    .filter((vehicle) =>
      vehicle.currentHubId === proposal.sourceHubId
      && vehicle.status === 'available'
      && vehicle.id.startsWith('EV-A-'),
    )
    .sort((a, b) => b.batteryPercent - a.batteryPercent)
    .slice(0, proposal.vehicleCount);

  const conditionRows: ConditionRow[] = [
    {
      condition: 'Source vehicles / destination capacity',
      result: `${source.vehicle.available} available for quantity ${proposal.vehicleCount} · ${destination.parking.available} free spaces for quantity ${proposal.vehicleCount}`,
    },
    {
      condition: 'Hub status / expected demand',
      result: `${sourceName} and ${destinationName} connected in base sample; vehicle shortage identified at destination. Disconnected Hub C is excluded.`,
    },
    {
      condition: 'Battery level / charging capability',
      result: `Illustrative candidate details: ${candidates.map((vehicle) => `${vehicle.label.replace('Campus ', '')} ${vehicle.batteryPercent}%`).join(', ') || 'Candidate vehicle details unavailable'}; both available at source. A: ${source.charging.available} ports available; B: ${destination.charging.available} ports available. Battery and charging context reviewed; no battery cutoff or charging allocation is assumed.`,
    },
  ];

  const impactRows: ImpactRow[] = [
    {
      hub: sourceName,
      reference: `${source.vehicle.available} available · Parking ${occupied(source)}/${source.parking.total}`,
      outcome: `${Math.max(0, source.vehicle.available - proposal.vehicleCount)} available · Parking ${Math.max(0, occupied(source) - proposal.vehicleCount)}/${source.parking.total}`,
    },
    {
      hub: destinationName,
      reference: `${destination.vehicle.available} available · Parking ${occupied(destination)}/${destination.parking.total}`,
      outcome: `${destination.vehicle.available + proposal.vehicleCount} available · Parking ${Math.min(destination.parking.total, occupied(destination) + proposal.vehicleCount)}/${destination.parking.total}`,
    },
  ];

  const makeDecision = (nextDecision: Decision) => {
    // Re-check live mock snapshots immediately before recording the decision.
    const latestCheck = evaluateProposal(database, proposal);
    if (!latestCheck.valid) return;
    navigate(`${ROUTES.OPERATOR.COORDINATION_PROPOSAL(proposal.id)}?decision=${nextDecision}`);
  };

  return (
    <div className="space-y-5">
      <Heading
        title="Review Coordination Proposal"
        description="Review the checked allocation context and illustrative impact before approving or rejecting."
      />

      <Card className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">
              {proposal.id} · {proposal.vehicleCount} vehicles
            </h2>
          </div>
          <StatusBadge variant="warning">Proposed</StatusBadge>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs text-text-muted">Source Hub</p>
            <p className="mt-1 text-lg font-semibold text-text-primary">{sourceName}</p>
            <p className="text-xs text-text-secondary">
              {source.vehicle.available} vehicles available · {occupied(source)}/{source.parking.total} parking occupied
            </p>
          </div>
          <div>
            <p className="text-xs text-text-muted">Destination Hub</p>
            <p className="mt-1 text-lg font-semibold text-text-primary">{destinationName}</p>
            <p className="text-xs text-text-secondary">
              {destination.vehicle.available} vehicles available · {destination.parking.available} parking spaces free
            </p>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-border-default bg-surface-subtle px-4 py-3 text-xs font-medium text-text-secondary">
          System-checked conditions · Static sample
        </div>
        <Table
          columns={[
            { key: 'condition', header: 'Condition' },
            { key: 'result', header: 'Review result' },
          ]}
          data={conditionRows}
          getRowKey={(row) => row.condition}
        />
      </Card>

      <Card className="space-y-3">
        <h2 className="text-lg font-semibold text-text-primary">
          Expected Impact — Only If Carried Out
        </h2>
        <Table
          columns={[
            { key: 'hub', header: 'Hub' },
            { key: 'reference', header: 'Unchanged reference' },
            { key: 'outcome', header: 'Illustrative plan outcome' },
          ]}
          data={impactRows}
          getRowKey={(row) => row.hub}
        />
        <p className="text-xs text-text-muted">
          Not an arrival or execution report. Approval records a plan decision only; actual displayed resource counts remain unchanged.
        </p>
      </Card>

      {!check.valid && (
        <Banner
          variant="danger"
          title="Transfer conditions not met"
          description="Current source availability, destination capacity, or Hub connectivity no longer satisfies this proposal. Review another proposal instead."
        />
      )}

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => makeDecision('approved')} disabled={!check.valid}>
          Approve Proposal
        </Button>
        <Button
          variant="secondary"
          onClick={() => makeDecision('rejected')}
          disabled={!check.valid}
        >
          Reject Proposal
        </Button>
        <Button variant="secondary" onClick={backToOverview}>
          Back to Overview
        </Button>
      </div>
    </div>
  );
}
