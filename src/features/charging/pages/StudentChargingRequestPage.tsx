import { useState } from 'react';
import { Link } from 'react-router';
import { Banner, Button, Card, DateTimeInput, FormField, Input, StatusBadge } from '../../../components/ui';
import { ROUTES } from '../../../routes/paths';
import { useAuthStore } from '../../../stores/useAuthStore';
import { useMobilityDataStore } from '../../../stores/useMobilityDataStore';

export function StudentChargingRequestPage() {
  const user = useAuthStore((s) => s.currentUser);
  const hubs = useMobilityDataStore((s) => s.hubs);
  const chargingPorts = useMobilityDataStore((s) => s.chargingPorts);
  const submitChargingRequest = useMobilityDataStore((s) => s.submitChargingRequest);
  const [hubId, setHubId] = useState('');
  const [vehicleLabel, setVehicleLabel] = useState('Personal E-Bike');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('11:00');
  const [reviewing, setReviewing] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [newRequestId, setNewRequestId] = useState<string | null>(null);
  if (user?.role !== 'student') return <p>Student access required.</p>;

  const chosen = hubs.find((h) => h.id === hubId);
  const availablePorts = chargingPorts.filter((p) => p.hubId === hubId && p.physicalState === 'idle').length;
  const onSubmit = () => {
    const result = submitChargingRequest({ userId: user.id, hubId, personalVehicleLabel: vehicleLabel,
      desiredDate: date, startTime, endTime });
    setFeedback(result.message);
    if (result.ok) { setNewRequestId(result.id ?? null); setReviewing(false); }
  };
  return <div className="space-y-5">
    <header><h1 className="font-heading text-3xl font-semibold">Submit a Charging Request</h1>
      <p className="text-text-secondary">Choose a Hub, review port status, and request a charging time window.</p></header>
    {newRequestId ? <Card><StatusBadge variant="success">Pending Scheduling</StatusBadge>
      <h2 className="mt-3 text-xl font-semibold">Charging Request Submitted</h2>
      <p>Request ID: <code>{newRequestId}</code></p>
      <p className="text-sm text-text-secondary">A charging port is NOT allocated yet. Operator scheduling belongs to UC08.</p>
      <Button className="mt-4" variant="secondary" onClick={() => { setNewRequestId(null); setFeedback(''); }}>Submit another request</Button></Card> : <>
      <section className="grid gap-3 md:grid-cols-2">
        {hubs.map((hub) => {
          const ports = chargingPorts.filter((p) => p.hubId === hub.id);
          const free = ports.filter((p) => p.physicalState === 'idle').length;
          return <Card key={hub.id} className={hubId === hub.id ? 'border-brand-primary' : ''}>
            <h2 className="font-semibold">{hub.name}</h2>
            <p className="text-sm text-text-secondary">{hub.connectionStatus === 'online' ? `${free} available of ${ports.length} ports (current status)` : 'Offline — last-known data'}</p>
            <Button className="mt-3" variant="secondary" disabled={hub.connectionStatus !== 'online' || free === 0} onClick={() => { setHubId(hub.id); setReviewing(false); }}>
              {hubId === hub.id ? 'Selected Hub' : 'Select Hub'}
            </Button>
          </Card>;
        })}
      </section>
      {chosen && <Card>
        <h2 className="mb-3 font-semibold">Charging Port Status</h2>
        <div className="flex flex-wrap gap-3">{chargingPorts.filter((p) => p.hubId === hubId).map((port) =>
          <div key={port.id} className="rounded-lg bg-surface-subtle p-3"><p>{port.code}</p><StatusBadge variant={port.physicalState === 'idle' ? 'success' : 'danger'}>{port.physicalState}</StatusBadge></div>)}</div>
        <p className="mt-3 text-sm text-text-secondary">{availablePorts === 0 ? 'No currently idle ports. Choose another Hub to submit a request.' : 'An idle port does not guarantee scheduling.'}</p>
      </Card>}
      <Card><h2 className="mb-4 font-semibold">Desired Time Window</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <FormField id="desired-date" label="Desired date" required><DateTimeInput id="desired-date" mode="date" value={date} onChange={(e) => { setDate(e.target.value); setReviewing(false); }} /></FormField>
          <FormField id="start-time" label="Desired start time" required><DateTimeInput id="start-time" mode="time" value={startTime} onChange={(e) => { setStartTime(e.target.value); setReviewing(false); }} /></FormField>
          <FormField id="end-time" label="Desired end time" required><DateTimeInput id="end-time" mode="time" value={endTime} onChange={(e) => { setEndTime(e.target.value); setReviewing(false); }} /></FormField>
        </div>
        <div className="mt-4"><FormField id="vehicle-label" label="Personal electric vehicle" required><Input id="vehicle-label" value={vehicleLabel} onChange={(e) => { setVehicleLabel(e.target.value); setReviewing(false); }} /></FormField></div>
        <p className="mt-3 rounded-lg bg-surface-subtle p-3 text-sm text-text-secondary">Scheduling preference only. No ChargingSchedule or ChargingPort is assigned by UC06.</p>
      </Card>
      {feedback && <Banner variant="danger" title="Unable to submit request" description={feedback} />}
      {reviewing && <Card><h2 className="font-semibold">Review Request</h2>
        <p className="mt-2">{chosen?.name} · {date} · {startTime}–{endTime} · {vehicleLabel}</p>
        <StatusBadge variant="warning">Pending Scheduling</StatusBadge>
      </Card>}
      <div className="flex flex-wrap gap-3"><Button disabled={!chosen || chosen.connectionStatus !== 'online' || availablePorts === 0 || !date || !vehicleLabel.trim()} onClick={() => { if (reviewing) onSubmit(); else setReviewing(true); }}>{reviewing ? 'Submit Request' : 'Review Request'}</Button>
        <Button variant="secondary" onClick={() => setReviewing(false)}>Edit Request</Button>
        <Link className="self-center text-brand-primary" to={ROUTES.STUDENT.HUBS}>Back to Hub Search</Link></div>
    </>}
  </div>;
}
