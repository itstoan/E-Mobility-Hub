import { useState } from 'react';
import {
  Banner,
  Button,
  Card,
  DateTimeInput,
  FormField,
  StatusBadge,
} from '../../../components/ui';
import { useAuthStore } from '../../../stores/useAuthStore';
import { useMobilityDataStore } from '../../../stores/useMobilityDataStore';

type ChargingRequestStep =
  | 'hub-list'
  | 'port-status'
  | 'request-form'
  | 'review'
  | 'submitted'
  | 'no-ports'
  | 'invalid'
  | 'failed';

type ValidationErrors = {
  date?: string;
  startTime?: string;
  endTime?: string;
};

const PERSONAL_VEHICLE_LABEL = 'Personal electric vehicle';

function PageHeading({
  breadcrumb,
  title,
  description,
}: {
  breadcrumb: string;
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <p className="text-xs font-medium text-text-muted">{breadcrumb}</p>
        <span className="text-xs font-medium text-brand-primary">
          Student · VNU-HCM
        </span>
      </div>
      <h1 className="text-2xl font-semibold text-text-primary">{title}</h1>
      <p className="text-sm text-text-secondary">{description}</p>
    </div>
  );
}

function getPortStatus(portState: string): {
  label: string;
  variant: 'success' | 'warning' | 'danger';
} {
  if (portState === 'idle') return { label: 'Available', variant: 'success' };
  if (portState === 'charging') return { label: 'Occupied', variant: 'warning' };
  return { label: 'Unavailable', variant: 'danger' };
}

