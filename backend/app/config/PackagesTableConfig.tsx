import { Column } from '@/components/table/DataTableWithColumnSearch';
import { Edit, Trash, Eye } from 'lucide-react';
import { Package } from '../data/packages';

export const packageColumns = (
  router: any,
  // handleDelete: (id: number) => void
): Column<Package>[] => [
  { key: 'package_code', label: 'Package Code', sortable: true, grid: 2  },
  { key: 'package_name', label: 'Package Name', sortable: true, grid: 3   },
  { key: 'remarks', label: 'Remarks', sortable: true, grid: 4   },
  { key: 'monthly_fee', label: 'Monthly Fee', grid: 1 },
  {
    key: 'actions',
    label: 'Actions',
    grid: 1,
    position: 'right',
    actions: [
      {
        icon: Eye,
        tooltip: 'View',
        // showIf: (u) => u.role === 'Admin',
        onClick: (u) => router.push(`/module/package/${u.id}`),
      },
    ],
  },
];

