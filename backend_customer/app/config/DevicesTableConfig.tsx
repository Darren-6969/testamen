import { Column } from '@/components/table/DataTableWithColumnSearch';
import { Edit, Eye, Trash } from 'lucide-react';
import { Device } from '../data/devices';

export const deviceColumns = (
  router: any,
  handleDelete: (id: number) => void
): Column<Device>[] => [
  { key: 'device_code', label: 'Device Code', sortable: true, grid: 2  },
  { key: 'device_name', label: 'Device Name', sortable: true, grid: 3  },
  { key: 'remarks', label: 'Remarks', sortable: true, grid: 2  },
  { key: 'device_price', label: 'Price', grid: 2 },
  {
    key: 'actions',
    label: 'Actions',
    grid: 2,
    position: 'right',
    actions: [
      {
        icon: Eye,
        tooltip: 'View',
        // showIf: (u) => u.role === 'Admin',
        onClick: (u) => router.push(`/module/package/device/${u.id}?mode=view`),
      },
      {
        icon: Edit,
        tooltip: 'Edit',
        // showIf: (u) => u.role === 'Admin',
        onClick: (u) => router.push(`/module/package/device/${u.id}?mode=edit`),
      },
      {
        icon: Trash,
        iconPosition: 'right',
        variant: 'danger',
        tooltip: 'Delete',
        // showIf: (u) => u.status === 'Inactive',
        onClick: (u) => {
          if (confirm(`Are you sure you want to delete ${u.device_name}?`)) {
            handleDelete(u.id);
          }
        }
      },
    ],
  },
];

