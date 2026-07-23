'use client';

import GenericTablePage from '@/components/generic/GenericTablePage';
import { fetchObituaries, deleteObituary } from '@/app/data/obituary';
import { obituaryColumns, Obituary } from '@/app/config/ObituaryTableConfig';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/header/PageHeader';
import { Feather } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

export default function ObituaryPage() {
  const router = useRouter();
  const [reloadKey, setReloadKey] = useState(0);

  const handlePreview = (row: Obituary) => {
    router.push(`/module/obituary/${row.id}`);
  };

  const handleDelete = async (row: Obituary) => {
    const confirmed = window.confirm(
      `Delete the obituary for "${row.mf_fullname || 'this record'}"?`
    );
    if (!confirmed) return;

    const success = await deleteObituary(row.id);
    if (success) {
      toast.success('Obituary deleted');
      setReloadKey((prev) => prev + 1);
    } else {
      toast.error('Failed to delete obituary');
    }
  };

  return (
    <div className="space-y-1">
      <PageHeader
        icon={<Feather className="w-5 h-5 text-[#c3195d]" />}
        subtitle="Archive of obituary listings"
      >
        <span className="text-[#c3195d]">Obituary</span>
      </PageHeader>

      <GenericTablePage
        key={reloadKey}
        fetchData={fetchObituaries}
        columns={obituaryColumns(handlePreview, handleDelete)}
        config={{
          tableType: 'columnSearch',
          pageSize: 10,
        }}
      />
    </div>
  );
}
