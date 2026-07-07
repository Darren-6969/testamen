import { Column } from '@/components/table/DataTableWithColumnSearch';
import { FileText } from 'lucide-react';
import { InvoiceListRow } from '../data/invoices';
import { CreditNote } from '../data/credit-note';
import { DebitNote } from '../data/debit-note';

export const invoiceColumns = (
  router: any,
  // handleDelete: (id: number) => void
): Column<InvoiceListRow>[] => [
  { key: 'rowNum', label: 'No.', grid: 0.5, position: 'left'},
  { key: 'DOCNO', label: 'Invoice No.', sortable: true, grid: 1.5  },
  { key: 'COMPANYNAME', label: 'Customer', sortable: true, grid: 3   },
  { key: 'ATTENTION', label: 'Attn.', sortable: true, grid: 2   },
  { key: 'DOCDATE', label: 'Date', sortable: true, grid: 1   },
  { key: 'LOCALDOCAMT', label: 'Invoice Amount', grid: 2 },
  { key: 'PAYMENTAMT', label: 'Payment Amount', grid: 2 },
  { key: 'CANCELLED', label: 'Status', grid: 1.5, 
    filterComponent: (value, onChange) => (
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-400">
        <option value="">All</option>
        <option value="Active">Active</option>
        <option value="Cancelled">Cancelled</option>
      </select>
    ),
    render: (inv) => (
      <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            inv.CANCELLED === 'Active'
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {inv.CANCELLED}
        </span>
    ),
  },
  {
    key: 'actions',
    label: 'Actions',
    grid: 1,
    position: 'right',
    actions: [
      {
        icon: FileText,
        tooltip: 'View',
        // showIf: (u) => u.role === 'Admin',
         onClick: (u) => {
          console.log(u);
          const url = `/invoice/${encodeURIComponent(u.DOCNO)}`;
          window.open(url, '_blank', 'noopener,noreferrer');
        },
      },
    ],
  },
];

export const creditNoteColumns = (
  router: any,
  // handleDelete: (id: number) => void
): Column<CreditNote>[] => [
  { key: 'rowNum', label: 'No.', grid: 0.5, position: 'left'},
  { key: 'DOCNO', label: 'Credit No.', sortable: true, grid: 1  },
  { key: 'COMPANYNAME', label: 'Customer', sortable: true, grid: 2   },
  { key: 'ATTENTION', label: 'Attn.', sortable: true, grid: 2   },
  { key: 'DOCDATE', label: 'Date', sortable: true, grid: 1   },
  { key: 'DESCRIPTION', label: 'Description', sortable: true, grid: 4   },
  { key: 'LOCALDOCAMT', label: 'Amount', grid: 2 },
];

export const debitNoteColumns = (
  router: any,
  // handleDelete: (id: number) => void
): Column<DebitNote>[] => [
  { key: 'rowNum', label: 'No.', grid: 0.5, position: 'left'},
  { key: 'DOCNO', label: 'Debit No.', sortable: true, grid: 1  },
  { key: 'COMPANYNAME', label: 'Customer', sortable: true, grid: 2   },
  { key: 'ATTENTION', label: 'Attn.', sortable: true, grid: 2   },
  { key: 'DOCDATE', label: 'Date', sortable: true, grid: 1   },
  { key: 'DESCRIPTION', label: 'Description', sortable: true, grid: 4   },
  { key: 'LOCALDOCAMT', label: 'Amount', grid: 2 },
];

