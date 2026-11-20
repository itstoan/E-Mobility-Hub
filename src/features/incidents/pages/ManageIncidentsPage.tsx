import { Link } from 'react-router';
import { Card, StatusBadge, Table } from '../../../components/ui';
import type { TableColumn } from '../../../components/ui/Table';
import type { Incident } from '../../../types/domain';
import { ROUTES } from '../../../routes/paths';
import { useMobilityDataStore } from '../../../stores/useMobilityDataStore';

const statusVariant = (status: Incident['status']) =>
  status === 'resolved' ? 'success' as const :
    status === 'false_alarm' ? 'neutral' as const :
      status === 'in_progress' ? 'warning' as const :
        status === 'reported' ? 'danger' as const : 'warning' as const;

const columns: TableColumn<Incident>[] = [
  { key: 'id', header: 'Incident ID' },
  { key: 'hubId', header: 'Hub' },
  { key: 'resourceType', header: 'Resource' },
  { key: 'resourceId', header: 'Resource ID' },
  { key: 'status', header: 'Status', render: (incident) => <StatusBadge variant={statusVariant(incident.status)}>{incident.status}</StatusBadge> },
  { key: 'reportedAt', header: 'Action', render: (incident) =>
    <Link className="font-medium text-brand-primary underline" to={ROUTES.OPERATOR.INCIDENT_DETAILS(incident.id)}>Details</Link> },
];

export function ManageIncidentsPage() {
  const incidents = useMobilityDataStore((s) => s.incidents);
  return <div className="space-y-5">
    <header><h1 className="font-heading text-3xl font-semibold">Manage Incidents</h1>
      <p className="text-text-secondary">Recorded incidents and operational status.</p></header>
    <Card><p className="mb-4 text-sm text-text-secondary">Open each incident to confirm, record handling, or review affected resources.</p>
      <Table columns={columns} data={incidents} getRowKey={(incident) => incident.id} emptyMessage="No recorded incidents." /></Card>
  </div>;
}
