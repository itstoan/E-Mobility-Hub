import { useMemo, useState } from 'react';
import type { ChangeEvent, ReactNode } from 'react';
import {
  Banner,
  Button,
  Card,
  DateTimeInput,
  Dialog,
  FormField,
  Select,
  StatusBadge,
  Table,
} from '../../../components/ui';
import { createMockSeed } from '../../../data/mock/seed';
import type {
  ChargingPort,
  ChargingRequest,
  ChargingSchedule,
  ChargingScheduleProposal,
  ISODateTime,
  MockDatabase,
} from '../../../types/domain';

type ChargingView =
  | 'overview'
  | 'requests'
  | 'proposal'
  | 'adjust'
  | 'confirmed'
  | 'insufficient'
  | 'portUnavailable'
  | 'demandChanged'
  | 'priorityReview';

type ProposalScenario = 'base' | 'adjusted' | 'insufficient' | 'portUnavailable' | 'demandChanged';
type PriorityReason = 'Low battery' | 'Near-term usage need';

interface ResourceSummary {
  available: number;
  occupied: number;
  unavailable: number;
  total: number;
}

interface ProposalRow {
  requestId: string;
  hubName: string;
  desiredWindow: string;
  proposedWindow: string;
  status: string;
  statusVariant: 'success' | 'warning' | 'neutral';
}

interface RequestSessionRow {
  id: string;
  type: string;
  hubName: string;
  window: string;
  status: string;
  port: string;
  kind: 'request' | 'sessions';
}

const UC08_REQUEST_PREFIX = 'CR-2026-';
const UC08_HUB_IDS = ['HUB-A', 'HUB-B'];

function getUc08Requests(database: MockDatabase): ChargingRequest[] {
  return database.chargingRequests
    .filter((request) => request.id.startsWith(UC08_REQUEST_PREFIX))
    .sort((a, b) => a.id.localeCompare(b.id));
}

function getHubName(database: MockDatabase, hubId: string): string {
  return database.hubs.find((hub) => hub.id === hubId)?.name ?? hubId;
}

function getPort(database: MockDatabase, portId: string): ChargingPort | undefined {
  return database.chargingPorts.find((port) => port.id === portId);
}

function getPortName(database: MockDatabase, portId: string): string {
  return getPort(database, portId)?.code ?? portId;
}

function getCurrentProposal(
  database: MockDatabase,
  requestId: string,
): ChargingScheduleProposal | undefined {
  return database.chargingScheduleProposals.find(
    (proposal) => proposal.requestId === requestId && proposal.status === 'proposed',
  );
}

function getAllocatedSchedule(
  database: MockDatabase,
  requestId: string,
): ChargingSchedule | undefined {
  return database.chargingSchedules.find(
    (schedule) => schedule.requestId === requestId && schedule.status === 'allocated',
  );
}

function getResourceSummary(database: MockDatabase, hubId: string): ResourceSummary {
  const ports = database.chargingPorts.filter((port) => port.hubId === hubId);
  return {
    available: ports.filter((port) => port.physicalState === 'idle').length,
    occupied: ports.filter((port) => port.physicalState === 'charging').length,
    unavailable: ports.filter((port) => port.physicalState === 'out_of_service').length,
    total: ports.length,
  };
}

