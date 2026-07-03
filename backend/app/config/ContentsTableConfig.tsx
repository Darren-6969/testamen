import { Column } from '@/components/table/DataTableWithColumnSearch';
import { Edit, Trash } from 'lucide-react';
import { Content } from '../data/contents';

// Helper: format any DB date into "Jan 25, 2021"
const formatDate = (raw: string | Date | null | undefined): string => {
  if (!raw) return '';

  let d: Date | null = null;

  if (raw instanceof Date) {
    d = raw;
  } else if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return '';
    // handle "2025-11-23T00:00:00.000Z" → take part before "T"
    const base = trimmed.split('T')[0];
    d = new Date(base);
  }

  if (!d || isNaN(d.getTime())) return '';

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const yyyy = d.getFullYear();
  const mmName = months[d.getMonth()];
  const dd = String(d.getDate()).padStart(2, '0');

  return `${mmName} ${dd}, ${yyyy}`;
};

export const contentColumns = (
  router: any,
  handleDelete: (id: number) => void
): Column<Content>[] => [
  {
    key: 'name',
    label: 'Name',
    sortable: true,
    grid: 2,
  },
  {
    key: 'type',
    label: 'Type',
    sortable: true,
    grid: 2,
  },
  {
    key: 'start_date',
    label: 'Start Date',
    sortable: true,
    grid: 2,
    render: (content) => formatDate(content.start_date as any),
  },
  {
    key: 'end_date',
    label: 'End Date',
    sortable: true,
    grid: 2,
    render: (content) => formatDate(content.end_date as any),
  },
  {
    key: 'display_status',
    label: 'Display Status',
    grid: 2,
    exactMatch: true,
    filterComponent: (value, onChange) => (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
      >
        <option value="">All</option>
        <option value="SHOW">SHOW</option>
        <option value="HIDE">HIDE</option>
      </select>
    ),
    render: (content) => (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold ${
          content.display_status === 'SHOW'
            ? 'bg-green-100 text-green-700'
            : 'bg-gray-200 text-gray-700'
        }`}
      >
        {content.display_status}
      </span>
    ),
  },
  {
    key: 'actions',
    label: 'Actions',
    grid: 2,
    actions: [
      {
        icon: Edit,
        tooltip: 'Edit',
        onClick: (c) => router.push(`/module/content/edit?id=${c.id}`),
      },
      {
        icon: Trash,
        iconPosition: 'right',
        variant: 'outline',
        tooltip: 'Delete',
        showIf: (c) => c.status === 'ACTIVE',
        onClick: (c) => handleDelete(c.id),
      },
    ],
  },
];

