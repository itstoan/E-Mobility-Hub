import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { Banner, Button, Card, FormField, StatusBadge, Textarea } from '../../../components/ui';
import { ROUTES } from '../../../routes/paths';
import { useAuthStore } from '../../../stores/useAuthStore';
import { useMobilityDataStore } from '../../../stores/useMobilityDataStore';

export function IncidentDetailsPage() {
  const { incidentId } = useParams<{ incidentId: string }>();
  const user = useAuthStore((s) => s.currentUser);
  const incidents = useMobilityDataStore((s) => s.incidents);
  const incidentImpacts = useMobilityDataStore((s) => s.incidentImpacts);
  const confirmIncident = useMobilityDataStore((s) => s.confirmIncident);
  const closeFalseAlarm = useMobilityDataStore((s) => s.closeFalseAlarm);
  const saveIncidentHandling = useMobilityDataStore((s) => s.saveIncidentHandling);
  const reviewIncidentImpact = useMobilityDataStore((s) => s.reviewIncidentImpact);
  const resolveIncident = useMobilityDataStore((s) => s.resolveIncident);
  const [notes, setNotes] = useState('');
  const [resolution, setResolution] = useState('');
  const [verified, setVerified] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);
  if (user?.role !== 'system_operator') return <p>System Operator access required.</p>;
  const incident = incidents.find((i) => i.id === incidentId);
  if (!incident) return <p>Incident not found. <Link to={ROUTES.OPERATOR.INCIDENTS}>Back to list</Link></p>;
  const impacts = incidentImpacts.filter((i) => i.incidentId === incident.id);
  const unresolvedImpacts = impacts.filter((i) => i.status === 'pending_review');
  const run = (result: { ok: boolean; message: string }) => setFeedback(result);
  return <div className="space-y-5">
    <header><h1 className="font-heading text-3xl font-semibold">Incident Details</h1>
      <p className="text-text-secondary">{incident.id} · {incident.resourceId} · {incident.hubId}</p></header>
    <Card><div className="flex flex-wrap justify-between gap-2">
        <div><h2 className="font-semibold">{incident.resourceType} · {incident.resourceId}</h2><p className="text-sm text-text-secondary">{incident.description}</p></div>
        <StatusBadge variant={incident.status === 'resolved' ? 'success' : incident.status === 'false_alarm' ? 'neutral' : 'warning'}>{incident.status}</StatusBadge>
      </div><p className="mt-3 text-sm text-text-muted">Reported at: {new Date(incident.reportedAt).toLocaleString()}</p></Card>
    {incident.status === 'reported' && <Card><h2 className="mb-3 font-semibold">Confirmation and Status Update</h2>
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => run(confirmIncident(incident.id, user.id))}>Confirm Incident & Mark Unavailable</Button>
        <Button variant="secondary" onClick={() => run(closeFalseAlarm(incident.id, user.id))}>Close False Alarm</Button>
      </div></Card>}
    {['confirmed', 'in_progress'].includes(incident.status) && <Card><h2 className="mb-4 font-semibold">Handling Notes and Proposed Resolution</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="handling-notes" label="Handling notes" required>
          <Textarea id="handling-notes" rows={3} value={notes} placeholder={incident.handlingNotes ?? 'Record actions taken...'} onChange={(e) => setNotes(e.target.value)} />
        </FormField>
        <FormField id="proposed-resolution" label="Proposed resolution" required>
          <Textarea id="proposed-resolution" rows={3} value={resolution} placeholder={incident.proposedResolution ?? 'Propose remediation...'} onChange={(e) => setResolution(e.target.value)} />
        </FormField>
      </div><Button className="mt-4" onClick={() => run(saveIncidentHandling(incident.id, user.id, notes || incident.handlingNotes || '', resolution || incident.proposedResolution || ''))}>Save Handling Update</Button>
    </Card>}
    {impacts.length > 0 && <Card><h2 className="font-semibold">Dependent Reservations / Charging Schedules</h2>
      <p className="mt-2 text-sm text-text-secondary">Affected resources must remain blocked. Review or reschedule dependencies with UC02/UC08 before resolution.</p>
      <ul className="mt-3 space-y-2 text-sm">{impacts.map((impact) =>
        <li key={impact.id} className="flex flex-wrap items-center gap-2">
          <span>{impact.affectedType} {impact.affectedId}: <strong>{impact.status}</strong></span>
          {impact.status === 'pending_review' &&
            <Button variant="secondary" onClick={() => run(reviewIncidentImpact(impact.id, user.id))}>Recheck dependency</Button>}
        </li>)}</ul>
      <p className="mt-2 text-xs text-text-secondary">Recheck works only after the affected reservation or charging schedule has been handled by UC02/03 or UC08.</p>
    </Card>}
    {incident.status === 'in_progress' && <Card><h2 className="font-semibold">Complete Incident Resolution</h2>
      <label className="my-3 flex gap-2 text-sm"><input type="checkbox" checked={verified} onChange={(e) => setVerified(e.target.checked)}/>Simulated operator verification: repair complete</label>
      <Button disabled={!verified || unresolvedImpacts.length > 0} onClick={() => run(resolveIncident(incident.id, user.id, verified))}>Complete Resolution</Button>
      {unresolvedImpacts.length > 0 && <p className="mt-3 text-sm text-status-warning-text">Blocked: {unresolvedImpacts.length} affected reservation(s)/schedule(s) pending review.</p>}
    </Card>}
    {feedback && <Banner variant={feedback.ok ? 'success' : 'danger'} title={feedback.ok ? 'Update saved' : 'Action blocked'} description={feedback.message} />}
    <Link className="inline-block text-brand-primary underline" to={ROUTES.OPERATOR.INCIDENTS}>Back to Incident List</Link>
  </div>;
}
