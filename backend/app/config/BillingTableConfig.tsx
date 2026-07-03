import { Column } from '../../components/table/DataTableWithColumnSearch';
import { Trash } from 'lucide-react';
import { useRouter } from 'next/navigation';

export interface Billing {
  number_list: number;
  invoice_no: string;
  fullname: string;
  plan_code: string;
  amount_rm: number;
  updated_at: string;
  payment_method: string;
  status: string;
}

export const billingTableColumns = (
  router: ReturnType<typeof useRouter>,
  handleDelete: (id: number) => void
): Column<Billing>[] => [
  {
    key: 'number_list',
    label: 'NO',
    position: 'middle',
    sortable: true,
    sortFn: (a, b) => a.number_list - b.number_list,
  },

  {
    key: 'invoice_no',
    label: 'INVOICE NO',
    position: 'middle',
    sortable: true,
    sortFn: (a, b) =>
      (a.invoice_no ?? '').localeCompare(b.invoice_no ?? ''),
  },

  {
    key: 'fullname',
    label: 'USERNAME',
    position: 'middle',
    sortable: true,
    sortFn: (a, b) =>
      (a.fullname ?? '').localeCompare(b.fullname ?? ''),
  },

  {
    key: 'plan_code',
    label: 'PACKAGE',
    position: 'middle',
    sortable: true,
    sortFn: (a, b) =>
      (a.plan_code ?? '').localeCompare(b.plan_code ?? ''),
  },

  {
    key: 'amount_rm',
    label: 'AMOUNT',
    position: 'middle',
    sortable: true,
    sortFn: (a, b) => (a.amount_rm ?? 0) - (b.amount_rm ?? 0),
  },

  {
    key: 'updated_at',
    label: 'PAYMENT DATE',
    position: 'middle',
    sortable: true,

    sortFn: (a, b) =>
      new Date(a.updated_at).getTime() -
      new Date(b.updated_at).getTime(),

    render: (row: Billing) => {
      const raw = row?.updated_at;
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
    key: 'payment_method',
    label: 'PAYMENT METHOD',
    position: 'middle',
    sortable: true,
    sortFn: (a, b) =>
      (a.payment_method ?? '').localeCompare(b.payment_method ?? ''),
  },

  {
  key: 'status',
  label: 'PAYMENT STATUS',
  position: 'middle',
  sortable: true,
  sortFn: (a, b) =>
    (a.status ?? '').localeCompare(b.status ?? ''),

  render: (row) => {
    const statusStyle: Record<string, string> = {
      paid: 'bg-green-100 text-green-700 border-green-200',
      pending: 'bg-yellow-100 text-yellow-700 border-yellow-200 animate-pulse',
      unpaid: 'bg-red-100 text-red-700 border-red-200',
    };

    const style =
      statusStyle[row.status] ??
      'bg-gray-100 text-gray-600 border-gray-200';

    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold border ${style}`}
      >
        {row.status}
      </span>
    );
  },
},

  {
    key: 'action' as any,
    label: 'ACTION',
    position: 'middle',
    sortable: false, // IMPORTANT

    render: (row) => (
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => handleDelete(row.number_list)}
          className="text-red-500 hover:text-red-700"
        >
          <Trash size={18} />
        </button>
      </div>
    ),

    actions: [
      {
        icon: Trash,
        variant: 'danger',
        tooltip: 'Delete Billing',
        onClick: (row) => handleDelete(row.number_list),
      },
    ],
  },
];