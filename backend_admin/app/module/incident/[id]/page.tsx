'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  ExternalLink,
  MapPin,
  MessageCircle,
  Pencil,
  TriangleAlert,
  Users,
} from 'lucide-react';

import PageHeader from '@/components/header/PageHeader';
import { fetchIncidentById, Incident } from '@/app/data/incident';

const formatDate = (value?: string | null) => {
  if (!value) return '-';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('en-MY', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

export default function ViewIncidentPage() {
  const params = useParams();
  const router = useRouter();

  const incidentId = Number(params?.id);

  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadIncident = async () => {
      if (!incidentId) {
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const data = await fetchIncidentById(incidentId);
        setIncident(data);
      } catch (error) {
        console.error('load incident error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadIncident();
  }, [incidentId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={<TriangleAlert className="h-5 w-5 text-[#c3195d]" />}
          subtitle="Loading incident details"
        >
          <span className="text-[#c3195d]">Incident Details</span>
        </PageHeader>

        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">
          Loading incident information...
        </div>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={<TriangleAlert className="h-5 w-5 text-[#c3195d]" />}
          subtitle="Incident record not found"
        >
          <span className="text-[#c3195d]">Incident Details</span>
        </PageHeader>

        <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-sm font-medium text-red-700">
          Incident not found.
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

  const comments = incident.comments || [];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<TriangleAlert className="h-5 w-5 text-[#c3195d]" />}
        subtitle="View incident details and related messages"
      >
        <span className="text-[#c3195d]">Incident Details</span>
      </PageHeader>

      <div className="flex flex-wrap justify-end gap-3">
        <button
          type="button"
          onClick={() => router.push('/module/incident')}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <button
          type="button"
          onClick={() => router.push(`/module/incident/edit/${incident.id}`)}
          className="inline-flex items-center gap-2 rounded-2xl border border-[#c3195d]/20 bg-gradient-to-r from-[#c3195d] to-[#a5124b] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-pink-900/20 transition hover:-translate-y-0.5 hover:shadow-xl"
        >
          <Pencil className="h-4 w-4" />
          Edit Incident
        </button>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
        <div className="border-b border-slate-200 bg-gradient-to-r from-pink-50 via-white to-white px-6 py-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900">
                {incident.title || '-'}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Incident ID: #{incident.id}
              </p>
            </div>

            <span className="rounded-full border border-pink-100 bg-pink-50 px-4 py-1.5 text-xs font-black uppercase tracking-wide text-[#c3195d]">
              {incident.status || 'ACTIVE'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-pink-100 text-[#c3195d]">
              <CalendarDays className="h-5 w-5" />
            </div>
            <p className="text-xs font-bold uppercase text-slate-400">Date</p>
            <p className="mt-1 text-sm font-bold text-slate-900">
              {formatDate(incident.date_of_incident)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
              <Clock className="h-5 w-5" />
            </div>
            <p className="text-xs font-bold uppercase text-slate-400">Time</p>
            <p className="mt-1 text-sm font-bold text-slate-900">
              {incident.time || '-'}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
              <Users className="h-5 w-5" />
            </div>
            <p className="text-xs font-bold uppercase text-slate-400">
              Casualty
            </p>
            <p className="mt-1 text-sm font-bold text-slate-900">
              {incident.casualty_count ?? '-'}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
              <MessageCircle className="h-5 w-5" />
            </div>
            <p className="text-xs font-bold uppercase text-slate-400">
              Messages
            </p>
            <p className="mt-1 text-sm font-bold text-slate-900">
              {incident.message_count ?? comments.length ?? 0}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 border-t border-slate-200 p-6 md:grid-cols-2">
          <div className="space-y-2">
            <p className="text-xs font-black uppercase tracking-wide text-slate-400">
              Location
            </p>
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800">
              <MapPin className="h-4 w-4 text-[#c3195d]" />
              {incident.location || '-'}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-black uppercase tracking-wide text-slate-400">
              Reference Link
            </p>

            {incident.reference_link ? (
              <a
                href={incident.reference_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-600 hover:underline"
              >
                <ExternalLink className="h-4 w-4" />
                Open Reference Link
              </a>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-400">
                No reference link
              </div>
            )}
          </div>

          <div className="space-y-2 md:col-span-2">
            <p className="text-xs font-black uppercase tracking-wide text-slate-400">
              Victim / Affected Person
            </p>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800">
              {incident.victim || '-'}
            </div>
          </div>

          <div className="space-y-2 md:col-span-2">
            <p className="text-xs font-black uppercase tracking-wide text-slate-400">
              Description
            </p>
            <div className="min-h-[120px] whitespace-pre-wrap rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700">
              {incident.description || '-'}
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h3 className="text-base font-black text-slate-900">
            Related Messages
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Public comments or messages linked to this incident.
          </p>
        </div>

        <div className="divide-y divide-slate-100">
          {comments.length > 0 ? (
            comments.map((comment) => (
              <div key={comment.id} className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-black text-slate-900">
                      {comment.name || 'Anonymous'}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {comment.email || '-'} • {formatDate(comment.create_date)}
                    </p>
                  </div>

                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
                    Icon {comment.icon || '-'}
                  </span>
                </div>

                <p className="mt-3 text-sm leading-6 text-slate-700">
                  {comment.message || '-'}
                </p>
              </div>
            ))
          ) : (
            <div className="p-6 text-sm text-slate-500">
              No message found for this incident.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}