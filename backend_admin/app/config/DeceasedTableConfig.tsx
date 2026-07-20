import { Column } from '@/components/table/DataTableWithColumnSearch';
import { Pencil, Trash } from 'lucide-react';

export interface Deceased {
  id: number;
  register_date: string;
  memorial_name: string;
  gender: string;
  registered_account: string;
  status?: string;
  show: boolean;
}

export const deceasedColumns = (
  handleEdit: (id: number) => void,
  handleDelete: (id: number) => void | Promise<void>
): Column<Deceased>[] => [
  {
    key: 'id',
    label: 'NO',
    position: 'middle',
    sortable: true,
  },
  {
    key: 'register_date',
    label: 'REGISTRATION DATE',
    position: 'middle',
    sortable: true,
    render: (row: Deceased) => {
      const raw = row?.register_date;
      if (!raw) return '';

      const d = new Date(raw);
      if (isNaN(d.getTime())) return String(raw);

      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();

      return `${yyyy}-${mm}-${dd}`;
    },
  },
  {
    key: 'memorial_name',
    label: 'NAME',
    position: 'middle',
    sortable: true,
  },
  {
    key: 'gender',
    label: 'GENDER',
    position: 'middle',
    sortable: true,
  },
  {
    key: 'registered_account',
    label: 'REGISTERED BY',
    position: 'middle',
    sortable: true,
  },
  {
    key: 'status',
    label: 'STATUS',
    position: 'middle',
    sortable: true,
    render: (row: Deceased) => {
      const isActive = String(row?.status) === '1';

      return (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
            isActive
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          {isActive ? 'Active' : 'Inactive'}
        </span>
      );
    },
  },
  {
    key: 'action',
    label: 'ACTION',
    position: 'middle',
    sortable: false,
    actions: [
      {
        icon: Pencil,
        tooltip: 'Edit Deceased Record',
        onClick: (row) => handleEdit(row.id),
      },
      {
        icon: Trash,
        variant: 'danger',
        tooltip: 'Delete Deceased Record',
        onClick: (row) => handleDelete(row.id),
      },
    ],
  },
];
