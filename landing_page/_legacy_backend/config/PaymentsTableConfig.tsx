import { Column } from '@/components/table/DataTableWithColumnSearch';
import { Edit, Trash, Eye, SquareCheckBig } from 'lucide-react';
import { Payment } from '../data/payments';
import Badge from '@/components/badge/Badge';

// Type-safe variant mapping
type BadgeVariant = 'default' | 'success' | 'danger' | 'warning' | 'info' | 'outline';

export const statusBadge = (status: string): { label: string; variant: BadgeVariant } => {
  const map: Record<string, { label: string; variant: BadgeVariant }> = {
    'PENDING APPROVAL': { label: 'Pending Approval', variant: 'warning' },
    'PENDING POSTING': { label: 'Pending Posting', variant: 'info' },
    COMPLETED: { label: 'Completed', variant: 'success' },
    REJECTED: { label: 'Rejected', variant: 'danger' },
    // add more statuses here
  };

  return map[status] ?? { label: status, variant: 'default' };
};

export const allColumns = (
  router: any,
  handleDelete: (id: string) => void,
  handleUpdate: (id: string) => void
): Column<Payment>[] => [
  { key: 'rowNum', label: 'No.', sortable: true, grid: 0.5 },
  { key: 'docno', label: 'Receipt No', sortable: true, grid: 1.5 },
  { key: 'customer_code', label: 'Account No.', sortable: true, grid: 1 },
  { key: 'customer_name', label: 'Customer Name', sortable: true, grid: 3 },
  { key: 'bill_reference', label: 'Bill Reference', grid: 3, position: 'left' },
  { 
    key: 'docdate', 
    label: 'Payment Date', 
    sortable: true, 
    grid: 1, 
    position: 'left', 
    render: (row) => {
      const raw = row?.docdate ?? '';
      if (!raw) return '';
      const d = new Date(raw);
      if (isNaN(d.getTime())) return String(raw);
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${yyyy}-${mm}-${dd}`;
    }
  },
  { key: 'amount', label: 'Amount (RM)', grid: 1, position: 'right' },
  { 
    key: 'status', 
    label: 'Status', 
    grid: 1.5, 
    exactMatch: true,
    filterComponent: (value, onChange) => (
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-400">
        <option value="">All</option>
        <option value="PENDING APPROVAL">Pending Approval</option>
        <option value="PENDING POSTING">Pending Posting</option>
        <option value="COMPLETED">Completed</option>
      </select>
    ),
    render: (row) => {
      const { label, variant } = statusBadge(row.status);
      return <Badge variant={variant} size="sm">{label}</Badge>;
    },
  },
  {
    key: 'actions',
    label: 'Action',
    grid: 1,
    position: 'right',
    actions: [
      {
        icon: Eye,
        tooltip: 'View',
        onClick: (a) => {
          const base =
            a.status === 'COMPLETED'
              ? '/module/payments/completed'
              : '/module/payments/pending';

          router.push(`${base}/${a.dockey}?mode=view`);
        },
      },
      {
        icon: SquareCheckBig,
        tooltip: 'Confirmed Payment',
        showIf: (row) => row.status === 'PENDING APPROVAL',
      },
      {
        icon: SquareCheckBig,
        tooltip: 'Confirmed Posted',
        showIf: (row) => row.status === 'PENDING POSTING',
        onClick: (p) => {
          if (confirm(`Are you sure you want to update this payment as COMPLETED?`)) {
            handleUpdate(p.dockey);
          }
        }
      },
      {
        icon: Edit,
        tooltip: 'Edit',
        showIf: (row) => row.status === 'PENDING POSTING' || row.status === 'PENDING APPROVAL',
        onClick: (p) => router.push(`/module/payments/pending/${p.dockey}?mode=edit`),
      },
      {
        icon: Trash,
        tooltip: 'Delete',
        variant: 'danger',
        showIf: (row) => row.status === 'PENDING POSTING' || row.status === 'PENDING APPROVAL',
        onClick: (p) => {
          if (confirm(`Are you sure you want to delete payment?`)) {
            handleDelete(p.dockey);
          }
        }
      },
    ],
  },
];

export const pendingColumns = (
  router: any, 
  handleDelete: (id: string) => void,
  handleUpdate: (id: string) => void
): Column<Payment>[] => [
  { key: 'rowNum', label: 'No.', sortable: true, grid: 0.5 },
  { key: 'reference_no', label: 'Reference No.', sortable: true, grid: 1.5 },
  { key: 'customer_code', label: 'Account No.', sortable: true, grid: 1.5 },
  { key: 'customer_name', label: 'Customer Name', sortable: true, grid: 2 },
  { key: 'bill_reference', label: 'Bill Reference', grid: 3, position: 'left' },
  { 
    key: 'docdate', 
    label: 'Payment Date', 
    sortable: true, 
    grid: 1, 
    position: 'left',
    render: (row) => {
      const raw = row?.docdate ?? '';
      if (!raw) return '';
      const d = new Date(raw);
      if (isNaN(d.getTime())) return String(raw);
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${yyyy}-${mm}-${dd}`;
    }
  },
  { key: 'amount', label: 'Amount (RM)', grid: 1, position: 'right' },
  { 
    key: 'status', 
    label: 'Status', 
    grid: 1.5,
    filterComponent: (value, onChange) => (
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-400">
        <option value="">All</option>
        <option value="PENDING APPROVAL">Pending Approval</option>
        <option value="PENDING POSTING">Pending Posting</option>
      </select>
    ),
    render: (row) => {
      const { label, variant } = statusBadge(row.status);
      return <Badge variant={variant} size="sm">{label}</Badge>;
    },
  },
  {
    key: 'actions',
    label: 'Action',
    grid: 4,
    position: 'right',
    actions: [
      {
        icon: Eye,
        tooltip: 'View',
        onClick: (p) => router.push(`/module/payments/pending/${p.dockey}?mode=view`),
      },
      {
        icon: SquareCheckBig,
        tooltip: 'Confirmed Payment',
        showIf: (row) => row.status === 'PENDING APPROVAL',
      },
      {
        icon: SquareCheckBig,
        tooltip: 'Confirmed Posted',
        showIf: (row) => row.status === 'PENDING POSTING',
        onClick: (p) => {
          if (confirm(`Are you sure you want to update this payment as COMPLETED?`)) {
            handleUpdate(p.dockey);
          }
        }
      },
      {
        icon: Edit,
        tooltip: 'Edit',
        onClick: (p) => router.push(`/module/payments/pending/${p.dockey}?mode=edit`),
      },
      {
        icon: Trash,
        tooltip: 'Delete',
        variant: 'danger',
        onClick: (p) => {
          if (confirm(`Are you sure you want to delete payment?`)) {
            handleDelete(p.dockey);
          }
        }
      },
    ],
  },
];

