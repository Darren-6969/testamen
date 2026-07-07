'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';

import PageHeader from '@/components/header/PageHeader';
import {
  fetchIncidentById,
  updateIncident,
  Incident,
} from '@/app/data/incident';
import IncidentForm, {
  IncidentFormData,
} from '../../components/IncidentForm';

const normalizeDateForInput = (value?: string | null) => {
  if (!value) return '';

  const dateString = String(value);

  // Already correct format for input type="date"
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }

  // Handle ISO date without timezone conversion:
  // 2026-05-29T00:00:00.000Z -> 2026-05-29
  // 2026-05-29T00:00:00.000+08:00 -> 2026-05-29
  const match = dateString.match(/^(\d{4}-\d{2}-\d{2})/);

  if (match) {
    return match[1];
  }

  return '';
};

const normalizeTimeForInput = (value?: string | null) => {
  if (!value) return '';

  return String(value).slice(0, 5);
};

const mapIncidentToFormData = (incident: Incident): IncidentFormData => ({
  title: incident.title || '',
  description: incident.description || '',
  victim: incident.victim || '',
  date_of_incident: normalizeDateForInput(incident.date_of_incident),
  time: normalizeTimeForInput(incident.time),
  location: incident.location || '',
  status: incident.status || 'ACTIVE',
  casualty_count:
    incident.casualty_count !== null && incident.casualty_count !== undefined
      ? String(incident.casualty_count)
      : '0',
  reference_link: incident.reference_link || '',
});

export default function EditIncidentPage() {
  const params = useParams();
  const router = useRouter();

  const incidentId = Number(params?.id);

  const [incident, setIncident] = useState<Incident | null>(null);
  const [initialData, setInitialData] = useState<IncidentFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadIncident = async () => {
      if (!incidentId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setErrorMessage(null);

      try {
        const data = await fetchIncidentById(incidentId);

        if (!data) {
          setErrorMessage('Incident not found.');
          return;
        }

        setIncident(data);
        setInitialData(mapIncidentToFormData(data));
      } catch (error) {
        console.error('load incident error:', error);
        setErrorMessage('Failed to load incident.');
      } finally {
        setLoading(false);
      }
    };

    loadIncident();
  }, [incidentId]);

  const handleSubmit = async (data: IncidentFormData) => {
    if (!incidentId) return;

    setSaving(true);
    setErrorMessage(null);

    try {
      const result = await updateIncident(incidentId, data);

      if (!result) {
        throw new Error('Failed to update incident.');
      }

      toast.success('Incident updated successfully');
      router.push('/module/incident');
      router.refresh();
    } catch (error: any) {
      console.error('update incident error:', error);

      const message =
        error?.message || 'Failed to update incident. Please try again.';

      setErrorMessage(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push('/module/incident');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={<TriangleAlert className="h-5 w-5 text-[#c3195d]" />}
          subtitle="Loading incident information"
        >
          <span className="text-[#c3195d]">Edit Incident</span>
        </PageHeader>

        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">
          Loading incident information...
        </div>
      </div>
    );
  }

  if (!incident || !initialData) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={<TriangleAlert className="h-5 w-5 text-[#c3195d]" />}
          subtitle="Incident record not found"
        >
          <span className="text-[#c3195d]">Edit Incident</span>
        </PageHeader>

        <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-sm font-medium text-red-700">
          {errorMessage || 'Incident not found.'}
        </div>

        <button
          type="button"
          onClick={() => router.push('/module/incident')}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Incident Listing
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<TriangleAlert className="h-5 w-5 text-[#c3195d]" />}
        subtitle={`Update incident record #${incident.id}`}
      >
        <span className="text-[#c3195d]">Edit Incident</span>
      </PageHeader>

      <IncidentForm
        initialData={initialData}
        submitLabel="Update Incident"
        saving={saving}
        errorMessage={errorMessage}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  );
}