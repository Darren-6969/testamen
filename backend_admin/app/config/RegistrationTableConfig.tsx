import { Column } from '@/components/table/DataTableWithColumnSearch';
import { Eye, Trash } from 'lucide-react';
import { Registration } from '../types';

const formatDate = (value: string | null) => {
  if (!value) return '-';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('en-MY', {
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
  });
};

export const registrationTableColumns = (
  handleView: (row: Registration) => void,
  handleDelete: (row: Registration) => void
): Column<Registration>[] => [
  {
    key: 'id',
    label: 'NO',
    position: 'middle',
    searchable: false,
    sortable: true,
    sortFn: (a, b) => (a.id ?? 0) - (b.id ?? 0),
    render: (row) => row.id ?? '-',
  },

  {
    key: 'registration_date',
    label: 'REGISTRATION DATE',
    position: 'middle',
    searchable: false,
    sortable: true,
    sortFn: (a, b) =>
      new Date(a.registration_date ?? 0).getTime() -
      new Date(b.registration_date ?? 0).getTime(),
    render: (row) => formatDate(row.registration_date),
  },

  {
    key: 'code_no',
    label: 'CODE NO.',
    position: 'middle',
    sortable: true,
    sortFn: (a, b) =>
      (a.code_no ?? '').localeCompare(b.code_no ?? ''),
    render: (row) => row.code_no || '-',
  },

  {
    key: 'username',
    label: 'USERNAME',
    position: 'middle',
    sortable: true,
    sortFn: (a, b) =>
      (a.username ?? '').localeCompare(b.username ?? ''),
    render: (row) => row.username || '-',
  },

  {
    key: 'registered_accounts',
    label: 'REGISTERED ACCOUNT(S)',
    position: 'middle',
    sortable: true,
    sortFn: (a, b) =>
      (a.registered_accounts ?? 0) - (b.registered_accounts ?? 0),
    render: (row) => row.registered_accounts ?? 0,
  },

  {
    key: 'contact',
    label: 'CONTACT',
    position: 'middle',
    sortable: true,
    sortFn: (a, b) =>
      (a.contact ?? '').localeCompare(b.contact ?? ''),
    render: (row) => row.contact || '-',
  },

  {
    key: 'email',
    label: 'EMAIL',
    position: 'middle',
    sortable: true,
    sortFn: (a, b) =>
      (a.email ?? '').localeCompare(b.email ?? ''),
    render: (row) => row.email || '-',
  },

  {
    key: 'status',
    label: 'STATUS',
    position: 'middle',
    sortable: true,
    sortFn: (a, b) => {
      const order: Record<string, number> = {
        Active: 1,
        Pending: 2,
        Inactive: 3,
      };

      return (order[a.status] ?? 99) - (order[b.status] ?? 99);
    },

    render: (row) => {
      const color =
        row.status === 'Active'
          ? 'text-green-600'
          : row.status === 'Inactive'
          ? 'text-red-600'
          : 'text-yellow-600';

      return <span className={color}>{row.status}</span>;
    },
  },

  {
    key: 'action',
    label: 'ACTION',
    width: '150px',
    searchable: false,
    position: 'middle',
    sortable: false,

    render: (row) => (
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => handleView(row)}
          className="flex items-center gap-1 text-blue-600 hover:underline"
        >
          <Eye className="h-4 w-4" />
          View
        </button>

        <button
          type="button"
          onClick={() => handleDelete(row)}
          className="flex items-center gap-1 text-red-600 hover:underline"
        >
          <Trash className="h-4 w-4" />
          Delete
        </button>
      </div>
    ),

    actions: [
      {
        icon: Eye,
        variant: 'outline',
        tooltip: 'View Registration',
        onClick: (row) => handleView(row),
      },
      {
        icon: Trash,
        variant: 'danger',
        tooltip: 'Delete Registration',
        onClick: (row) => handleDelete(row),
      },
    ],
  },
];