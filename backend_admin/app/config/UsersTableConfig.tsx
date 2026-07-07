import { Column } from '@/components/table/DataTableWithColumnSearch';
import { Edit, Trash } from 'lucide-react';
import { User } from '../data/users';

export const userColumns = (
  router: any,
  handleDelete: (id: number) => void
): Column<User>[] => [
  { key: 'name', label: 'Name', sortable: true, grid: 2  },
  { key: 'email', label: 'Email', sortable: true, grid: 2   },
  { key: 'role', label: 'Role', sortable: true, grid: 2   },
  {
    key: 'status',
    label: 'Status',
    grid: 2,
    exactMatch: true,
    filterComponent: (value, onChange) => (
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-400">
        <option value="">All</option>
        <option value="Active">Active</option>
        <option value="Inactive">Inactive</option>
      </select>
    ),
    render: (user) => (
      <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            user.status === 'Active'
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {user.status}
        </span>
    ),
  },
  {
    key: 'actions',
    label: 'Actions',
    grid: 2,
    position: 'right',
    actions: [
      {
        icon: Edit,
        tooltip: 'Edit',
        showIf: (u) => u.role === 'Admin',
        onClick: (u) => router.push(`/module/users/${u.id}`),
      },
      {
        icon: Trash,
        iconPosition: 'right',
        variant: 'danger',
        tooltip: 'Delete',
        showIf: (u) => u.status === 'Inactive',
        onClick: (u) => handleDelete(u.id),
      },
    ],
  },
];

