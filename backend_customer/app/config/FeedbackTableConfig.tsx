import { Column } from '@/components/table/DataTableWithColumnSearch';
import { Trash } from 'lucide-react';

export interface Feedback {
  number_list: number;
  name: string;
  email: string;
  message: string;
  is_show: boolean;
}

export const feedbackColumns = (
  handleDelete: (id: number) => void
): Column<Feedback>[] => [
  {
    key: 'number_list',
    label: 'ID',
    sortable: true,
    grid: 1,
    position: 'middle',

    sortFn: (a, b) => a.number_list - b.number_list,
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
          onClick={() => handleDelete(row.number_list)}
          className="flex items-center gap-1 text-red-600 hover:underline"
        >
          <Trash className="w-4 h-4" />
        </button>
      </div>
    ),

    actions: [
      {
        icon: Trash,
        variant: 'danger',
        tooltip: 'Delete Feedback',
        onClick: (row) => handleDelete(row.number_list),
      },
    ],
  },
];