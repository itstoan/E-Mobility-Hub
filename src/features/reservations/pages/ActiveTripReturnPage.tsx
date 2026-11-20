import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { Banner, Button, Card, Dialog, Input, StatusBadge } from '../../../components/ui';
import { useAuthStore } from '../../../stores/useAuthStore';
import { canHubAcceptSharedVehicle, useMobilityDataStore } from '../../../stores/useMobilityDataStore';
import { ROUTES } from '../../../routes/paths';

export function ActiveTripReturnPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const user = useAuthStore((s) => s.currentUser);
  const hubs = useMobilityDataStore((s) => s.hubs);
  const vehicles = useMobilityDataStore((s) => s.vehicles);
  const trips = useMobilityDataStore((s) => s.trips);
  const confirmVehicleReturn = useMobilityDataStore((s) => s.confirmVehicleReturn);
  const [hubId, setHubId] = useState('');
  const [battery, setBattery] = useState('51');
  const [issue, setIssue] = useState(false);
  const [sensorConfirmed, setSensorConfirmed] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [feedback, setFeedback] = useState('');

  if (user?.role !== 'student') return <p>Student access required.</p>;

  const trip = trips.find((t) => t.id === tripId && t.userId === user.id);
  if (!trip) return <p>Trip not found. <Link to={ROUTES.STUDENT.RESERVATIONS}>My Reservations</Link></p>;
  const vehicle = vehicles.find((v) => v.id === trip.vehicleId);
  if (trip.status === 'completed') {
    return <Card><h1 className="font-heading text-2xl font-semibold">Vehicle Returned Successfully</h1>
      <p className="mt-2 text-text-secondary">Returned at {trip.returnHubId}; {vehicle?.label} is {vehicle?.status}.</p>
      <Link className="mt-4 inline-block text-brand-primary" to={ROUTES.STUDENT.RESERVATIONS}>View Reservations</Link>
    </Card>;
  }

  const selectedHub = hubs.find((h) => h.id === hubId);
  const selectedCapacity = selectedHub ? canHubAcceptSharedVehicle({ hubs, vehicles }, selectedHub.id) : null;
  const performReturn = () => {
    const result = confirmVehicleReturn({
      tripId: trip.id, userId: user.id, returnHubId: hubId,
      sensorConfirmed, observedBatteryPercent: battery.trim() ? Number(battery) : Number.NaN, issueDetected: issue,
    });
    setFeedback(result.message);
    if (result.ok) setShowDialog(false);
  };

  return <div className="space-y-5">
    <header><h1 className="font-heading text-3xl font-semibold text-text-primary">Return Vehicle</h1>
      <p className="text-text-secondary">Select an available Mobility Hub and confirm simulated docking.</p></header>
    <Card><div className="flex items-center justify-between gap-3">
        <div><p className="text-sm text-text-muted">Current Vehicle</p>
          <p className="font-semibold text-text-primary">{vehicle?.label ?? trip.vehicleId}</p></div>
        <StatusBadge variant="warning">Session active</StatusBadge>
      </div></Card>
    <section className="space-y-3"><h2 className="font-heading text-xl font-semibold">Select Return Hub</h2>
      <div className="grid gap-3 md:grid-cols-2">
        {hubs.map((hub) => {
          const availability = canHubAcceptSharedVehicle({ hubs, vehicles }, hub.id);
          return <Card key={hub.id} className={hubId === hub.id ? 'border-brand-primary' : ''}>
            <h3 className="font-semibold">{hub.name}</h3>
            <p className="mb-3 text-sm text-text-secondary">{availability.reason}</p>
            <Button variant="secondary" disabled={!availability.available} onClick={() => setHubId(hub.id)}>
              {hubId === hub.id ? 'Selected Hub' : 'Select Hub'}
            </Button>
          </Card>;
        })}
      </div>
    </section>
    <Card><h2 className="font-semibold">Simulation controls (development only)</h2>
      <p className="mb-3 text-sm text-text-secondary">These checkboxes simulate hardware telemetry; no real docking sensor is connected.</p>
      <label className="block text-sm">Observed battery level (%)</label>
      <Input type="number" min={0} max={100} value={battery} onChange={(e) => setBattery(e.target.value)} className="max-w-40" />
      <label className="mt-3 flex gap-2 text-sm"><input type="checkbox" checked={sensorConfirmed} onChange={(e) => setSensorConfirmed(e.target.checked)} />Simulated sensor confirms vehicle is docked</label>
      <label className="mt-2 flex gap-2 text-sm"><input type="checkbox" checked={issue} onChange={(e) => setIssue(e.target.checked)} />Vehicle issue detected on return</label>
    </Card>
    {feedback && <Banner variant="danger" title="Return not completed" description={feedback} />}
    <div className="flex flex-wrap gap-3"><Button disabled={!hubId || !selectedCapacity?.available} onClick={() => setShowDialog(true)}>Confirm Return</Button>
      <Button variant="secondary" onClick={() => { setHubId(''); setFeedback(''); }}>Choose Another Hub</Button>
      <Link className="self-center text-brand-primary" to={ROUTES.STUDENT.RESERVATIONS}>Back to My Reservations</Link></div>
    <Dialog open={showDialog} onClose={() => setShowDialog(false)} title="Confirm Vehicle Return"
      footer={<><Button variant="secondary" onClick={() => setShowDialog(false)}>Cancel</Button><Button onClick={performReturn}>Confirm Return</Button></>}>
      <p>Return {vehicle?.label} to {selectedHub?.name}? Completion requires simulated sensor confirmation.</p>
    </Dialog>
  </div>;
}
