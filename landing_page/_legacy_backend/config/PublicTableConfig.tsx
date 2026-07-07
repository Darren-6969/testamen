import { Column } from '@/components/table/DataTableWithColumnSearch';
import { Edit, Trash } from 'lucide-react';
import { PublicPrayer } from '@/app/data/public';

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

export const publicTableColumns = (
  handleEdit: (row: PublicPrayer) => void,
  handleDelete: (id: number) => void
): Column<PublicPrayer>[] => [
  {
    key: 'rowNum',
    label: 'NO',
    position: 'middle',
    searchable: false,
    sortable: false,
  },

  {
    key: 'created_date',
    label: 'CREATED DATE',
    position: 'middle',
    searchable: false,
    sortable: true,

    sortFn: (a, b) =>
      new Date(a.created_date ?? 0).getTime() -
      new Date(b.created_date ?? 0).getTime(),

    render: (row) => formatDate(row.created_date),
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
    key: 'message',
    label: 'PRAYER CONTENT',
    position: 'middle',
    sortable: true,

    sortFn: (a, b) =>
      (a.message ?? '').localeCompare(b.message ?? ''),

    render: (row) => row.message || '-',
  },

  {
    key: 'action',
    label: 'ACTION',
    searchable: false,
    position: 'middle',
    sortable: false,

    render: (row) => (
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => handleEdit(row)}
          className="flex items-center gap-1 text-blue-600 hover:underline"
        >
          <Edit className="h-4 w-4" />
          Edit
        </button>

        <button
          type="button"
          onClick={() => handleDelete(row.id)}
          className="flex items-center gap-1 text-red-600 hover:underline"
        >
          <Trash className="h-4 w-4" />
          Delete
        </button>
      </div>
    ),

    actions: [
      {
        icon: Edit,
        variant: 'outline',
        tooltip: 'Edit Prayer',
        onClick: (row) => handleEdit(row),
      },
      {
        icon: Trash,
        variant: 'danger',
        tooltip: 'Delete Prayer',
        onClick: (row) => handleDelete(row.id),
      },
    ],
  },
];