export const completedColumns = (
  router: any,
  // handleDelete: (id: number) => void
): Column<Payment>[] => [
  { key: 'rowNum', label: 'No.', sortable: true, grid: 0.5 },
  { key: 'docno', label: 'Receipt No', sortable: true, grid: 1.5 },
  { key: 'customer_code', label: 'Account No.', sortable: true, grid: 1.5 },
  { key: 'customer_name', label: 'Customer Name', sortable: true, grid: 3 },
  { key: 'bill_reference', label: 'Bill Reference', grid: 3, position: 'left' },
  { 
    key: 'docdate', 
    label: 'Payment Date', 
    sortable: true, 
    grid: 1.5, 
    position: 'left',
    render: (row) => {
      const raw = row?.docdate ?? '';
      if (!raw) return '';
      const d = new Date(raw);
      if (isNaN(d.getTime())) return String(raw);
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${yyyy}-${mm}-${dd}`;
    }
  },
  { key: 'amount', label: 'Amount (RM)', grid: 1, position: 'right' },
  {
    key: 'actions',
    label: 'Action',
    grid: 1,
    position: 'right',
    actions: [
      {
        icon: Eye,
        tooltip: 'View',
        onClick: (c) => router.push(`/module/payments/completed/${c.dockey}?mode=view`),
      },
    ],
  },
];
