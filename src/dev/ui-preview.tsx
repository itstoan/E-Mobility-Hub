import { useState } from 'react';
import type { ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';

// Import trực tiếp để không phụ thuộc vào src/components/ui/index.ts.
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { DateTimeInput } from '../components/ui/DateTimeInput';
import { Textarea } from '../components/ui/Textarea';
import { Dialog } from '../components/ui/Dialog';
import { FormField } from '../components/ui/FormField';
import { Card } from '../components/ui/Card';
import { StatusBadge } from '../components/ui/StatusBadge';
import { MetricCard } from '../components/ui/MetricCard';
import { Table } from '../components/ui/Table';
import type { TableColumn } from '../components/ui/Table';

const HUB_OPTIONS = [
  { value: 'hub-a', label: 'Campus Mobility Hub A' },
  { value: 'hub-b', label: 'Campus Mobility Hub B' },
  { value: 'hub-c', label: 'Campus Mobility Hub C', disabled: true },
];

export function PreviewSection({
  title,
  description,
  children,}: {
  title: string;
  description?: string;
  children: ReactNode;}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      {description && (
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      )}
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  );
}

export function PreviewItem({
  title,
  children,}: {
  title: string;
  children: ReactNode;}) {
  return (
    <div className="min-w-0 space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {title}
      </p>
      {children}
    </div>
  );
}

export function UIPreview() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [vehicleName, setVehicleName] = useState('Personal E-Bike');
  const [hub, setHub] = useState('hub-a');
  const [notes, setNotes] = useState('Vehicle inspected. No issue found.');
  const previewHubs = [
  { id: 'hub-001', name: 'Campus Hub A', location: 'District 1', connectionStatus: 'online', capacity: 24 },
  { id: 'hub-002', name: 'Campus Hub B', location: 'District 3', connectionStatus: 'disconnected', capacity: 18 },
];

