import { Column } from '@/components/table/DataTableWithColumnSearch';
import { Shield, Trash2, Save } from 'lucide-react';

export interface UserManagement {
  id: number;
  email: string;
 role: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}

export const userColumns: Column<UserManagement>[] = [
  {
    key: 'id',
    label: 'ID',
  },

  {
    key: 'email',
    label: 'Email',
  },

  {
    key: 'role',
    label: 'Role',
    render: (row) => (
      <div className="flex items-center gap-2">
        <Shield className="w-4 h-4 text-pink-600" />
        <span>{row.role}</span>
      </div>
    ),
  },

  {
    key: 'status',
    label: 'Status',
    render: (row) => (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold ${
          row.status === 'ACTIVE'
            ? 'bg-green-100 text-green-700'
            : row.status === 'INACTIVE'
            ? 'bg-gray-100 text-gray-700'
            : 'bg-red-100 text-red-700'
        }`}
      >
        {row.status}
      </span>
    ),
  },

  {
    key: 'actions',
    label: 'Actions',
    render: () => (
      <div className="flex items-center gap-2">
        <button className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-white bg-pink-600 rounded-lg hover:bg-pink-700">
          <Save className="w-3 h-3" />
          Save
        </button>

        <button className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-white bg-red-500 rounded-lg hover:bg-red-600">
          <Trash2 className="w-3 h-3" />
          Delete
        </button>
      </div>
    ),
  },
];