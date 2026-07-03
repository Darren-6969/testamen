'use client';

import { useState } from 'react';
import GenericTablePage from '@/components/generic/GenericTablePage';
import {
  fetchDeceaseds,
  deleteDeceased,
  Deceased,
} from '@/app/data/deceased';
import { deceasedColumns } from '@/app/config/DeceasedTableConfig';
import PageHeader from '@/components/header/PageHeader';
import { HandHeart } from 'lucide-react';
import { toast } from 'sonner';

export default function DeceasedPage() {

  const [reloadKey, setReloadKey] = useState(0);

  const handleDelete = async (id: number) => {
  const confirmed = confirm(
    `Are you sure to delete this deceased record?`
  );

  if (!confirmed) return;

  const success = await deleteDeceased(id);

  if (success) {
    toast.success('Deceased record deleted successfully');
    setReloadKey((k) => k + 1);
  } else {
    toast.error('Failed to delete deceased record');
  }
};


  return (
    <div className="space-y-6">
      <PageHeader
        icon={<HandHeart className="w-5 h-5 text-[#c3195d]" />}
        subtitle="Manage deceased records and information"
      >
        <span className="text-[#c3195d]">Deceased</span>
      </PageHeader>

      <GenericTablePage
        key={reloadKey}
        fetchData={fetchDeceaseds}
        columns={deceasedColumns(handleDelete)}
        config={{
          pageSize: 10,
          tableType: 'columnSearch',
        }}
      />
    </div>
  );
}