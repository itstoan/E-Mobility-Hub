import type { ChangeEvent } from 'react';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import {
  Banner,
  Button,
  Card,
  FormField,
  Input,
  Select,
  StatusBadge,
  Table,
} from '../../../components/ui';
import { createMockSeed } from '../../../data/mock/seed';
import type {
  MobilityHub,
  SimulationHubRow,
  SimulationInputs,
  SimulationScenario,
} from '../../../types/domain';

type SimulationView =
  | 'overview'
  | 'configure'
  | 'results'
  | 'recommendations'
  | 'no-imbalance'
  | 'invalid';

function PageHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
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

function AssumptionsCard({
  scenario,
  hubNames,
  title = 'Scenario assumptions',
}: {
  scenario: SimulationScenario;
  hubNames: Map<string, string>;
  title?: string;
}) {
  const { inputs } = scenario;
  const hubLabel = getHubName(inputs.testHubId, hubNames);
  const demand = inputs.demandChangePercent > 0
    ? `+${inputs.demandChangePercent}%`
    : `${inputs.demandChangePercent}%`;

  return (
    <Card className="bg-surface-subtle">
      <p className="text-sm font-semibold text-text-primary">
        {scenario.id} · {title}
      </p>
      <p className="mt-1 text-sm text-text-secondary">
        Test {hubLabel} · Demand change {demand} · Unavailable-resource proportion{' '}
        {inputs.unavailableResourcePercent}% · Battery level {inputs.batteryLevelPercent}%.{' '}
        Illustrative inputs, not source-prescribed defaults.
      </p>
    </Card>
  );
}

function InfoNote({ title, description }: { title: string; description: string }) {
  return (
    <Card className="bg-surface-subtle">
      <p className="text-sm font-semibold text-text-primary">{title}</p>
      <p className="mt-1 text-sm text-text-secondary">{description}</p>
    </Card>
  );
}

function getHubName(hubId: string, hubNames: Map<string, string>): string {
  return hubNames.get(hubId) ?? hubId;
}

function buildSnapshotRows(
  rows: SimulationHubRow[],
  hubNames: Map<string, string>,
) {
  return rows.map((row) => ({
    hub: getHubName(row.hubId, hubNames),
    reference: (
      <>
        <span className="block">{row.referenceAvailableVehicles} available</span>
        <span className="block">Parking {row.referenceParkingOccupied} / {row.parkingCapacity}</span>
      </>
    ),
    simulated: (
      <>
        <span className="block">{row.simulatedAvailableVehicles} available</span>
        <span className="block">
          Parking {row.simulatedParkingOccupied} / {row.parkingCapacity}
          {row.risk ? ` · ${row.risk === 'Parking-capacity risk' ? 'Parking risk' : 'Shortage risk'}` : ''}
        </span>
      </>
    ),
    charging: `${row.referenceChargingAvailable} / ${row.chargingPortCapacity} available → ${row.simulatedChargingAvailable} / ${row.chargingPortCapacity} available`,
  }));
}

function ReferenceSnapshotTable({
  scenario,
  hubNames,
}: {
  scenario: SimulationScenario;
  hubNames: Map<string, string>;
}) {
  const rows = buildSnapshotRows(scenario.rows, hubNames);

  return (
    <Card className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold text-text-primary">
          {scenario.outcome === 'no-imbalance'
            ? 'SIMULATION-ONLY REFERENCE AND OUTCOMES'
            : 'SIMULATION-ONLY REFERENCE SNAPSHOT'}
        </h2>
        <p className="mt-1 text-xs text-text-secondary">
          Independent of the current UC07 operational snapshot. Hubs A and B are included;
          disconnected Hub C is excluded. Parking values are occupied / total.
        </p>
      </div>
      <Table
        columns={[
          { key: 'hub', header: 'Hub' },
          { key: 'reference', header: 'Reference vehicles / parking', render: (row) => row.reference },
          {
            key: 'simulated',
            header: scenario.outcome === 'no-imbalance'
              ? 'Simulated vehicles / parking'
              : 'Illustrative simulated vehicles / parking',
            render: (row) => row.simulated,
          },
          { key: 'charging', header: 'Charging reference → simulated' },
        ]}
        data={rows}
        getRowKey={(row) => row.hub}
      />
    </Card>
  );
}

