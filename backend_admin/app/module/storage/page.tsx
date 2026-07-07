'use client';

import { useState } from 'react'; 
import GenericTablePage from '@/components/generic/GenericTablePage';
import PageHeader from '@/components/header/PageHeader';
import { Database } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

import { fetchStorage, deleteStorage } from '@/app/data/storage';
import { storageColumns } from '@/app/config/StorageTableConfig';

export default function StoragePage() {
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this storage plan?')) return;
    
    try {
      await deleteStorage(id); 
      toast.success('Storage item deleted successfully');
      setRefreshKey(prev => prev + 1); 
    } catch (err) {
      toast.error('Failed to delete storage item');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        icon={<Database className="w-5 h-5 text-[#c3195d]" />}
        subtitle="Manage available tiers and pricing structures"
      >
        <span className="text-[#c3195d]">Storage Control</span>
      </PageHeader>

      <GenericTablePage
        key={refreshKey}
        fetchData={fetchStorage}
        columns={storageColumns(router, handleDelete)}
        addRoute="/module/storage/add" 
        config={{
          addButtonLabel: 'Add New Plan',
          searchPlaceholder: 'Search files...', 
        }}
      />
    </div>
  );
}