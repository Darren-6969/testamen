import { Column } from '@/components/table/DataTableWithColumnSearch';
import { Eye, Trash } from 'lucide-react';
import { Activation } from '../data/activation';

export const activationColumns = (
  router: any,
  handleDelete: (id: number) => void
): Column<Activation>[] => [
  {
    key: 'customer',
    label: 'Customer Name',
    sortable: true,
    grid: 3,
  },
  {
    key: 'package',
    label: 'Package Name',
    sortable: true,
    grid: 3,
  },
  {
    key: 'status',
    label: 'Installation Status',
    sortable: true,
    grid: 2,
    render: (row) => (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold ${
          row.status === 'Completed'
            ? 'bg-green-100 text-green-700'
            : 'bg-yellow-100 text-yellow-700'
        }`}
      >
        {row.status}
      </span>
    ),
  },
  {
    key: 'staff',
    label: 'Technician Name',
    grid: 2,
    render: (row) => (
      <span>{row.status === 'Completed' ? row.staff : ''}</span>
    ),
  },
  {
    key: 'actions',
    label: 'Actions',
    grid: 1,
    actions: [
      {
        icon: Eye,
        tooltip: 'View Details',
        onClick: (row) => router.push(`/module/activation/edit?id=${row.id}`),
      },
      {
  icon: Trash,
  tooltip: 'Delete',
  iconColor: '#c3195d',
  onClick: (u) => handleDelete(u.id),
},
    ],
  },
];