function ScenarioInputs({
  values,
  onChange,
  hubs,
  unavailableError,
  batteryError,
  showCard = true,
  showHeading = true,
}: {
  values: SimulationInputs;
  onChange: (next: SimulationInputs) => void;
  hubs: MobilityHub[];
  unavailableError?: string;
  batteryError?: string;
  showCard?: boolean;
  showHeading?: boolean;
}) {
  const hubOptions = hubs
    .filter((hub) => hub.connectionStatus === 'online')
    .map((hub) => ({ value: hub.id, label: hub.name }));

  const content = (
    <div className="space-y-4">
      {showHeading && (
        <h2 className="text-lg font-semibold text-text-primary">Scenario Inputs</h2>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        <FormField id="simulation-test-hub" label="Test Hub">
          <Select
            id="simulation-test-hub"
            value={values.testHubId}
            options={hubOptions}
            onChange={(event: ChangeEvent<HTMLSelectElement>) => onChange({ ...values, testHubId: event.target.value })}
          />
        </FormField>
        <FormField id="simulation-demand-change" label="Demand change">
          <Input
            id="simulation-demand-change"
            type="text"
            inputMode="numeric"
            value={`${values.demandChangePercent > 0 ? '+' : ''}${values.demandChangePercent}%`}
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              const parsed = Number(event.target.value.replace('%', '').trim().replace(/^\+/, ''));
              onChange({ ...values, demandChangePercent: Number.isFinite(parsed) ? parsed : 0 });
            }}
          />
        </FormField>
        <FormField
          id="simulation-unavailable-proportion"
          label="Unavailable-resource proportion"
          error={unavailableError}
        >
          <div className="relative">
            <Input
              id="simulation-unavailable-proportion"
              type="number"
              min={0}
              max={100}
              step={1}
              className="pr-8"
              value={Number.isNaN(values.unavailableResourcePercent) ? '' : String(values.unavailableResourcePercent)}
              invalid={Boolean(unavailableError)}
              onChange={(event: ChangeEvent<HTMLInputElement>) => onChange({
                ...values,
                unavailableResourcePercent: event.target.value === '' ? Number.NaN : Number(event.target.value),
              })}
            />
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-text-muted">%</span>
          </div>
        </FormField>
        <FormField id="simulation-battery-level" label="Battery level" error={batteryError}>
          <div className="relative">
            <Input
              id="simulation-battery-level"
              type="number"
              min={0}
              max={100}
              step={1}
              className="pr-8"
              value={Number.isNaN(values.batteryLevelPercent) ? '' : String(values.batteryLevelPercent)}
              invalid={Boolean(batteryError)}
              onChange={(event: ChangeEvent<HTMLInputElement>) => onChange({
                ...values,
                batteryLevelPercent: event.target.value === '' ? Number.NaN : Number(event.target.value),
              })}
            />
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-text-muted">%</span>
          </div>
        </FormField>
      </div>
      <p className="text-xs text-text-secondary">
        Scenario-only assumptions · Demand change is relative to the simulation reference.
        Resource proportion and battery level are hypothetical percentages, not operational thresholds.
      </p>
    </div>
  );

  return showCard ? <Card>{content}</Card> : content;
}

