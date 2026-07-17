import { Column } from '@/components/table/DataTableWithColumnSearch';
import { Trash, Pencil } from 'lucide-react';

export interface Feedback {
  id: number;
  no?: number;
  name: string;
  email: string | null;
  message: string;
}

export const feedbackColumns = (
  handleDelete: (id: number) => void,
  handleEdit: (id: number) => void
): Column<Feedback>[] => [
  {
    key: 'no',
    label: 'No',
    sortable: true,
    grid: 1,
    position: 'middle',

    sortFn: (a, b) => (a.no ?? 0) - (b.no ?? 0),
  },

  {
    key: 'name',
    label: 'Name',
    sortable: true,
    grid: 2,
    position: 'middle',

    sortFn: (a, b) =>
      (a.name ?? '').localeCompare(b.name ?? ''),
  },

  {
    key: 'email',
    label: 'Email',
    sortable: true,
    grid: 3,
    position: 'middle',

    sortFn: (a, b) =>
      (a.email ?? '').localeCompare(b.email ?? ''),
  },

  {
    key: 'message',
    label: 'Feedback Content',
    sortable: true,
    grid: 4,
    position: 'middle',

    sortFn: (a, b) =>
      (a.message ?? '').localeCompare(b.message ?? ''),
  },

  {
    key: 'actions',
    label: 'Actions',
    grid: 2,
    position: 'middle',
    sortable: false, 

    render: (row: Feedback) => (
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => handleEdit(row.id)}
          className="flex items-center gap-1 text-blue-600 hover:underline"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleDelete(row.id)}
          className="flex items-center gap-1 text-red-600 hover:underline"
        >
          <Trash className="w-4 h-4" />
        </button>
      </div>
    ),

    actions: [
      {
        icon: Pencil,
        variant: 'default',
        tooltip: 'Edit Feedback',
        onClick: (row) => handleEdit(row.id),
      },
      {
        icon: Trash,
        variant: 'danger',
        tooltip: 'Delete Feedback',
        onClick: (row) => handleDelete(row.id),
      },
    ],
  },
];
