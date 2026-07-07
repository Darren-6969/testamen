'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';

import PageHeader from '@/components/header/PageHeader';
import { createIncident } from '@/app/data/incident';
import IncidentForm, {
  IncidentFormData,
} from '../components/IncidentForm';

export default function AddIncidentPage() {
  const router = useRouter();

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (data: IncidentFormData) => {
    setSaving(true);
    setErrorMessage(null);

    try {
      const result = await createIncident(data);

      if (!result) {
        throw new Error('Failed to create incident.');
      }

      toast.success('Incident created successfully');
      router.push('/module/incident');
      router.refresh();
    } catch (error: any) {
      console.error('create incident error:', error);

      const message =
        error?.message || 'Failed to create incident. Please try again.';

      setErrorMessage(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push('/module/incident');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<TriangleAlert className="h-5 w-5 text-[#c3195d]" />}
        subtitle="Create a new incident record"
      >
        <span className="text-[#c3195d]">Add Incident</span>
      </PageHeader>

      <IncidentForm
        submitLabel="Create Incident"
        saving={saving}
        errorMessage={errorMessage}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  );
}