export function OperationalSimulationPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialView = (searchParams.get('view') as SimulationView | null) ?? 'overview';

  // Create one shared MockDatabase instance for this page.
  // Hub identity/status is reused, while simulation snapshots remain independent of UC07.
  const database = useMemo(() => createMockSeed(), []);
  const simulation = database.simulation;
  const sharedHubs = database.hubs;

  const invalidSimulationInputs: SimulationInputs = {
    ...simulation.defaultInputs,
    unavailableResourcePercent: 120,
  };

  const [values, setValues] = useState<SimulationInputs>(() =>
    initialView === 'invalid' ? invalidSimulationInputs : simulation.defaultInputs,
  );
  const [validationAttempted, setValidationAttempted] = useState(false);

  const hubNames = useMemo(
    () => new Map(sharedHubs.map((hub) => [hub.id, hub.name])),
    [sharedHubs],
  );
  const disconnectedHub = sharedHubs.find((hub) => hub.id === 'HUB-C');
  const viewParam = searchParams.get('view');
  const view: SimulationView = [
    'overview', 'configure', 'results', 'recommendations', 'no-imbalance', 'invalid',
  ].includes(viewParam ?? '') ? (viewParam as SimulationView) : 'overview';

  const go = (nextView: SimulationView) => {
    setSearchParams(nextView === 'overview' ? {} : { view: nextView });
  };

  const unavailableError = validationAttempted && (
    !Number.isFinite(values.unavailableResourcePercent)
    || values.unavailableResourcePercent < 0
    || values.unavailableResourcePercent > 100
  )
    ? 'Enter a value from 0–100%. Check and correct the unavailable-resource proportion.'
    : undefined;
  const batteryError = validationAttempted && (
    !Number.isFinite(values.batteryLevelPercent)
    || values.batteryLevelPercent < 0
    || values.batteryLevelPercent > 100
  )
    ? 'Enter a battery level from 0–100%.'
    : undefined;

  const runSimulation = () => {
    setValidationAttempted(true);
    const unavailableValid = Number.isFinite(values.unavailableResourcePercent)
      && values.unavailableResourcePercent >= 0
      && values.unavailableResourcePercent <= 100;
    const batteryValid = Number.isFinite(values.batteryLevelPercent)
      && values.batteryLevelPercent >= 0
      && values.batteryLevelPercent <= 100;

    if (!unavailableValid || !batteryValid) {
      go('invalid');
      return;
    }

    // The mockup explicitly defines a static affordance. The next screen is a pre-authored
    // illustrative result, not output from a forecasting/optimization algorithm.
    go('results');
  };

  const correctHighlightedInput = () => {
    setValues((current) => ({
      ...current,
      unavailableResourcePercent:
        Number.isFinite(current.unavailableResourcePercent)
        && current.unavailableResourcePercent >= 0
        && current.unavailableResourcePercent <= 100
          ? current.unavailableResourcePercent
          : 20,
      batteryLevelPercent:
        Number.isFinite(current.batteryLevelPercent)
        && current.batteryLevelPercent >= 0
        && current.batteryLevelPercent <= 100
          ? current.batteryLevelPercent
          : 60,
    }));
    setValidationAttempted(false);
    go('configure');
  };

  if (view === 'overview') {
    return (
      <div className="space-y-5">
        <PageHeading
          eyebrow="UC11 / Hypothetical operational analysis"
          title="Operational Simulation"
          description="Configure a hypothetical scenario, assess resource impact and review recommendations without changing actual operations."
        />
        <InfoNote
          title="Analysis only — not live operations"
          description="Scenario controls affect hypothetical assumptions, not live vehicle, parking or charging states. Results and recommendations are review-only."
        />
        <Card className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Configure a Scenario</h2>
            <p className="mt-1 text-sm text-text-secondary">
              Choose a test Hub and adjust demand change, unavailable-resource proportion,
              and battery level. Review simulated shortage and parking-capacity risks in the same resource context.
            </p>
          </div>
          <Table
            columns={[
              { key: 'stage', header: 'Stage' },
              { key: 'task', header: 'Operator task' },
            ]}
            data={[
              { stage: 'Configure', task: 'Review default sample assumptions and adjust the scenario inputs.' },
              { stage: 'Assess impact', task: 'Compare a simulation-only reference with illustrative hypothetical outcomes.' },
              { stage: 'Review recommendations', task: 'Consider supported transfer or alternative-Hub options; never apply actual changes here.' },
            ]}
            getRowKey={(row) => row.stage}
          />
          <Button onClick={() => go('configure')}>Configure Scenario</Button>
        </Card>
        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-text-primary">Alternative Scenario Examples</h2>
          <p className="text-sm text-text-secondary">
            Separate static examples · No scenario is executed by these affordances.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => go('no-imbalance')}>
              Example: No Resource Imbalance
            </Button>
            <Button variant="secondary" onClick={() => {
              setValues(invalidSimulationInputs);
              setValidationAttempted(true);
              go('invalid');
            }}>
              Example: Invalid Parameters
            </Button>
          </div>
          <p className="text-xs text-text-secondary">
            No performance maximum, forecasting formula or optimization algorithm is specified in this static demonstration.
          </p>
        </section>
      </div>
    );
  }

  if (view === 'configure') {
    return (
      <div className="space-y-5">
        <PageHeading
          eyebrow="UC11 / Configure / Default sample controls"
          title="Configure Simulation"
          description="Adjust hypothetical operational assumptions for this scenario only. These controls do not edit live resource state."
        />
        <InfoNote
          title="Default sample configuration"
          description="SIM-2026-001 · Values are illustrative defaults selected for this mockup, not source-prescribed operating defaults. Adjust them before running a hypothetical analysis."
        />
        <ScenarioInputs
          values={values}
          onChange={setValues}
          hubs={sharedHubs}
          unavailableError={unavailableError}
          batteryError={batteryError}
        />
        <InfoNote
          title="Independent simulation-only reference"
          description={`The result example uses a separate reference snapshot for Hubs A and B, not the current UC07 network data. ${disconnectedHub?.name ?? 'Hub C'} is disconnected and excluded; its last-known values are not used as current data.`}
        />
        <div className="flex flex-wrap gap-2">
          <Button onClick={runSimulation}>Run Simulation</Button>
          <Button variant="secondary" onClick={() => go('overview')}>Back to Simulation Overview</Button>
        </div>
        <p className="text-xs text-text-secondary">
          Run is a static affordance. No real computation, performance guarantee or live operational change is established by this screen.
        </p>
      </div>
    );
  }

  if (view === 'invalid') {
    const invalidValues = Number.isFinite(values.unavailableResourcePercent)
      ? values
      : { ...values, unavailableResourcePercent: Number.NaN };
    const invalidProportion = !Number.isFinite(invalidValues.unavailableResourcePercent)
      || invalidValues.unavailableResourcePercent < 0
      || invalidValues.unavailableResourcePercent > 100;
    const invalidBattery = !Number.isFinite(invalidValues.batteryLevelPercent)
      || invalidValues.batteryLevelPercent < 0
      || invalidValues.batteryLevelPercent > 100;
    const displayedError = invalidProportion
      ? `${Number.isFinite(invalidValues.unavailableResourcePercent) ? `${invalidValues.unavailableResourcePercent}%` : 'The entered value'} is not a valid proportion. Enter a value from 0–100%. Other valid inputs remain unchanged.`
      : invalidBattery
        ? 'Battery level must be a value from 0–100%. Other valid inputs remain unchanged.'
        : 'Correct the highlighted input before running the scenario.';

    return (
      <div className="space-y-5">
        <PageHeading
          eyebrow="UC11 / Alternative A2 / Blocked at run step"
          title="Invalid Simulation Parameters"
          description="Simulation has not executed. Correct the highlighted input before running the scenario."
        />
        <Banner
          variant="danger"
          title={invalidProportion
            ? 'Execution blocked — check the unavailable-resource proportion'
            : 'Execution blocked — check the battery level'}
          description={displayedError}
        />
        <Card className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-text-primary">SIM-2026-001 · Configuration to Correct</h2>
            <StatusBadge variant="danger">Not executed</StatusBadge>
          </div>
          <ScenarioInputs
            showCard={false}
            showHeading={false}
            values={invalidValues}
            onChange={setValues}
            hubs={sharedHubs}
            unavailableError={invalidProportion
              ? 'Enter a value from 0–100%. Check and correct the unavailable-resource proportion.'
              : undefined}
            batteryError={batteryError}
          />
          <div className="flex flex-wrap gap-2">
            <Button onClick={correctHighlightedInput}>Correct Highlighted Input</Button>
            <Button disabled variant="primary">Run Simulation — Blocked</Button>
            <Button variant="secondary" onClick={() => go('configure')}>Back to Configuration</Button>
          </div>
        </Card>
        <p className="text-xs text-text-secondary">
          0–100% is the mathematical domain of a proportion, not an operational risk threshold.
          No results or recommendations are produced; no live resource state has changed.
        </p>
      </div>
    );
  }

  if (view === 'no-imbalance') {
    return (
      <div className="space-y-5">
        <PageHeading
          eyebrow="UC11 / Alternative A1 / Separate scenario SIM-2026-002"
          title="The Network Can Meet the Simulated Demand"
          description="No resource imbalance is shown in this separate illustrative scenario. Actual operations remain unchanged."
        />
        <AssumptionsCard scenario={simulation.noImbalanceScenario} hubNames={hubNames} title="Separate scenario inputs" />
        <ReferenceSnapshotTable scenario={simulation.noImbalanceScenario} hubNames={hubNames} />
        <Banner
          variant="success"
          title="No coordination recommendation"
          description="The network can meet the hypothetical demand in this example. No vehicle-transfer recommendation is generated and no additional operational adjustment is proposed."
        />
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => {
            setValues(simulation.defaultInputs);
            setValidationAttempted(false);
            go('configure');
          }}>Configure Another Scenario</Button>
          <Button variant="secondary" onClick={() => go('overview')}>Return to Overview</Button>
        </div>
        <p className="text-xs text-text-secondary">
          No live resource or reservation state was changed by this illustrative assessment.
        </p>
      </div>
    );
  }

  if (view === 'recommendations') {
    const rows = simulation.imbalanceScenario.rows.map((row) => ({
      hub: getHubName(row.hubId, hubNames),
      result: (
        <>
          <span className="block">{row.simulatedAvailableVehicles} vehicles available · Parking {row.simulatedParkingOccupied} / {row.parkingCapacity}</span>
          <span className="block">{row.simulatedChargingAvailable} / {row.chargingPortCapacity} charging ports available</span>
        </>
      ),
      focus: row.risk ?? 'No specific risk shown',
    }));

    return (
      <div className="space-y-5">
        <PageHeading
          eyebrow="UC11 / SIM-2026-001 / Review only"
          title="Simulation Recommendations"
          description="Review hypothetical response options. There is no Apply, Approve or execution action in operational simulation."
        />
        <AssumptionsCard scenario={simulation.imbalanceScenario} hubNames={hubNames} />
        <Card className="overflow-hidden p-0">
          <Table
            columns={[
              { key: 'hub', header: 'Hypothetical Hub context' },
              { key: 'result', header: 'Simulated result', render: (row) => row.result },
              { key: 'focus', header: 'Review focus' },
            ]}
            data={rows}
            getRowKey={(row) => row.hub}
          />
        </Card>
        <Card className="space-y-2">
          <h2 className="text-lg font-semibold text-text-primary">Vehicle Transfer — Review Option</h2>
          <p className="text-sm text-text-secondary">
            Consider a transfer from Hub A to Hub B in this hypothetical scenario. A has 3 available
            vehicles and a parking-capacity risk; B has a vehicle-shortage risk and 6 free parking spaces.
          </p>
          <p className="text-xs text-text-muted">
            Any actual proposal would require current source availability, destination capacity,
            battery, charging capability, demand and Hub-status review outside this simulation.
          </p>
        </Card>
        <Card className="space-y-2">
          <h2 className="text-lg font-semibold text-text-primary">Alternative Hub — Review Option</h2>
          <p className="text-sm text-text-secondary">
            Consider Hub B as an alternative for hypothetical returns that would otherwise add to Hub A’s
            19 / 20 occupied parking spaces. Hub B has 6 free spaces in the simulated result.
          </p>
          <p className="text-xs text-text-muted">
            No charging adjustment is proposed: the shown charging context does not establish a need for one.
          </p>
        </Card>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => go('results')}>Back to Results</Button>
          <Button variant="secondary" onClick={() => go('configure')}>Reconfigure Scenario</Button>
        </div>
        <p className="text-xs text-text-secondary">
          Recommendations are informational only. No resource, reservation or operational allocation is changed.
        </p>
      </div>
    );
  }

  // Default result: SIM-2026-001, a pre-authored illustrative output from the UI mockup.
  const resultScenario = simulation.imbalanceScenario;
  return (
    <div className="space-y-5">
      <PageHeading
        eyebrow="UC11 / SIM-2026-001 / Illustrative imbalance results"
        title="Simulation Results"
        description="Hypothetical outcomes only · Results are illustrative scenario outputs, not a computed model or current availability."
      />
      <AssumptionsCard scenario={{ ...resultScenario, inputs: values }} hubNames={hubNames} />
      <ReferenceSnapshotTable scenario={resultScenario} hubNames={hubNames} />
      <Banner
        variant="warning"
        title="Impact assessment · Hypothetical risks"
        description="Hub B: vehicle-shortage risk with 1 available vehicle. Hub A: parking-capacity risk with 19 / 20 spaces occupied. Risk labels are illustrative; no numeric risk threshold or forecast is assumed."
      />
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => go('recommendations')}>Review Recommendations</Button>
        <Button variant="secondary" onClick={() => go('configure')}>Reconfigure Scenario</Button>
        <Button variant="secondary" onClick={() => go('overview')}>Back to Overview</Button>
      </div>
      <p className="text-xs text-text-secondary">
        Reference and simulated values are separate examples. No live vehicle transfers, charging changes or resource allocations have been made.
      </p>
    </div>
  );
}
