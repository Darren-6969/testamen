// app/config/IncidentTableConfig.tsx

import { Column } from '@/components/table/DataTableWithColumnSearch';
import { useRouter } from 'next/navigation';
import { Eye, Edit, Trash } from 'lucide-react';

export interface Incident {
  id: number;
  title: string | null;
  description?: string | null;
  victim?: string | null;
  date_of_incident: string | null;
  time?: string | null;
  casualty_count: number | string | null;
  location: string | null;
  status?: string | null;
  reference_link: string | null;
  message_count: number;
}

const formatDate = (value: string | null) => {
  if (!value) return '-';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('en-MY', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

export const incidentColumns = (
  router: ReturnType<typeof useRouter>,
  handleDelete: (id: number) => void,
  handleView: (id: number) => void
): Column<Incident>[] => [
  {
    key: 'id',
    label: 'NO',
    width: '70px',
    searchable: false,
    sortable: true,
  },
  {
    key: 'title',
    label: 'TITLE',
    width: '220px',
    sortable: true,
    render: (row) => row.title || '-',
  },
  {
    key: 'date_of_incident',
    label: 'DATE OF INCIDENT',
    width: '170px',
    sortable: true,
    render: (row) => formatDate(row.date_of_incident),
  },
  {
    key: 'casualty_count',
    label: 'NO. OF CASUALTY',
    width: '160px',
    searchable: false,
    sortable: true,
    render: (row) => row.casualty_count ?? '-',
  },
  {
    key: 'location',
    label: 'LOCATION',
    width: '180px',
    sortable: true,
    render: (row) => row.location || '-',
  },
  {
    key: 'reference_link',
    label: 'REFERENCE LINK',
    width: '190px',
    searchable: false,
    sortable: true,
    render: (row) =>
      row.reference_link ? (
        <a
          href={row.reference_link}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-blue-600 hover:underline"
        >
          Open Link
        </a>
      ) : (
        <span className="text-gray-400">No Link</span>
      ),
  },
  {
    key: 'message_count',
    label: 'NO. OF MESSAGE',
    width: '160px',
    searchable: false,
    sortable: true,
    render: (row) => row.message_count ?? 0,
  },
  {
    key: 'action',
    label: 'ACTION',
    width: '150px',
    searchable: false,
    sortable: false,
    position: 'right',
    actions: [
      {
        icon: Eye,
        variant: 'primary',
        tooltip: 'View Incident',
        onClick: (row) => handleView(row.id),
      },
      {
        icon: Edit,
        variant: 'outline',
        tooltip: 'Edit Incident',
        onClick: (row) => router.push(`/module/incident/edit/${row.id}`),
      },
      {
        icon: Trash,
        variant: 'danger',
        tooltip: 'Delete Incident',
        onClick: (row) => {
          const confirmed = window.confirm(
            'Are you sure you want to delete this incident?'
          );

          if (confirmed) {
            handleDelete(row.id);
          }
        },
      },
    ],
  },
];