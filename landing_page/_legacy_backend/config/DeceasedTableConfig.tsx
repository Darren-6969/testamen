import { Column } from '@/components/table/DataTableWithColumnSearch';
import { Trash } from 'lucide-react';

export interface Deceased {
  number_list: number;
  register_date: string;
  memorial_name: string;
  gender: string;
  registered_account: string;
  show: boolean;
}

export const deceasedColumns = (
  handleDelete: (id: number) => void | Promise<void>
): Column<Deceased>[] => [
  {
    key: 'number_list',
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
    key: 'action',
    label: 'ACTION',
    position: 'middle',
    sortable: false,
    actions: [
      {
        icon: Trash,
        variant: 'danger',
        tooltip: 'Delete Deceased Record',
        onClick: (row) => handleDelete(row.number_list),
      },
    ],
  },
];