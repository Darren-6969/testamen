import { Column } from '@/components/table/DataTableWithColumnSearch';
import { Edit, Trash, MailWarning } from 'lucide-react';
import { Customer } from '../data/customers';

export const customerColumns = (
  router: any,
  handleDelete: (id: number) => void,
  handleSendReminderEmail?: (id: number) => void,
  isSendingReminder?: (id: number) => boolean
): Column<Customer>[] => [
  { key: 'name', label: 'Name', sortable: true, grid: 2 },
  { key: 'email', label: 'Email', sortable: true, grid: 2 },
  { key: 'contact_no', label: 'Phone Number', sortable: true, grid: 2 },
  { key: 'admin_name', label: 'PIC Name', sortable: true, grid: 2 },
  { key: 'package_name', label: 'Package', sortable: true, grid: 2 },

  {
    key: 'status',
    label: 'Status',
    grid: 2,
    exactMatch: true,
    filterComponent: (value, onChange) => (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
      >
        <option value="">All</option>
        <option value="Active">Active</option>
        <option value="Inactive">Inactive</option>
        <option value="Pending">Pending</option>
        <option value="Barred">Barred</option>
      </select>
    ),
    render: (user) => {
      const status = String(user.status || '').trim();

      return (
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            status === 'Active'
              ? 'bg-green-100 text-green-700'
              : status === 'Pending'
              ? 'bg-orange-100 text-orange-700'
              : status === 'Inactive'
              ? 'bg-gray-300 text-gray-700'
              : status === 'Barred'
              ? 'bg-red-100 text-red-700'
              : 'bg-gray-100 text-gray-500'
          }`}
        >
          {status || '-'}
        </span>
      );
    },
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
        onClick: (u) => router.push(`/module/customers/edit?id=${u.id}`),
      },

      {
        icon: MailWarning,
        tooltip: 'Send Reminder Email',
        variant: 'danger',
        showIf: (u) => {
          const status = String(u.status || '').trim();

          return (
            !!handleSendReminderEmail &&
            status !== 'Barred' &&
            status !== 'Inactive'
          );
        },
        onClick: (u) => {
          if (!handleSendReminderEmail) return;

          const customerId = Number(u.id);
          if (!customerId) return;

          const sending = isSendingReminder
            ? isSendingReminder(customerId)
            : false;

          if (sending) return;

          handleSendReminderEmail(customerId);
        },
      },

      {
        icon: Trash,
        iconPosition: 'right',
        variant: 'danger',
        tooltip: 'Delete',
        showIf: (u) => String(u.status || '').trim() === 'Active',
        onClick: (u) => handleDelete(Number(u.id)),
      },
    ],
  },
];