function formatDate(value: ISODateTime): string {
  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function toDateInputValue(value: ISODateTime): string {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toTimeInputValue(value: ISODateTime): string {
  const date = new Date(value);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function toIsoDateTime(date: string, time: string): ISODateTime {
  return new Date(`${date}T${time}:00`).toISOString();
}

function formatTime(value: ISODateTime): string {
  return new Date(value).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatWindow(startAt: ISODateTime, endAt: ISODateTime): string {
  return `${formatTime(startAt)}–${formatTime(endAt)}`;
}

function overlaps(
  startA: ISODateTime,
  endA: ISODateTime,
  startB: ISODateTime,
  endB: ISODateTime,
): boolean {
  return new Date(startA).getTime() < new Date(endB).getTime()
    && new Date(endA).getTime() > new Date(startB).getTime();
}

function getPriorityReason(request: ChargingRequest): PriorityReason | null {
  if (request.batteryPercent !== undefined && request.batteryPercent <= 20) {
    return 'Low battery';
  }

  if (request.neededByAt) {
    const neededBy = new Date(request.neededByAt).getTime();
    const requestedStart = new Date(request.requestedStartAt).getTime();
    if (neededBy <= requestedStart + 60 * 60 * 1000) {
      return 'Near-term usage need';
    }
  }

  return null;
}

function PageHeading({
  breadcrumb,
  title,
  description,
  badge,
}: {
  breadcrumb: string;
  title: string;
  description: string;
  badge?: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <p className="text-xs font-medium text-text-muted">{breadcrumb}</p>
        <span className="text-xs font-medium text-brand-primary">
          System Operator · Management
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold text-text-primary">{title}</h1>
        {badge}
      </div>
      <p className="text-sm text-text-secondary">{description}</p>
    </div>
  );
}

function DemoDataNote() {
  return (
    <p className="text-xs leading-5 text-text-muted">
      Illustrative mock data from the shared project seed. Updates in this page are local to this screen; no live charging service is connected.
    </p>
  );
}

function RequestStatus({ status }: { status: ChargingRequest['status'] }) {
  const label = status === 'pending_scheduling'
    ? 'Pending Scheduling'
    : status === 'needs_rescheduling'
      ? 'Needs Rescheduling'
      : status === 'scheduled'
        ? 'Scheduled'
        : status === 'charging'
          ? 'Charging'
          : status;
  const variant = status === 'scheduled' || status === 'charging' ? 'success' : 'warning';
  return <StatusBadge variant={variant}>{label}</StatusBadge>;
}

function ProposalStatus({ row }: { row: ProposalRow }) {
  return <StatusBadge variant={row.statusVariant}>{row.status}</StatusBadge>;
}

export function ManageChargingPage() {
  const [database, setDatabase] = useState<MockDatabase>(() => createMockSeed());
  const [view, setView] = useState<ChargingView>('overview');
  const [scenario, setScenario] = useState<ProposalScenario>('base');
  const [selectedRequestId, setSelectedRequestId] = useState('CR-2026-001');
  const [portDialogHubId, setPortDialogHubId] = useState<string | null>(null);

  const [draftPortId, setDraftPortId] = useState('CP-A02');
  const [draftDate, setDraftDate] = useState('');
  const [draftStart, setDraftStart] = useState('11:00');
  const [draftEnd, setDraftEnd] = useState('13:00');
  const [adjustmentError, setAdjustmentError] = useState('');

  const requests = useMemo(() => getUc08Requests(database), [database]);
  const pendingRequests = requests.filter(
    (request) => request.status === 'pending_scheduling' || request.status === 'needs_rescheduling',
  );
  const selectedRequest = requests.find((request) => request.id === selectedRequestId);
  const activeSessions = database.chargingSchedules.filter(
    (schedule) => schedule.status === 'charging',
  );
  const activeSessionPorts = activeSessions.map((session) => getPortName(database, session.portId));
  const portDialog = portDialogHubId
    ? database.chargingPorts.filter((port) => port.hubId === portDialogHubId)
    : [];

  const hubSummaries = UC08_HUB_IDS.map((hubId) => ({
    id: hubId,
    name: getHubName(database, hubId),
    summary: getResourceSummary(database, hubId),
  }));

  function buildProposalRows(source: MockDatabase, includeScheduled = false): ProposalRow[] {
    return getUc08Requests(source)
      .filter((request) => includeScheduled
        || request.status === 'pending_scheduling'
        || request.status === 'needs_rescheduling')
      .map((request) => {
        const proposal = getCurrentProposal(source, request.id);
        const allocation = getAllocatedSchedule(source, request.id);
        const portAndWindow = proposal
          ? `${getPortName(source, proposal.portId)} · ${formatWindow(proposal.startAt, proposal.endAt)}`
          : allocation
            ? `${getPortName(source, allocation.portId)} · ${formatWindow(allocation.startAt, allocation.endAt)}`
            : 'No proposal · Unallocated';

        if (allocation) {
          return {
            requestId: request.id,
            hubName: getHubName(source, request.hubId),
            desiredWindow: formatWindow(request.requestedStartAt, request.requestedEndAt),
            proposedWindow: portAndWindow,
            status: 'Scheduled - allocated',
            statusVariant: 'success' as const,
          };
        }

        if (proposal) {
          return {
            requestId: request.id,
            hubName: getHubName(source, request.hubId),
            desiredWindow: formatWindow(request.requestedStartAt, request.requestedEndAt),
            proposedWindow: portAndWindow,
            status: 'Proposed - not allocated',
            statusVariant: 'warning' as const,
          };
        }

        return {
          requestId: request.id,
          hubName: getHubName(source, request.hubId),
          desiredWindow: formatWindow(request.requestedStartAt, request.requestedEndAt),
          proposedWindow: portAndWindow,
          status: 'Pending Scheduling',
          statusVariant: 'neutral' as const,
        };
      });
  }

  function getRequestRows(): RequestSessionRow[] {
    const requestRows = pendingRequests.map((request) => ({
      id: request.id,
      type: `${request.personalVehicleLabel} · Request`,
      hubName: getHubName(database, request.hubId),
      window: `${formatDate(request.requestedStartAt)} · ${formatWindow(request.requestedStartAt, request.requestedEndAt)}`,
      status: request.status === 'pending_scheduling' ? 'Pending Scheduling' : 'Needs Rescheduling',
      port: getAllocatedSchedule(database, request.id)
        ? getPortName(database, getAllocatedSchedule(database, request.id)!.portId)
        : 'Unallocated',
      kind: 'request' as const,
    }));

    if (activeSessions.length === 0) return requestRows;
    const firstSession = activeSessions[0];
    const sessionEndAt = activeSessions.reduce(
      (latest, session) => new Date(session.endAt).getTime() > new Date(latest).getTime()
        ? session.endAt
        : latest,
      firstSession.endAt,
    );
    const sessionStartAt = activeSessions.reduce(
      (earliest, session) => new Date(session.startAt).getTime() < new Date(earliest).getTime()
        ? session.startAt
        : earliest,
      firstSession.startAt,
    );

    return [
      ...requestRows,
      {
        id: activeSessions.map((session) => session.id).join(' / '),
        type: `${activeSessions.length} existing sessions`,
        hubName: getHubName(database, database.chargingRequests.find((request) => request.id === firstSession.requestId)?.hubId ?? 'HUB-B'),
        window: `${formatDate(sessionStartAt)} · ${formatWindow(sessionStartAt, sessionEndAt)}`,
        status: 'Active sessions',
        port: activeSessionPorts.join(' / '),
        kind: 'sessions' as const,
      },
    ];
  }

  function openAdjustment(requestId = 'CR-2026-001') {
    const request = requests.find((item) => item.id === requestId);
    if (!request) return;

    const proposal = getCurrentProposal(database, requestId);
    const alternativePort = database.chargingPorts.find((port) => (
      port.hubId === request.hubId
      && port.physicalState === 'idle'
      && port.id !== proposal?.portId
    ));

    setSelectedRequestId(requestId);
    setDraftPortId(alternativePort?.id ?? proposal?.portId ?? '');
    setDraftDate(toDateInputValue(proposal?.startAt ?? request.requestedStartAt));
    setDraftStart(proposal ? '11:00' : toTimeInputValue(request.requestedStartAt));
    setDraftEnd(proposal ? '13:00' : toTimeInputValue(request.requestedEndAt));
    setAdjustmentError('');
    setView('adjust');
  }

  function saveAdjustment() {
    const request = requests.find((item) => item.id === selectedRequestId);
    const port = getPort(database, draftPortId);
    if (!request || !port) {
      setAdjustmentError('Select a charging port before saving the adjustment.');
      return;
    }
    if (!draftDate || !draftStart || !draftEnd) {
      setAdjustmentError('Complete the proposed date, start time and end time.');
      return;
    }

    const startAt = toIsoDateTime(draftDate, draftStart);
    const endAt = toIsoDateTime(draftDate, draftEnd);
    if (new Date(endAt).getTime() <= new Date(startAt).getTime()) {
      setAdjustmentError('The end time must be later than the start time.');
      return;
    }
    if (port.hubId !== request.hubId) {
      setAdjustmentError('Choose a charging port at the same Hub as the request.');
      return;
    }
    if (port.physicalState !== 'idle') {
      setAdjustmentError(`${port.code} is not physically available and cannot be proposed.`);
      return;
    }

    const proposalConflict = database.chargingScheduleProposals.some((proposal) => (
      proposal.status === 'proposed'
      && proposal.requestId !== request.id
      && proposal.portId === port.id
      && overlaps(startAt, endAt, proposal.startAt, proposal.endAt)
    ));
    const scheduleConflict = database.chargingSchedules.some((schedule) => (
      schedule.requestId !== request.id
      && schedule.portId === port.id
      && (schedule.status === 'allocated' || schedule.status === 'charging')
      && overlaps(startAt, endAt, schedule.startAt, schedule.endAt)
    ));

    if (proposalConflict || scheduleConflict) {
      setAdjustmentError('This port already has a proposed allocation or charging session during the selected window. Choose another time or port.');
      return;
    }

    setDatabase((current) => {
      const existing = current.chargingScheduleProposals.find(
        (proposal) => proposal.requestId === request.id && proposal.status === 'proposed',
      );
      const nextProposal: ChargingScheduleProposal = {
        id: existing?.id ?? `CSP-${request.id}`,
        requestId: request.id,
        portId: port.id,
        startAt,
        endAt,
        status: 'proposed',
      };

      return {
        ...current,
        chargingScheduleProposals: existing
          ? current.chargingScheduleProposals.map((proposal) => (
              proposal.id === existing.id ? nextProposal : proposal
            ))
          : [...current.chargingScheduleProposals, nextProposal],
      };
    });

    setScenario('adjusted');
    setAdjustmentError('');
    setView('proposal');
  }

  function resetToBaseProposal() {
    setDatabase(createMockSeed());
    setSelectedRequestId('CR-2026-001');
    setScenario('base');
    setView('proposal');
  }

  function applyInsufficientPortsExample() {
    const base = createMockSeed();
    const request001 = base.chargingRequests.find((request) => request.id === 'CR-2026-001');
    if (!request001) return;

    const extraRequest: ChargingRequest = {
      id: 'CR-2026-004',
      userId: 'ST-02',
      hubId: 'HUB-A',
      personalVehicleLabel: 'Personal electric vehicle',
      requestedStartAt: request001.requestedStartAt,
      requestedEndAt: request001.requestedEndAt,
      batteryPercent: 36,
      neededByAt: request001.neededByAt,
      status: 'pending_scheduling',
    };
    const extraProposal: ChargingScheduleProposal = {
      id: 'CSP-2026-004',
      requestId: extraRequest.id,
      portId: 'CP-A01',
      startAt: toIsoDateTime(toDateInputValue(request001.requestedStartAt), '11:00'),
      endAt: toIsoDateTime(toDateInputValue(request001.requestedStartAt), '13:00'),
      status: 'proposed',
    };

    setDatabase({
      ...base,
      chargingRequests: [...base.chargingRequests, extraRequest],
      chargingScheduleProposals: [...base.chargingScheduleProposals, extraProposal],
    });
    setSelectedRequestId('CR-2026-001');
    setScenario('insufficient');
    setView('insufficient');
  }

  function applyPortUnavailableExample() {
    const base = createMockSeed();
    const proposal = base.chargingScheduleProposals.find(
      (item) => item.requestId === 'CR-2026-001' && item.status === 'proposed',
    );
    if (!proposal) return;

    const changedProposal: ChargingScheduleProposal = {
      ...proposal,
      portId: 'CP-A02',
      startAt: toIsoDateTime(toDateInputValue(proposal.startAt), '11:00'),
      endAt: toIsoDateTime(toDateInputValue(proposal.startAt), '13:00'),
    };

    setDatabase({
      ...base,
      chargingPorts: base.chargingPorts.map((port) => (
        port.id === 'CP-A01' ? { ...port, physicalState: 'out_of_service' } : port
      )),
      chargingScheduleProposals: base.chargingScheduleProposals.map((item) => (
        item.id === proposal.id ? changedProposal : item
      )),
    });
    setSelectedRequestId('CR-2026-001');
    setScenario('portUnavailable');
    setView('portUnavailable');
  }

  function applyDemandChangedExample() {
    const base = createMockSeed();
    const proposal = base.chargingScheduleProposals.find(
      (item) => item.requestId === 'CR-2026-001' && item.status === 'proposed',
    );
    if (!proposal) return;

    const updatedProposal: ChargingScheduleProposal = {
      ...proposal,
      startAt: toIsoDateTime(toDateInputValue(proposal.startAt), '10:00'),
      endAt: toIsoDateTime(toDateInputValue(proposal.startAt), '12:00'),
    };

    setDatabase({
      ...base,
      chargingScheduleProposals: base.chargingScheduleProposals.map((item) => (
        item.id === proposal.id ? updatedProposal : item
      )),
    });
    setSelectedRequestId('CR-2026-001');
    setScenario('demandChanged');
    setView('demandChanged');
  }

  function confirmSchedule() {
    const proposals = database.chargingScheduleProposals.filter((proposal) => (
      proposal.status === 'proposed'
      && requests.some((request) => request.id === proposal.requestId)
      && !getAllocatedSchedule(database, proposal.requestId)
    ));

    const invalidProposal = proposals.find((proposal) => {
      const port = getPort(database, proposal.portId);
      if (!port || port.physicalState !== 'idle') return true;

      return database.chargingSchedules.some((schedule) => (
        schedule.portId === proposal.portId
        && (schedule.status === 'allocated' || schedule.status === 'charging')
        && overlaps(proposal.startAt, proposal.endAt, schedule.startAt, schedule.endAt)
      ));
    });
    const proposalsOverlap = proposals.some((proposal, index) =>
      proposals.slice(index + 1).some((other) => (
        proposal.portId === other.portId
        && overlaps(proposal.startAt, proposal.endAt, other.startAt, other.endAt)
      )),
    );

    if (invalidProposal || proposalsOverlap) {
      setAdjustmentError('One or more proposals conflict with the current port state or another scheduled slot. Review or adjust the proposal before confirmation.');
      setView('proposal');
      return;
    }

    setDatabase((current) => {
      const currentProposals = current.chargingScheduleProposals.filter((proposal) => (
        proposal.status === 'proposed'
        && proposal.requestId.startsWith(UC08_REQUEST_PREFIX)
        && !current.chargingSchedules.some((schedule) => (
          schedule.requestId === proposal.requestId && schedule.status === 'allocated'
        ))
      ));
      const scheduleRecords: ChargingSchedule[] = currentProposals.map((proposal) => ({
        id: `CS-${proposal.requestId}`,
        requestId: proposal.requestId,
        portId: proposal.portId,
        startAt: proposal.startAt,
        endAt: proposal.endAt,
        status: 'allocated',
      }));
      const allocatedRequestIds = new Set(currentProposals.map((proposal) => proposal.requestId));

      return {
        ...current,
        chargingRequests: current.chargingRequests.map((request) => (
          allocatedRequestIds.has(request.id)
            ? { ...request, status: 'scheduled' as const }
            : request
        )),
        chargingSchedules: [...current.chargingSchedules, ...scheduleRecords],
      };
    });
    setAdjustmentError('');
    setView('confirmed');
  }

  const proposalRows = buildProposalRows(database);
  const confirmedRows = buildProposalRows(database, true).filter(
    (row) => row.status === 'Scheduled - allocated',
  );
  const requestSessionRows = getRequestRows();
  const priorityRows = pendingRequests
    .map((request) => ({ request, reason: getPriorityReason(request) }))
    .filter((item): item is { request: ChargingRequest; reason: PriorityReason } => item.reason !== null);

  const selectedProposal = selectedRequest
    ? getCurrentProposal(database, selectedRequest.id)
    : undefined;
  const selectedDraftPort = getPort(database, draftPortId);

  if (view === 'requests') {
    return (
      <div className="space-y-5">
        <PageHeading
          breadcrumb="UC08 — Manage and Schedule Charging / Review requests"
          title="Charging Requests and Sessions"
          description="Select a request for proposal review. Request status and active session status are shown separately."
        />

        <Card className="overflow-hidden p-0">
          <Table
            columns={[
              {
                key: 'id',
                header: 'ID / type',
                render: (row: RequestSessionRow) => (
                  <div className="space-y-1">
                    <p className="font-medium text-text-primary">{row.id}</p>
                    <p className="text-xs text-text-muted">{row.type}</p>
                  </div>
                ),
              },
              { key: 'hubName', header: 'Hub' },
              { key: 'window', header: 'Desired / session window' },
              {
                key: 'status',
                header: 'Status',
                render: (row: RequestSessionRow) => (
                  <StatusBadge variant={row.kind === 'sessions' ? 'success' : 'warning'}>
                    {row.status}
                  </StatusBadge>
                ),
              },
              {
                key: 'port',
                header: 'Port / selection',
                render: (row: RequestSessionRow) => row.kind === 'request' ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span>{row.port}</span>
                    <Button
                      variant="secondary"
                      className="px-2 py-1 text-xs"
                      onClick={() => setSelectedRequestId(row.id)}
                    >
                      {selectedRequestId === row.id ? 'Selected' : 'Select'}
                    </Button>
                  </div>
                ) : row.port,
              },
            ]}
            data={requestSessionRows}
            getRowKey={(row) => row.id}
            emptyMessage="There are no charging requests awaiting scheduling."
          />
        </Card>

        {selectedRequest && (
          <Card className="space-y-3">
            <div>
              <h2 className="font-semibold text-text-primary">
                Selected request · {selectedRequest.id}
              </h2>
              <p className="mt-1 text-sm text-text-secondary">
                {getHubName(database, selectedRequest.hubId)} · {selectedRequest.personalVehicleLabel}
              </p>
            </div>
            <p className="text-sm text-text-secondary">
              Desired date: {formatDate(selectedRequest.requestedStartAt)} · Desired window: {formatWindow(selectedRequest.requestedStartAt, selectedRequest.requestedEndAt)}
            </p>
            <div className="rounded-md border border-border-default bg-surface-subtle p-3">
              <div className="flex flex-wrap items-center gap-2">
                <RequestStatus status={selectedRequest.status} />
                <span className="text-sm text-text-secondary">
                  {getAllocatedSchedule(database, selectedRequest.id)
                    ? 'A schedule has been allocated.'
                    : 'Unallocated. No charging schedule is confirmed.'}
                </span>
              </div>
              <p className="mt-1 text-xs text-text-muted">
                Selecting a request does not start a charging session.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setView('proposal')}>Review Proposed Schedule</Button>
              <Button variant="secondary" onClick={() => setView('overview')}>Back to Charging Management</Button>
            </div>
          </Card>
        )}
        <DemoDataNote />
      </div>
    );
  }

  if (view === 'adjust') {
    const request = requests.find((item) => item.id === selectedRequestId);
    const requestHubPorts = request
      ? database.chargingPorts.filter((port) => port.hubId === request.hubId)
      : [];

    return (
      <div className="space-y-5">
        <PageHeading
          breadcrumb="UC08 — Manage and Schedule Charging / Operator adjustment"
          title="Adjust Charging Schedule"
          description="Change the proposal for the selected request; saving does not confirm the schedule."
        />

        {request && (
          <Card className="space-y-3">
            <div>
              <h2 className="font-semibold text-text-primary">
                {request.id} · {getHubName(database, request.hubId)}
              </h2>
              <div className="mt-2">
                <StatusBadge variant="warning">Proposed — not confirmed</StatusBadge>
              </div>
              <p className="mt-2 text-sm text-text-secondary">
                {request.personalVehicleLabel} · Desired date: {formatDate(request.requestedStartAt)} · Desired window: {formatWindow(request.requestedStartAt, request.requestedEndAt)}
              </p>
            </div>

            <div className="overflow-hidden rounded-md border border-border-default">
              <Table
                columns={[
                  { key: 'version', header: 'Proposal version' },
                  { key: 'port', header: 'Port' },
                  { key: 'window', header: 'Illustrative allocation window' },
                ]}
                data={[
                  {
                    version: 'Original proposal',
                    port: selectedProposal
                      ? getPortName(database, selectedProposal.portId)
                      : 'No proposal',
                    window: selectedProposal
                      ? formatWindow(selectedProposal.startAt, selectedProposal.endAt)
                      : 'Unallocated',
                  },
                  {
                    version: 'Chosen adjustment',
                    port: selectedDraftPort?.code ?? 'Select a port',
                    window: `${draftStart}–${draftEnd}`,
                  },
                ]}
                getRowKey={(row) => row.version}
              />
            </div>
          </Card>
        )}

        <Card className="space-y-4">
          <h2 className="font-semibold text-text-primary">Select an alternative proposal</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            <FormField id="uc08-proposed-port" label="Proposed port" required>
              <Select
                id="uc08-proposed-port"
                value={draftPortId}
                onChange={(event: ChangeEvent<HTMLSelectElement>) => setDraftPortId(event.target.value)}
                options={requestHubPorts.map((port) => ({
                  value: port.id,
                  label: `${port.code} · ${port.physicalState === 'idle' ? 'Available' : port.physicalState === 'charging' ? 'Occupied' : 'Unavailable'}`,
                  disabled: port.physicalState !== 'idle',
                }))}
                placeholder="Select a charging port"
              />
            </FormField>
            <FormField id="uc08-proposed-date" label="Proposed date" required>
              <DateTimeInput
                id="uc08-proposed-date"
                mode="date"
                value={draftDate}
                onChange={(event: ChangeEvent<HTMLInputElement>) => setDraftDate(event.target.value)}
              />
            </FormField>
            <div className="grid grid-cols-2 gap-2 md:col-span-2 xl:col-span-1">
              <FormField id="uc08-proposed-start" label="Start time" required>
                <DateTimeInput
                  id="uc08-proposed-start"
                  mode="time"
                  value={draftStart}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => setDraftStart(event.target.value)}
                />
              </FormField>
              <FormField id="uc08-proposed-end" label="End time" required>
                <DateTimeInput
                  id="uc08-proposed-end"
                  mode="time"
                  value={draftEnd}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => setDraftEnd(event.target.value)}
                />
              </FormField>
            </div>
          </div>

          {adjustmentError && (
            <Banner variant="danger" title="Adjustment cannot be saved" description={adjustmentError} />
          )}

          <div className="rounded-md border border-border-default bg-surface-subtle p-3">
            <p className="text-sm font-medium text-text-primary">Chosen change for review</p>
            <p className="mt-1 text-sm text-text-secondary">
              {request?.id ?? 'No request selected'} · {selectedDraftPort?.code ?? 'No port'} · {draftDate || 'No date'} · {draftStart}–{draftEnd}. The selected window is checked against current proposals and active or allocated sessions.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={saveAdjustment} disabled={!request}>Save Changes</Button>
            <Button variant="secondary" onClick={() => { setAdjustmentError(''); setView('proposal'); }}>
              Cancel / Return Without Changes
            </Button>
          </div>
        </Card>
        <DemoDataNote />
      </div>
    );
  }

  if (view === 'confirmed') {
    const resourceRows = UC08_HUB_IDS.map((hubId) => {
      const summary = getResourceSummary(database, hubId);
      const allocated = database.chargingSchedules.filter((schedule) => (
        schedule.status === 'allocated'
        && getPort(database, schedule.portId)?.hubId === hubId
      ));
      const active = database.chargingSchedules.filter((schedule) => (
        schedule.status === 'charging'
        && getPort(database, schedule.portId)?.hubId === hubId
      ));
      const unavailable = database.chargingPorts.filter((port) => (
        port.hubId === hubId && port.physicalState === 'out_of_service'
      ));
      const allocationContext = [
        ...allocated.map((schedule) => `${getPortName(database, schedule.portId)} allocated ${formatWindow(schedule.startAt, schedule.endAt)}`),
        ...(active.length > 0 ? [`${active.map((schedule) => getPortName(database, schedule.portId)).join(' / ')} occupied by active sessions`] : []),
        ...(unavailable.length > 0 ? [`${unavailable.map((port) => port.code).join(' / ')} unavailable`] : []),
      ].join('; ') || 'No confirmed allocation in this window';

      return {
        hubName: getHubName(database, hubId),
        resourceState: `${summary.available} available · ${summary.occupied} occupied · ${summary.unavailable} unavailable / ${summary.total}`,
        allocationContext,
      };
    });

    return (
      <div className="space-y-5">
        <PageHeading
          breadcrumb="UC08 — Manage and Schedule Charging / Base proposal confirmed"
          title="Schedule Confirmed"
          description="Illustrative result after the operator confirms the proposal. Scheduled does not mean active or completed."
          badge={<StatusBadge variant="success">Scheduled — allocated</StatusBadge>}
        />

        <Card className="space-y-1 bg-surface-subtle">
          <h2 className="font-semibold text-text-primary">Base allocation confirmed</h2>
          <p className="text-sm text-text-secondary">
            {confirmedRows.map((row) => `${row.requestId} · ${row.hubName} · ${row.proposedWindow}`).join('. ')}. The physical state of each port remains separate from its scheduled allocation.
          </p>
        </Card>

        <Card className="overflow-hidden p-0">
          <Table
            columns={[
              { key: 'requestId', header: 'Request → allocation' },
              { key: 'hubName', header: 'Hub' },
              { key: 'desiredWindow', header: 'Desired window' },
              { key: 'proposedWindow', header: 'Confirmed port / window' },
              {
                key: 'status',
                header: 'Status',
                render: (row: ProposalRow) => <ProposalStatus row={row} />,
              },
            ]}
            data={buildProposalRows(database, true)}
            getRowKey={(row) => row.requestId}
          />
        </Card>

        <div>
          <h2 className="mb-2 text-lg font-semibold text-text-primary">Resource State After Confirmation</h2>
          <Card className="overflow-hidden p-0">
            <Table
              columns={[
                { key: 'hubName', header: 'Hub' },
                { key: 'resourceState', header: 'Port resource state' },
                { key: 'allocationContext', header: 'Allocation context' },
              ]}
              data={resourceRows}
              getRowKey={(row) => row.hubName}
            />
          </Card>
        </div>
        <p className="text-xs text-text-muted">
          Physical port states remain distinct from scheduled allocations. An allocated port is not counted as an active charging session.
        </p>
        <Button onClick={() => setView('overview')}>Return to Charging Management</Button>
        <DemoDataNote />
      </div>
    );
  }

  if (view === 'insufficient') {
    const hubARequests = requests.filter((request) => request.hubId === 'HUB-A');
    const availablePortCount = getResourceSummary(database, 'HUB-A').available;

    return (
      <div className="space-y-5">
        <PageHeading
          breadcrumb="UC08 — Manage and Schedule Charging / Capacity alternative"
          title="Insufficient Charging Ports"
          description="An additional request at Hub A exceeds the available capacity in the desired window."
          badge={<StatusBadge variant="warning">Operator review required</StatusBadge>}
        />
        <Banner
          variant="warning"
          title={`${hubARequests.length} requests for ${availablePortCount} available ports at Hub A`}
          description={`${hubARequests[0] ? formatDate(hubARequests[0].requestedStartAt) : ''} · 09:00–11:00. CR-2026-004 is an additional illustrative request at Campus Mobility Hub A. CP-01 and CP-02 are available; CP-03 and CP-04 are unavailable.`}
        />
        <Card className="space-y-3">
          <h2 className="font-semibold text-text-primary">Alternative proposal · Adjusted time for review</h2>
          <Table
            columns={[
              { key: 'requestId', header: 'Request → allocation' },
              { key: 'hubName', header: 'Hub' },
              { key: 'desiredWindow', header: 'Desired window' },
              { key: 'proposedWindow', header: 'Proposed port / window' },
              { key: 'status', header: 'Status' },
            ]}
            data={proposalRows}
            getRowKey={(row) => row.requestId}
          />
          <p className="text-xs text-text-muted">
            CR-2026-004 is proposed on CP-01, 11:00–13:00, after CR-2026-001's window. The alternative is illustrative only; operator confirmation is still required. CR-2026-003 remains pending at Hub B.
          </p>
        </Card>
        <Card className="space-y-1 bg-surface-subtle">
          <h2 className="font-semibold text-text-primary">No automatic confirmation</h2>
          <p className="text-sm text-text-secondary">
            Review the alternative before confirming. Existing Hub B sessions CS-101, CS-102 and CS-103 remain active on B-01, B-02 and B-03.
          </p>
        </Card>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setView('proposal')}>Review Alternative Proposal</Button>
          <Button variant="secondary" onClick={resetToBaseProposal}>Return to Proposed Schedule</Button>
        </div>
        <DemoDataNote />
      </div>
    );
  }

  if (view === 'portUnavailable') {
    const originalProposal = {
      version: 'Prior · invalid proposal',
      hub: getHubName(database, 'HUB-A'),
      port: 'CP-01 · excluded',
      window: `${formatDate(requests[0].requestedStartAt)} · 09:00–11:00`,
    };
    const revisedProposal = {
      version: 'Revised · awaiting review',
      hub: getHubName(database, 'HUB-A'),
      port: 'CP-02 · available',
      window: `${formatDate(requests[0].requestedStartAt)} · 11:00–13:00`,
    };

    return (
      <div className="space-y-5">
        <PageHeading
          breadcrumb="UC08 — Manage and Schedule Charging / Port reallocation example"
          title="Charging Port Unavailable"
          description="The previously proposed CP-01 at Campus Mobility Hub A is now unavailable."
          badge={<StatusBadge variant="danger">CP-01 unavailable</StatusBadge>}
        />
        <Banner
          variant="warning"
          title="Previous proposal cannot be confirmed"
          description="CP-01 is excluded from available resources. Hub A now has 1 available, 0 occupied and 3 unavailable ports out of 4. No successful allocation is claimed for the unavailable port."
        />
        <Card className="space-y-3">
          <h2 className="font-semibold text-text-primary">CR-2026-001 · Prior and revised proposal</h2>
          <Table
            columns={[
              { key: 'version', header: 'Version' },
              { key: 'hub', header: 'Hub' },
              { key: 'port', header: 'Port' },
              { key: 'window', header: 'Illustrative window' },
            ]}
            data={[originalProposal, revisedProposal]}
            getRowKey={(row) => row.version}
          />
          <p className="text-xs text-text-muted">
            The desired window remains 09:00–11:00. CP-03 and CP-04 remain unavailable. CR-2026-002 retains CP-02, 09:00–11:00; the revised CR-2026-001 proposal uses a later, non-overlapping window.
          </p>
        </Card>
        <Card className="space-y-1 bg-surface-subtle">
          <h2 className="font-semibold text-text-primary">Valid committed allocations preserved</h2>
          <p className="text-sm text-text-secondary">
            Existing Hub B sessions CS-101, CS-102 and CS-103 remain active on B-01, B-02 and B-03. The revised proposal has not been confirmed.
          </p>
        </Card>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setView('proposal')}>Review Updated Proposal</Button>
          <Button variant="secondary" onClick={resetToBaseProposal}>Return to Proposed Schedule</Button>
        </div>
        <DemoDataNote />
      </div>
    );
  }

  if (view === 'demandChanged') {
    const request = requests.find((item) => item.id === 'CR-2026-001');
    const proposal = request ? getCurrentProposal(database, request.id) : undefined;
    const beforeAndAfter = [
      {
        version: 'Before',
        request: 'CR-2026-001',
        port: 'CP-01',
        window: '09:00–11:00',
      },
      {
        version: 'Updated proposal',
        request: 'CR-2026-001',
        port: proposal ? getPortName(database, proposal.portId) : 'CP-01',
        window: proposal ? formatWindow(proposal.startAt, proposal.endAt) : '10:00–12:00',
      },
    ];

    return (
      <div className="space-y-5">
        <PageHeading
          breadcrumb="UC08 — Manage and Schedule Charging / Demand-change example"
          title="Charging Demand Changed"
          description="A changed charging or usage demand requires review of the existing proposal."
          badge={<StatusBadge variant="warning">Updated — awaiting review</StatusBadge>}
        />
        <Banner
          variant="warning"
          title="Proposal updated, not confirmed"
          description="CR-2026-001 at Campus Mobility Hub A. Usage demand changed in this example; review the updated allocation window before confirmation. No demand source, forecast or scheduling algorithm is assumed."
        />
        <Card className="space-y-3">
          <h2 className="font-semibold text-text-primary">Before and updated proposal</h2>
          <Table
            columns={[
              { key: 'version', header: 'Version' },
              { key: 'request', header: 'Request' },
              { key: 'port', header: 'Port' },
              { key: 'window', header: 'Illustrative allocation window' },
            ]}
            data={beforeAndAfter}
            getRowKey={(row) => row.version}
          />
          <p className="text-xs text-text-muted">
            Original desired date and window remain {request ? formatDate(request.requestedStartAt) : ''}, {request ? formatWindow(request.requestedStartAt, request.requestedEndAt) : '09:00–11:00'}. Updated windows are illustrative, not estimated charging durations.
          </p>
        </Card>
        <Card className="space-y-1 bg-surface-subtle">
          <h2 className="font-semibold text-text-primary">Unaffected resources and allocations retained</h2>
          <p className="text-sm text-text-secondary">
            Hub A port states are unchanged. CR-2026-002 retains CP-02, 09:00–11:00; CR-2026-003 remains pending at Hub B. Existing sessions CS-101, CS-102 and CS-103 remain active.
          </p>
        </Card>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setView('proposal')}>Review Changes</Button>
          <Button variant="secondary" onClick={resetToBaseProposal}>Return to Proposed Schedule</Button>
        </div>
        <DemoDataNote />
      </div>
    );
  }

  if (view === 'priorityReview') {
    return (
      <div className="space-y-5">
        <PageHeading
          breadcrumb="UC08 — Manage and Schedule Charging / Proposed priority group"
          title="Priority Review"
          description="Review only requests with a low-battery or near-term usage need. No score or automatic ordering is applied."
        />
        <Card className="space-y-1 bg-surface-subtle">
          <h2 className="font-semibold text-text-primary">Proposed priority group · Operator review</h2>
          <p className="text-sm text-text-secondary">
            These illustrative reasons may inform operator review. Group membership does not promise that a request will be scheduled first or receive a port.
          </p>
        </Card>
        <Card className="space-y-3">
          <h2 className="font-semibold text-text-primary">Requests with a priority reason</h2>
          <Table
            columns={[
              { key: 'requestId', header: 'Request' },
              { key: 'hubName', header: 'Hub' },
              { key: 'reason', header: 'Reason label' },
              { key: 'currentStatus', header: 'Current request status' },
            ]}
            data={priorityRows.map(({ request, reason }) => ({
              requestId: request.id,
              hubName: getHubName(database, request.hubId),
              reason,
              currentStatus: `${request.status === 'pending_scheduling' ? 'Pending Scheduling' : 'Needs Rescheduling'} · ${getCurrentProposal(database, request.id) ? 'Unallocated' : 'No proposal'}`,
            }))}
            getRowKey={(row) => row.requestId}
          />
        </Card>
        <Card className="space-y-1 bg-surface-subtle">
          <h2 className="font-semibold text-text-primary">Capacity remains a separate review</h2>
          <p className="text-sm text-text-secondary">
            A priority reason does not create a charging-port allocation. Check available capacity and confirm each proposed allocation separately.
          </p>
        </Card>
        <Button onClick={() => setView('proposal')}>Return to Proposed Schedule</Button>
        <DemoDataNote />
      </div>
    );
  }

  if (view === 'proposal') {
    const scenarioContext = {
      base: 'Base proposal. No committed allocation exists until the operator confirms the schedule.',
      adjusted: 'Saved adjustment. The selected proposal is updated, but operator confirmation is still required.',
      insufficient: 'Capacity alternative. An additional request exceeds the available ports in the desired window; the alternative still requires operator confirmation.',
      portUnavailable: 'Reallocated proposal. CP-01 is excluded because it is unavailable; the revised slot remains unconfirmed.',
      demandChanged: 'Demand-updated proposal. The proposed window changed after a usage-demand update and requires operator review.',
    }[scenario];

    return (
      <div className="space-y-5">
        <PageHeading
          breadcrumb="UC08 — Manage and Schedule Charging / Review proposal"
          title="Proposed Charging Schedule"
          description="Review each request-to-port proposal before committing allocations."
          badge={<StatusBadge variant="warning">Proposed — awaiting confirmation</StatusBadge>}
        />
        <Card className="space-y-1 bg-surface-subtle">
          <h2 className="font-semibold text-text-primary">Proposal context</h2>
          <p className="text-sm text-text-secondary">{scenarioContext}</p>
          {adjustmentError && (
            <p className="pt-1 text-sm text-status-danger-text" role="alert">{adjustmentError}</p>
          )}
        </Card>
        <p className="text-xs font-medium text-text-secondary">
          {requests[0] ? formatDate(requests[0].requestedStartAt) : ''} · Campus Mobility Hubs A and B
        </p>
        <Card className="overflow-hidden p-0">
          <Table
            columns={[
              { key: 'requestId', header: 'Request → allocation' },
              { key: 'hubName', header: 'Hub' },
              { key: 'desiredWindow', header: 'Desired window' },
              { key: 'proposedWindow', header: 'Proposed port / window' },
              {
                key: 'status',
                header: 'Status',
                render: (row: ProposalRow) => <ProposalStatus row={row} />,
              },
            ]}
            data={proposalRows}
            getRowKey={(row) => row.requestId}
          />
        </Card>
        <p className="text-xs text-text-muted">
          All proposed windows are illustrative allocation windows, not estimated charging durations. Pending requests remain unallocated until confirmation.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={confirmSchedule} disabled={proposalRows.every((row) => row.status !== 'Proposed - not allocated')}>
            Confirm Schedule
          </Button>
          <Button variant="secondary" onClick={() => openAdjustment(selectedRequestId)}>Adjust Schedule</Button>
          <Button variant="secondary" onClick={() => setView('priorityReview')}>Review Priority Groups</Button>
        </div>
        <Card className="space-y-1 bg-surface-subtle">
          <h2 className="font-semibold text-text-primary">Existing allocations preserved</h2>
          <p className="text-sm text-text-secondary">
            CS-101, CS-102 and CS-103 remain active at Hub B on B-01, B-02 and B-03. Proposals do not alter these committed sessions.
          </p>
        </Card>
        <div className="space-y-2">
          <p className="text-xs text-text-muted">Illustrative alternative states · Separate sample scenarios</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={applyInsufficientPortsExample}>Example: Insufficient Ports</Button>
            <Button variant="secondary" onClick={applyPortUnavailableExample}>Example: Port Unavailable</Button>
            <Button variant="secondary" onClick={applyDemandChangedExample}>Example: Demand Changed</Button>
          </div>
        </div>
        <DemoDataNote />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeading
        breadcrumb="UC08 — Manage and Schedule Charging / Management overview"
        title="Manage and Schedule Charging"
        description="Review requests, inspect available ports and confirm an operator-reviewed charging proposal."
      />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-text-primary">Charging Resources</h2>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {hubSummaries.map((hub) => (
            <Card key={hub.id} className="space-y-3">
              <div>
                <h3 className="font-semibold text-text-primary">{hub.name}</h3>
                <p className="mt-1 text-xs text-text-muted">
                  {hub.summary.occupied} occupied · {hub.summary.unavailable} unavailable · {hub.summary.total} total ports
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-brand-primary">
                  {hub.summary.available} available of {hub.summary.total} ports
                </p>
                <Button variant="secondary" className="text-xs" onClick={() => setPortDialogHubId(hub.id)}>
                  View Port Status <span aria-hidden="true">→</span>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-text-primary">Requests Awaiting Scheduling</h2>
        <Card className="overflow-hidden p-0">
          <Table
            columns={[
              {
                key: 'id',
                header: 'ID / type',
                render: (request: ChargingRequest) => (
                  <div>
                    <p className="font-medium text-text-primary">{request.id}</p>
                    <p className="text-xs text-text-muted">Request</p>
                  </div>
                ),
              },
              {
                key: 'hubId',
                header: 'Hub',
                render: (request: ChargingRequest) => getHubName(database, request.hubId),
              },
              {
                key: 'requestedStartAt',
                header: 'Desired / session window',
                render: (request: ChargingRequest) => (
                  <div>
                    <p>{formatDate(request.requestedStartAt)}</p>
                    <p className="text-xs text-text-muted">{formatWindow(request.requestedStartAt, request.requestedEndAt)}</p>
                  </div>
                ),
              },
              {
                key: 'status',
                header: 'Status',
                render: (request: ChargingRequest) => <RequestStatus status={request.status} />,
              },
              {
                key: 'personalVehicleLabel',
                header: 'Port / selection',
                render: (request: ChargingRequest) => (
                  <div className="flex flex-wrap items-center gap-2">
                    <span>{getAllocatedSchedule(database, request.id) ? getPortName(database, getAllocatedSchedule(database, request.id)!.portId) : 'Unallocated'}</span>
                    <Button
                      variant="secondary"
                      className="px-2 py-1 text-xs"
                      onClick={() => setSelectedRequestId(request.id)}
                    >
                      {selectedRequestId === request.id ? 'Selected' : 'Select'}
                    </Button>
                  </div>
                ),
              },
            ]}
            data={pendingRequests}
            getRowKey={(request) => request.id}
            emptyMessage="No requests are currently awaiting scheduling."
          />
        </Card>
      </section>

      <Card className="space-y-1 bg-surface-subtle">
        <h2 className="font-semibold text-text-primary">Existing active sessions · Separate from requests</h2>
        <p className="text-sm text-text-secondary">
          {activeSessions.map((session) => session.id).join(' / ')} · {activeSessions.length} existing sessions · Campus Mobility Hub B · {activeSessionPorts.join(' / ')} · {activeSessions[0] ? formatDate(activeSessions[0].startAt) : ''}, {activeSessions[0] ? formatWindow(activeSessions[0].startAt, activeSessions[0].endAt) : ''}. These illustrative sessions are active, not pending requests.
        </p>
      </Card>
      <p className="text-xs text-text-muted">
        {requests.length > 0 ? `${requests.length} charging requests in the operator sample` : 'No charging requests'} · {activeSessions.length} active sessions. Pending requests remain unallocated until a schedule is confirmed.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setView('proposal')}>Review Proposed Schedule</Button>
        <Button variant="secondary" onClick={() => setView('requests')}>Requests and Sessions</Button>
      </div>

      <Dialog
        open={portDialogHubId !== null}
        onClose={() => setPortDialogHubId(null)}
        title={`${getHubName(database, portDialogHubId ?? '')} · Port Status`}
        footer={<Button variant="secondary" onClick={() => setPortDialogHubId(null)}>Close</Button>}
      >
        <div className="space-y-3">
          <Table
            columns={[
              { key: 'code', header: 'Port' },
              {
                key: 'physicalState',
                header: 'Physical state',
                render: (port: ChargingPort) => (
                  <StatusBadge variant={port.physicalState === 'idle' ? 'success' : port.physicalState === 'charging' ? 'warning' : 'danger'}>
                    {port.physicalState === 'idle' ? 'Available' : port.physicalState === 'charging' ? 'Occupied' : 'Unavailable'}
                  </StatusBadge>
                ),
              },
              {
                key: 'id',
                header: 'Allocation context',
                render: (port: ChargingPort) => {
                  const currentProposal = database.chargingScheduleProposals.find(
                    (proposal) => proposal.portId === port.id && proposal.status === 'proposed',
                  );
                  const active = database.chargingSchedules.find(
                    (schedule) => schedule.portId === port.id && schedule.status === 'charging',
                  );
                  const allocated = database.chargingSchedules.find(
                    (schedule) => schedule.portId === port.id && schedule.status === 'allocated',
                  );
                  if (port.physicalState === 'out_of_service') return 'Excluded from available resources';
                  if (active) return `Active session · ${active.id}`;
                  if (allocated) return `Allocated · ${allocated.requestId}`;
                  if (currentProposal) return `Proposed · ${currentProposal.requestId} (not allocated)`;
                  return 'Available for a proposed allocation';
                },
              },
            ]}
            data={portDialog}
            getRowKey={(port) => port.id}
          />
          <p className="text-xs text-text-muted">
            Physical port status is separate from a proposed or allocated schedule.
          </p>
        </div>
      </Dialog>
      <DemoDataNote />
    </div>
  );
}
