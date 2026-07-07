'use client';

import GenericTablePage from '@/components/generic/GenericTablePage';
import { fetchReports, deleteReport } from '@/app/data/report';
import { reportColumns } from '@/app/config/ReportTableConfig';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/header/PageHeader';
import { ChartColumn } from 'lucide-react';

export default function ReportPage() {
  const router = useRouter();

  const handleView = (row: any) => {
    router.push(`/module/reports/${row.id}`);
  };

  const handleDelete = async (row: any) => {
    const confirmDelete = confirm(`Delete report "${row.report_name}"?`);
    if (!confirmDelete) return;

    const success = await deleteReport(row.id);

    if (success) {
      alert('Report deleted successfully');
      router.refresh();
    } else {
      alert('Failed to delete report');
    }
  };

  const handleDownload = (row: any) => {
    alert(`Downloading report: ${row.report_name}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<ChartColumn className="w-5 h-5" />}
        subtitle="View system reports and analytics"
      >
        Report
      </PageHeader>

      <GenericTablePage
        fetchData={fetchReports}
        columns={reportColumns(handleView, handleDelete, handleDownload)}
        addRoute="/module/report/add"
        config={{
          addButtonLabel: 'Generate Report',
          pageSize: 10,
        }}
      />
    </div>
  );
}