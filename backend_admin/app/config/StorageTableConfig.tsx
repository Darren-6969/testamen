// app/config/StorageTableConfig.tsx
import { Column } from '@/components/table/DataTableWithColumnSearch';
import { PlanStorageItem } from '../data/storage';
import { Edit, Trash } from 'lucide-react';

export const storageColumns = (
  router: any,
  handleDelete: (id: number) => void
): Column<PlanStorageItem>[] => {

  const handleEdit = (row: PlanStorageItem) => {
    router.push(`/module/storage/edit?id=${row.id}`);
  };

  return [
    {
      key: 'number_list',
      label: 'NO',
      position: 'middle',
    },
    {
      key: 'feature_plan',
      label: 'PLAN',
      position: 'middle',
    },
    {
      key: 'storage_mb',
      label: 'STORAGE',
      position: 'middle',
      render: (row) => `${row.storage_mb} MB`,
    },
    {
      key: 'price_rm',
      label: 'PRICE',
      position: 'middle',
      render: (row) => `RM ${row.price_rm.toFixed(2)}`,
    },
    {
      key: 'status',
      label: 'STATUS',
      position: 'middle',
      render: (row) => {
        const isActive = String(row.status).toLowerCase() === 'active' || row.status === '1';
        
        return (
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
            isActive 
              ? 'bg-green-100 text-green-700' 
              : 'bg-gray-100 text-gray-600'
          }`}>
            {isActive ? 'ACTIVE' : 'INACTIVE'}
          </span>
        );
      },
    },
    {
      key: 'action',
      label: 'ACTION',
      searchable: false,
      position: 'right',

      actions: [
    {
      icon: Edit,
      variant: 'outline',
      tooltip: 'Edit Storage Plan',
      onClick: (row) => {
        console.log('edit', row);
        handleEdit(row);
      },
    },
    {
      icon: Trash,
      variant: 'danger',
      tooltip: 'Delete Storage Plan',
      onClick: (row) => {
        console.log('delete', row);
        handleDelete(row.id);
      },
    },
  ],
  }
  ]; 
}; 
