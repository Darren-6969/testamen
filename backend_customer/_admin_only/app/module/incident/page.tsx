'use client';

import GenericTablePage from '@/components/generic/GenericTablePage';
import { fetchIncidents, deleteIncident } from '@/app/data/incident';
import { incidentColumns } from '@/app/config/IncidentTableConfig';
import { useRouter } from 'next/navigation';
import { TriangleAlert } from 'lucide-react';
import PageHeader from '@/components/header/PageHeader';
import TabsHeader from '@/components/tab/TabsHeader';
import { useState } from 'react';
import { toast } from 'sonner';

export default function IncidentPage() {
  const router = useRouter();
  const [reloadKey, setReloadKey] = useState(0);

  /**
   * Important:
   * GenericTablePage uses fetchDataCursor, so we return cursor-style data.
   */
  const fetchIncidentsForTable = async (...args: any[]) => {
    const result: any = await fetchIncidents();

    console.log('INCIDENT TABLE RESULT:', result);

    // If fetchIncidents already returns array
    if (Array.isArray(result)) {
      return {
        data: result,
        nextCursor: null,
      };
    }

    // If fetchIncidents returns { success, data }
    if (result?.data && Array.isArray(result.data)) {
      return {
        data: result.data,
        nextCursor: result.nextCursor || null,
      };
    }

    return {
      data: [],
      nextCursor: null,
    };
  };

  const handleDelete = async (id: number) => {
    try {
      const success = await deleteIncident(id);

      if (success) {
        toast.success('Incident deleted successfully');
        setReloadKey((k) => k + 1);
      } else {
        toast.error('Failed to delete incident');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete incident');
    }
  };

  const handleView = (id: number) => {
    router.push(`/module/incident/${id}`);
  };

  const tabs = [
    { label: 'All Incidents', path: '/module/incident' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<TriangleAlert className="w-5 h-5 text-[#c3195d]" />}
        subtitle="Overview of incident records"
      >
        <span className="text-[#c3195d]">Incident</span>
      </PageHeader>

      <TabsHeader tabs={tabs} />

      <GenericTablePage
        key={reloadKey}
        fetchDataCursor={fetchIncidentsForTable}
        columns={incidentColumns(router, handleDelete, handleView)}
        addRoute="/module/incident/add"
        config={{
          tableType: 'columnSearch',
          pageSize: 10,
          addButtonLabel: 'Add New Incident',
        }}
      />
    </div>
  );
}