const hubColumns: TableColumn<(typeof previewHubs)[number]>[] = [
  { key: 'name', header: 'Hub Name' },
  { key: 'location', header: 'Location' },
  { key: 'connectionStatus', header: 'Connection Status', render: (hub) => <StatusBadge variant={hub.connectionStatus === 'online' ? 'success' : 'danger'}>{hub.connectionStatus}</StatusBadge> },
  { key: 'capacity', header: 'Vehicle Capacity' },
];

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 font-sans text-slate-900 sm:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="space-y-2">
          <p className="text-sm font-medium text-teal-700">
            Smart E-Mobility Hub / Phase 3 / Member B
          </p>
          <h1 className="text-3xl font-bold tracking-tight">UI Components Preview</h1>
          <p className="max-w-3xl text-sm text-slate-600">
            Chỉ kiểm tra hình dạng, font, màu, kích thước và trạng thái của
            shared components. Khung trắng/xám bên ngoài là bố cục trang preview,
            không phải Layout chính thức trong Figma.
          </p>
        </header>

        <PreviewSection
          title="01. Typography reference"
          description="Dùng để so sánh font-family, font-size và font-weight đang áp dụng."
        >
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Heading 1 — Smart E-Mobility Hub</h1>
            <h2 className="text-2xl font-semibold">Heading 2 — Charging Request</h2>
            <h3 className="text-lg font-semibold">Heading 3 — Vehicle Details</h3>
            <p className="text-base">Body text — The quick brown fox jumps over the lazy dog. 0123456789</p>
            <p className="text-sm text-slate-600">Small text — Request status and supporting description.</p>
          </div>
        </PreviewSection>

        <PreviewSection
          title="02. Button"
          description="So sánh nền, màu chữ, viền, bo góc, chiều cao, khoảng đệm, hover và focus."
        >
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary">Primary / Submit</Button>
            <Button variant="secondary">Secondary / Cancel</Button>
            <Button variant="danger">Danger / Reject</Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button disabled>Disabled</Button>
            <Button isLoading>Loading</Button>
            <Button variant="secondary" disabled>Disabled secondary</Button>
          </div>
        </PreviewSection>

        <PreviewSection
          title="03. Input"
          description="Các trường text, email, password; trạng thái thường, có dữ liệu, lỗi và disabled."
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <PreviewItem title="Default / Placeholder">
              <Input aria-label="Vehicle ID" placeholder="Enter vehicle ID..." />
            </PreviewItem>
            <PreviewItem title="Filled / Controlled">
              <Input
                aria-label="Vehicle label"
                value={vehicleName}
                onChange={(event) => setVehicleName(event.target.value)}
              />
            </PreviewItem>
            <PreviewItem title="Email">
              <Input aria-label="Email" type="email" placeholder="student@example.edu" />
            </PreviewItem>
            <PreviewItem title="Password">
              <Input aria-label="Password" type="password" defaultValue="password123" />
            </PreviewItem>
            <PreviewItem title="Invalid">
              <Input aria-label="Invalid vehicle ID" invalid defaultValue="Wrong vehicle ID" />
            </PreviewItem>
            <PreviewItem title="Disabled">
              <Input aria-label="Disabled input" disabled defaultValue="Not editable" />
            </PreviewItem>
          </div>
        </PreviewSection>

        <PreviewSection
          title="04. Select"
          description="Native select: so sánh chiều cao, mũi tên, viền và menu khi click."
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <PreviewItem title="Placeholder / Unselected">
              <Select aria-label="Choose a hub" options={HUB_OPTIONS} placeholder="Select a mobility hub" defaultValue="" />
            </PreviewItem>
            <PreviewItem title="Selected / Controlled">
              <Select
                aria-label="Selected hub"
                options={HUB_OPTIONS}
                value={hub}
                onChange={(event) => setHub(event.target.value)}
              />
            </PreviewItem>
            <PreviewItem title="Invalid">
              <Select aria-label="Invalid hub" options={HUB_OPTIONS} placeholder="Choose a hub" defaultValue="" invalid />
            </PreviewItem>
            <PreviewItem title="Disabled">
              <Select aria-label="Disabled hub" options={HUB_OPTIONS} defaultValue="hub-a" disabled />
            </PreviewItem>
          </div>
        </PreviewSection>

        <PreviewSection
          title="05. DateTimeInput"
          description="UC06 dùng date và hai time riêng; datetime-local là kiểu hỗ trợ thêm."
        >
          <div className="grid gap-5 sm:grid-cols-3">
            <PreviewItem title="Date">
              <DateTimeInput aria-label="Desired date" mode="date" defaultValue="2026-11-24" />
            </PreviewItem>
            <PreviewItem title="Start time">
              <DateTimeInput aria-label="Start time" mode="time" defaultValue="09:00" />
            </PreviewItem>
            <PreviewItem title="End time">
              <DateTimeInput aria-label="End time" mode="time" defaultValue="10:30" />
            </PreviewItem>
            <PreviewItem title="Datetime-local">
              <DateTimeInput aria-label="Date and time" mode="datetime-local" defaultValue="2026-11-24T09:00" />
            </PreviewItem>
            <PreviewItem title="Invalid date">
              <DateTimeInput aria-label="Invalid date" mode="date" invalid />
            </PreviewItem>
            <PreviewItem title="Disabled time">
              <DateTimeInput aria-label="Disabled time" mode="time" defaultValue="09:00" disabled />
            </PreviewItem>
          </div>
        </PreviewSection>

        <PreviewSection
          title="06. Textarea"
          description="Dùng cho Handling notes hoặc Proposed resolution ở UC10."
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <PreviewItem title="Default / Editable">
              <Textarea
                aria-label="Handling notes"
                rows={4}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </PreviewItem>
            <PreviewItem title="Invalid">
              <Textarea aria-label="Invalid notes" rows={4} invalid placeholder="Required notes are missing..." />
            </PreviewItem>
            <PreviewItem title="Placeholder">
              <Textarea aria-label="Proposed resolution" rows={3} placeholder="Describe the proposed resolution..." />
            </PreviewItem>
            <PreviewItem title="Disabled">
              <Textarea aria-label="Disabled notes" rows={3} disabled defaultValue="Read-only preview" />
            </PreviewItem>
          </div>
        </PreviewSection>

        <PreviewSection
          title="07. FormField"
          description="Kiểm tra label, dấu required, hint, error và khoảng cách dọc."
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              id="preview-personal-vehicle"
              label="Personal vehicle"
              hint="Enter the name shown on your vehicle."
              required
            >
              <Input id="preview-personal-vehicle" placeholder="e.g. E-Bike A" aria-describedby="preview-personal-vehicle-hint" />
            </FormField>
            <FormField
              id="preview-request-id"
              label="Request ID"
              error="Request ID is required."
              required
            >
              <Input id="preview-request-id" invalid placeholder="Enter request ID" aria-describedby="preview-request-id-error" />
            </FormField>
            <FormField id="preview-incident-notes" label="Handling notes" hint="Optional note for the operator.">
              <Textarea id="preview-incident-notes" rows={3} placeholder="Describe the incident..." aria-describedby="preview-incident-notes-hint" />
            </FormField>
            <FormField id="preview-hub-select" label="Mobility hub" required>
              <Select id="preview-hub-select" options={HUB_OPTIONS} placeholder="Select a mobility hub" defaultValue="" />
            </FormField>
          </div>
        </PreviewSection>

        <PreviewSection
          title="08. Dialog"
          description="Click mở popup để kiểm tra chiều rộng, overlay, font, padding và footer. Thử phím Escape."
        >
          <Button onClick={() => setDialogOpen(true)}>Open confirmation dialog</Button>
          <Dialog
            open={dialogOpen}
            onClose={() => setDialogOpen(false)}
            title="Confirm Action"
            footer={
              <>
                <Button variant="secondary" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={() => setDialogOpen(false)}>Confirm</Button>
              </>
            }
          >
            <p className="text-sm leading-6 text-slate-600">
              This is a visual preview of the shared Dialog component. No
              reservation, charging request, or incident is updated.
            </p>
          </Dialog>
        </PreviewSection>
                <PreviewSection
          title="09. Card"
          description="Kiểm tra nền, đường viền, bo góc và padding của Card."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <h3 className="font-semibold text-slate-900">
                Mobility Hub A
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                District 1
              </p>
            </Card>

            <Card className="border-teal-200">
              <h3 className="font-semibold text-slate-900">
                Charging Overview
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Card with custom className.
              </p>
            </Card>
          </div>
        </PreviewSection>

        <PreviewSection
          title="10. StatusBadge"
          description="Kiểm tra năm variants và khả năng hiển thị nội dung trạng thái."
        >
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge variant="success">Online</StatusBadge>
            <StatusBadge variant="warning">Pending</StatusBadge>
            <StatusBadge variant="danger">Disconnected</StatusBadge>
            <StatusBadge variant="info">Scheduled</StatusBadge>
            <StatusBadge variant="neutral">Unknown</StatusBadge>
          </div>
        </PreviewSection>

        <PreviewSection
          title="11. MetricCard"
          description="Kiểm tra title, value và description."
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <MetricCard
              title="Total Hubs"
              value={24}
              description="Across the network"
            />

            <MetricCard
              title="Connected Hubs"
              value="20 / 24"
              description="Current connection status"
            />

            <MetricCard
              title="Network Availability"
              value="83.3%"
              description="Illustrative preview value"
            />
          </div>
        </PreviewSection>

        <PreviewSection
          title="12. Table"
          description="Kiểm tra header, dữ liệu, custom cell rendering, empty state và cuộn ngang."
        >
          <div className="space-y-5">
            <PreviewItem title="Table with data">
              <Table
                columns={hubColumns}
                data={previewHubs}
                getRowKey={(hub) => hub.id}
              />
            </PreviewItem>

            <PreviewItem title="Empty state">
              <Table
                columns={hubColumns}
                data={[]}
                getRowKey={(hub) => hub.id}
                emptyMessage="No mobility hubs found."
              />
            </PreviewItem>
          </div>
        </PreviewSection>

        <footer className="border-t border-slate-200 pt-4 text-xs text-slate-500">
          Preview only
        </footer>
      </div>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<UIPreview />);
