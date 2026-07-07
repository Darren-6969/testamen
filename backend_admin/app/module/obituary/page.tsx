'use client';

import GenericTablePage from '@/components/generic/GenericTablePage';
import { fetchObituaries} from '@/app/data/obituary';
import { obituaryColumns, Obituary } from '@/app/config/ObituaryTableConfig'; // Imported Obituary interface
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/header/PageHeader';
import { Feather } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

export default function ObituaryPage() {
  const router = useRouter();
  const [reloadKey, setReloadKey] = useState(0);

  const handlePreview = (row: Obituary) => {
    router.push(`/module/obituary/${row.mf_id}`);
  };

  const handleView = (id: number) => {
    router.push(`/module/obituary/${id}`);
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
        columns={obituaryColumns(handlePreview, handleView)}
        config={{
          tableType: 'columnSearch',
          pageSize: 10,
        }}
      />
    </div>
  );
}
