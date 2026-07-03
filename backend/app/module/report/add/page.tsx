'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChartColumn } from 'lucide-react';
import { toast } from 'sonner';

import PageHeader from '@/components/header/PageHeader';
import { createReport } from '@/app/data/report';
import ReportForm, { ReportFormData } from '../components/ReportForm';

export default function AddReportPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (data: ReportFormData) => {
    setSaving(true);
    setErrorMessage(null);

    try {
      const payload = {
        report_name: data.report_name,
        type: data.type,
        date_range: `${data.start_date} to ${data.end_date}`,
        format: data.format,
      };

      const success = await createReport(payload);

      if (!success) throw new Error('Failed to generate report.');

      toast.success('Report generated successfully');
      router.push('/module/report');
    } catch (error: any) {
      const message =
        error?.message || 'Failed to generate report. Please try again.';

      setErrorMessage(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push('/module/report');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<ChartColumn className="h-5 w-5 text-[#c3195d]" />}
        subtitle="Configure and generate a new system report"
      >
        <span className="text-[#c3195d]">Generate Report</span>
      </PageHeader>

      <ReportForm
        submitLabel="Generate Report"
        saving={saving}
        errorMessage={errorMessage}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  );
}