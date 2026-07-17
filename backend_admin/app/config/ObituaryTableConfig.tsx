import { Column } from '@/components/table/DataTableWithColumnSearch';
import { Eye } from 'lucide-react';

export interface Obituary {
  id: number;
  number_list: number;
  create_date: string;
  mf_fullname: string;
  mf_id: string;
  username: string;
}

export const obituaryColumns = (
  handlePreview: (row: Obituary) => void | Promise<void>
): Column<Obituary>[] => [
  {
    key: 'number_list',
    label: 'NO',
    position: 'middle',
    sortable: true,
    sortFn: (a, b) => a.number_list - b.number_list,
  },

  {
    key: 'create_date',
    label: 'CREATED DATE',
    position: 'middle',
    sortable: true,

    sortFn: (a, b) =>
      new Date(a.create_date).getTime() - new Date(b.create_date).getTime(),

    render: (row: Obituary) => {
      const raw = row?.create_date;
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
    key: 'mf_fullname',
    label: 'CREATED FOR',
    position: 'middle',
    sortable: true,

    sortFn: (a, b) =>
      (a.mf_fullname ?? '').localeCompare(b.mf_fullname ?? ''),
  },

  {
    key: 'mf_id',
    label: 'CREATED BY',
    position: 'middle',
    sortable: true,

    sortFn: (a, b) =>
      (a.mf_id ?? '').localeCompare(b.mf_id ?? ''),
  },

  {
    key: 'preview',
    label: 'PREVIEW',
    position: 'middle',
    sortable: false, // actions column should NOT be sortable

    actions: [
      {
        icon: Eye,
        variant: 'primary',
        tooltip: 'Preview Obituary',
        onClick: (row) => handlePreview(row),
      },
    ],
  },
];