function ChargingPortGrid({
  ports,
}: {
  ports: Array<{ id: string; code: string; physicalState: string }>;
}) {
  if (ports.length === 0) {
    return (
      <Card className="bg-surface-subtle">
        <p className="text-sm text-text-secondary">
          No charging-port information is currently available for this Hub.
        </p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {ports.map((port) => {
        const status = getPortStatus(port.physicalState);

        return (
          <Card key={port.id} className="space-y-2 bg-surface-subtle">
            <p className="font-semibold text-text-primary">{port.code}</p>
            <StatusBadge variant={status.variant}>{status.label}</StatusBadge>
          </Card>
        );
      })}
    </div>
  );
}

function RequestTimeFields({
  date,
  startTime,
  endTime,
  onDateChange,
  onStartTimeChange,
  onEndTimeChange,
  errors = {},
}: {
  date: string;
  startTime: string;
  endTime: string;
  onDateChange: (value: string) => void;
  onStartTimeChange: (value: string) => void;
  onEndTimeChange: (value: string) => void;
  errors?: ValidationErrors;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <FormField id="desired-date" label="Desired date" required error={errors.date}>
        <DateTimeInput
          id="desired-date"
          mode="date"
          value={date}
          invalid={Boolean(errors.date)}
          onChange={(event) => onDateChange(event.target.value)}
        />
      </FormField>

      <FormField
        id="desired-start-time"
        label="Desired start time"
        required
        error={errors.startTime}
      >
        <DateTimeInput
          id="desired-start-time"
          mode="time"
          value={startTime}
          invalid={Boolean(errors.startTime)}
          onChange={(event) => onStartTimeChange(event.target.value)}
        />
      </FormField>

      <FormField
        id="desired-end-time"
        label="Desired end time"
        required
        error={errors.endTime}
      >
        <DateTimeInput
          id="desired-end-time"
          mode="time"
          value={endTime}
          invalid={Boolean(errors.endTime)}
          onChange={(event) => onEndTimeChange(event.target.value)}
        />
      </FormField>
    </div>
  );
}

export function StudentChargingRequestPage() {
  const user = useAuthStore((state) => state.currentUser);
  const hubs = useMobilityDataStore((state) => state.hubs);
  const chargingPorts = useMobilityDataStore((state) => state.chargingPorts);
  const submitChargingRequest = useMobilityDataStore(
    (state) => state.submitChargingRequest,
  );

  const [step, setStep] = useState<ChargingRequestStep>('hub-list');
  const [hubId, setHubId] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('11:00');
  const [feedback, setFeedback] = useState('');
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [newRequestId, setNewRequestId] = useState<string | null>(null);

  if (user?.role !== 'student') {
    return <p className="text-sm text-text-secondary">Student access required.</p>;
  }

  const chosenHub = hubs.find((hub) => hub.id === hubId);
  const selectedPorts = chargingPorts.filter((port) => port.hubId === hubId);
  const availablePorts = selectedPorts.filter(
    (port) => port.physicalState === 'idle',
  ).length;

  const goToHubList = () => {
    setStep('hub-list');
    setHubId('');
    setFeedback('');
    setValidationErrors({});
  };

  const selectHub = (selectedHubId: string) => {
    const selectedHub = hubs.find((hub) => hub.id === selectedHubId);
    if (!selectedHub || selectedHub.connectionStatus !== 'online') return;

    const freePorts = chargingPorts.filter(
      (port) => port.hubId === selectedHubId && port.physicalState === 'idle',
    ).length;

    setHubId(selectedHubId);
    setFeedback('');
    setValidationErrors({});
    setStep(freePorts > 0 ? 'port-status' : 'no-ports');
  };

  const validateRequest = (): ValidationErrors => {
    const errors: ValidationErrors = {};

    if (!date) errors.date = 'Select the desired charging date.';
    if (!startTime) errors.startTime = 'Enter the desired start time.';
    if (!endTime) {
      errors.endTime = 'Enter the desired end time.';
    } else if (startTime && endTime <= startTime) {
      errors.endTime = 'The end time must be later than the start time.';
    }

    return errors;
  };

  const reviewRequest = () => {
    const errors = validateRequest();
    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      setStep('invalid');
      return;
    }

    setStep('review');
  };

  const submitRequest = () => {
    if (!chosenHub || !user) return;

    const result = submitChargingRequest({
      userId: user.id,
      hubId,
      personalVehicleLabel: PERSONAL_VEHICLE_LABEL,
      desiredDate: date,
      startTime,
      endTime,
    });

    setFeedback(result.message);

    if (result.ok) {
      setNewRequestId(result.id ?? null);
      setStep('submitted');
      return;
    }

    setStep('failed');
  };

  const renderPortStatus = () => (
    <Card className="space-y-3">
      <div>
        <p className="text-xs font-medium text-text-muted">Selected Hub</p>
        <h2 className="mt-1 text-base font-semibold text-text-primary">
          {chosenHub?.name}
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          {availablePorts} available of {selectedPorts.length} ports
        </p>
      </div>
      <ChargingPortGrid ports={selectedPorts} />
      <div className="rounded-md border border-border-default bg-surface-subtle px-4 py-3">
        <p className="text-sm font-semibold text-text-primary">No port selection</p>
        <p className="mt-1 text-xs leading-5 text-text-secondary">
          Port status is for reference only. A port is not allocated when you submit a request.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setStep('request-form')}>Continue to Request</Button>
        <Button variant="secondary" onClick={goToHubList}>Back to Hub List</Button>
      </div>
    </Card>
  );

  return (
    <div className="space-y-5">
      {step === 'hub-list' && (
        <>
          <PageHeading
            breadcrumb="UC06 — Submit a Charging Request / Choose a Hub"
            title="Submit a Charging Request"
            description="Select a Hub to view charging-port status and request charging for your personal electric vehicle."
          />

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-text-primary">Charging Hubs</h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {hubs.map((hub) => {
                const ports = chargingPorts.filter((port) => port.hubId === hub.id);
                const free = ports.filter((port) => port.physicalState === 'idle').length;
                const isOnline = hub.connectionStatus === 'online';

                return (
                  <Card key={hub.id} className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-text-primary">{hub.name}</h3>
                      <p className="mt-1 text-xs text-text-muted">Charging-port availability</p>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-brand-primary">
                        {isOnline
                          ? `${free} available of ${ports.length} ports`
                          : 'Offline — last-known data'}
                      </p>
                      <Button
                        variant="secondary"
                        disabled={!isOnline}
                        onClick={() => selectHub(hub.id)}
                      >
                        Select Hub <span aria-hidden="true">→</span>
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>
        </>
      )}

      {step === 'port-status' && (
        <>
          <PageHeading
            breadcrumb="UC06 — Submit a Charging Request / Port Status"
            title="Charging Port Status"
            description="View the live status of charging ports at the selected Hub."
          />
          {renderPortStatus()}
        </>
      )}

      {step === 'no-ports' && (
        <>
          <PageHeading
            breadcrumb="UC06 — Submit a Charging Request / Alternative A2 — No ports available"
            title="No Available Charging Ports"
            description="The selected Hub currently has no idle charging ports."
          />
          <Card className="space-y-3">
            <div>
              <h2 className="font-semibold text-text-primary">{chosenHub?.name}</h2>
              <p className="mt-1 text-xs text-text-muted">
                0 available of {selectedPorts.length} ports · Current status
              </p>
            </div>
            <ChargingPortGrid ports={selectedPorts} />
            <div className="rounded-md border border-border-default bg-surface-subtle px-4 py-3">
              <p className="text-sm font-semibold text-text-primary">
                You can still submit a request at this Hub
              </p>
              <p className="mt-1 text-xs leading-5 text-text-secondary">
                A request does not guarantee port allocation. Once submitted, it remains Pending Scheduling until an operator reviews the request.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setStep('request-form')}>Continue with This Hub</Button>
              <Button variant="secondary" onClick={goToHubList}>Choose Another Hub</Button>
            </div>
          </Card>
        </>
      )}

      {step === 'request-form' && (
        <>
          <PageHeading
            breadcrumb="UC06 — Submit a Charging Request / Desired Time Window"
            title="Submit a Charging Request"
            description="Enter your desired charging date and time window for your personal electric vehicle."
          />
          <Card className="space-y-5">
            <div>
              <p className="text-xs font-medium text-text-muted">Selected Hub</p>
              <h2 className="mt-1 font-semibold text-text-primary">{chosenHub?.name}</h2>
              <p className="mt-1 text-sm text-text-secondary">
                Charging port status: {availablePorts} available of {selectedPorts.length} ports · {PERSONAL_VEHICLE_LABEL}
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="font-semibold text-text-primary">Desired Time Window</h2>
              <RequestTimeFields
                date={date}
                startTime={startTime}
                endTime={endTime}
                onDateChange={(value) => {
                  setDate(value);
                  setValidationErrors((current) => ({ ...current, date: undefined }));
                }}
                onStartTimeChange={(value) => {
                  setStartTime(value);
                  setValidationErrors((current) => ({ ...current, startTime: undefined, endTime: undefined }));
                }}
                onEndTimeChange={(value) => {
                  setEndTime(value);
                  setValidationErrors((current) => ({ ...current, endTime: undefined }));
                }}
              />
            </div>

            <div className="rounded-md border border-border-default bg-surface-subtle px-4 py-3">
              <p className="text-sm font-semibold text-text-primary">Scheduling preference</p>
              <p className="mt-1 text-xs leading-5 text-text-secondary">
                Your desired time is a preference, not a confirmed schedule. An operator will review and schedule your request.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={reviewRequest}>Review Request</Button>
              <Button
                variant="secondary"
                onClick={() => setStep(availablePorts > 0 ? 'port-status' : 'no-ports')}
              >
                Back to Port Status
              </Button>
            </div>
          </Card>
        </>
      )}

      {step === 'invalid' && (
        <>
          <PageHeading
            breadcrumb="UC06 — Submit a Charging Request / Alternative A3 — Request information"
            title="Please Check Your Request Information"
            description="Correct the desired time window before submitting your charging request."
          />
          <Card className="space-y-4">
            <Banner
              variant="danger"
              title="Check desired time"
              description={
                validationErrors.endTime ??
                validationErrors.startTime ??
                validationErrors.date ??
                'Review the required information and try again.'
              }
            />
            <div>
              <p className="text-xs font-medium text-text-muted">Selected Hub</p>
              <h2 className="mt-1 font-semibold text-text-primary">{chosenHub?.name}</h2>
            </div>
            <div className="space-y-3">
              <h2 className="font-semibold text-text-primary">Desired Time Window</h2>
              <RequestTimeFields
                date={date}
                startTime={startTime}
                endTime={endTime}
                errors={validationErrors}
                onDateChange={(value) => {
                  setDate(value);
                  setValidationErrors((current) => ({ ...current, date: undefined }));
                }}
                onStartTimeChange={(value) => {
                  setStartTime(value);
                  setValidationErrors((current) => ({ ...current, startTime: undefined, endTime: undefined }));
                }}
                onEndTimeChange={(value) => {
                  setEndTime(value);
                  setValidationErrors((current) => ({ ...current, endTime: undefined }));
                }}
              />
            </div>
            <div className="rounded-md border border-border-default bg-surface-subtle px-4 py-3">
              <p className="text-sm font-semibold text-text-primary">Scheduling preference</p>
              <p className="mt-1 text-xs leading-5 text-text-secondary">
                Your desired time is a preference, not a confirmed schedule.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={reviewRequest}>Update Request</Button>
              <Button
                variant="secondary"
                onClick={() => setStep(availablePorts > 0 ? 'port-status' : 'no-ports')}
              >
                Back to Port Status
              </Button>
            </div>
          </Card>
        </>
      )}

      {step === 'review' && (
        <>
          <PageHeading
            breadcrumb="UC06 — Submit a Charging Request / Review before submission"
            title="Review Request"
            description="Check the Hub and desired time information before submitting your charging request."
          />
          <Card className="space-y-4">
            <h2 className="font-semibold text-text-primary">Charging Request Details</h2>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-text-muted">Hub</dt>
                <dd className="mt-1 text-sm font-semibold text-text-primary">{chosenHub?.name}</dd>
              </div>
              <div>
                <dt className="text-xs text-text-muted">Desired date</dt>
                <dd className="mt-1 text-sm font-semibold text-text-primary">{date}</dd>
              </div>
              <div>
                <dt className="text-xs text-text-muted">Desired time window</dt>
                <dd className="mt-1 text-sm font-semibold text-text-primary">{startTime}–{endTime}</dd>
              </div>
              <div>
                <dt className="text-xs text-text-muted">Vehicle</dt>
                <dd className="mt-1 text-sm font-semibold text-text-primary">{PERSONAL_VEHICLE_LABEL}</dd>
              </div>
            </dl>
            <div className="rounded-md border border-border-default bg-surface-subtle px-4 py-3">
              <p className="text-sm font-semibold text-text-primary">Awaiting scheduling after submission</p>
              <p className="mt-1 text-xs leading-5 text-text-secondary">
                Your request will be Pending Scheduling after it is recorded. No charging port is allocated and no charging schedule is confirmed at this step.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={submitRequest}>Submit Request</Button>
              <Button variant="secondary" onClick={() => setStep('request-form')}>Edit Request</Button>
            </div>
          </Card>
        </>
      )}

      {step === 'submitted' && (
        <>
          <PageHeading
            breadcrumb="UC06 — Submit a Charging Request / Request recorded"
            title="Charging Request Submitted"
            description="Your request has been recorded and is awaiting scheduling by an operator."
          />
          <Card className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <StatusBadge variant="success">Pending Scheduling</StatusBadge>
              <span className="text-xs text-text-muted">Request recorded</span>
            </div>
            <div>
              <p className="text-xs text-text-muted">Sample request ID</p>
              <p className="mt-1 font-semibold text-text-primary">
                {newRequestId ?? 'Request recorded'}
              </p>
            </div>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-text-muted">Hub</dt>
                <dd className="mt-1 text-sm font-semibold text-text-primary">{chosenHub?.name}</dd>
              </div>
              <div>
                <dt className="text-xs text-text-muted">Desired date</dt>
                <dd className="mt-1 text-sm font-semibold text-text-primary">{date}</dd>
              </div>
              <div>
                <dt className="text-xs text-text-muted">Desired time window</dt>
                <dd className="mt-1 text-sm font-semibold text-text-primary">{startTime}–{endTime}</dd>
              </div>
              <div>
                <dt className="text-xs text-text-muted">Vehicle</dt>
                <dd className="mt-1 text-sm font-semibold text-text-primary">{PERSONAL_VEHICLE_LABEL}</dd>
              </div>
            </dl>
            <div className="rounded-md border border-border-default bg-surface-subtle px-4 py-3">
              <p className="text-sm font-semibold text-text-primary">Awaiting scheduling</p>
              <p className="mt-1 text-xs leading-5 text-text-secondary">
                No charging port has been allocated. A charging schedule is not confirmed until an operator completes scheduling in UC08.
              </p>
            </div>
            <div>
              <Button onClick={goToHubList}>Back to Charging Hubs</Button>
            </div>
          </Card>
        </>
      )}

      {step === 'failed' && (
        <>
          <PageHeading
            breadcrumb="UC06 — Submit a Charging Request / Alternative A4 — Submission failure"
            title="Request Could Not Be Submitted"
            description="Your charging request was not recorded. Review the details or try submitting again."
          />
          <Card className="space-y-4">
            <Banner
              variant="danger"
              title="Submission unsuccessful"
              description={feedback || 'The request could not be recorded. Please try again.'}
            />
            <div>
              <h2 className="font-semibold text-text-primary">Request details</h2>
              <p className="mt-2 text-sm text-text-secondary">
                {chosenHub?.name} · {date} · {startTime}–{endTime} · {PERSONAL_VEHICLE_LABEL}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={submitRequest}>Try Again</Button>
              <Button variant="secondary" onClick={() => setStep('request-form')}>Back to Request Form</Button>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
