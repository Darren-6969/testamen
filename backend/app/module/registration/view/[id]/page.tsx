'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  CalendarDays,
  Hash,
  Users,
  CircleCheck,
  TriangleAlert,
} from 'lucide-react';

import PageHeader from '@/components/header/PageHeader';
import {
  fetchRegistrationById,
  Registration,
} from '@/app/data/registration';

const formatDate = (value?: string | null) => {
  if (!value) return '-';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('en-MY', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export default function ViewRegistrationPage() {
  const params = useParams();
  const router = useRouter();

  const registrationId = Number(params?.id);

  const [registration, setRegistration] =
    useState<Registration | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!registrationId) {
        setLoading(false);
        return;
      }

      try {
        const data = await fetchRegistrationById(registrationId);
        setRegistration(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [registrationId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={
            <User className="h-5 w-5 text-[#c3195d]" />
          }
          subtitle="Loading registration information"
        >
          <span className="text-[#c3195d]">
            Registration Details
          </span>
        </PageHeader>

        <div className="rounded-3xl border bg-white p-8 shadow-sm">
          Loading registration details...
        </div>
      </div>
    );
  }

  if (!registration) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={
            <TriangleAlert className="h-5 w-5 text-[#c3195d]" />
          }
          subtitle="Registration not found"
        >
          <span className="text-[#c3195d]">
            Registration Details
          </span>
        </PageHeader>

        <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-red-600">
          Registration record not found.
        </div>

        <button
          onClick={() =>
            router.push('/module/registration')
          }
          className="inline-flex items-center gap-2 rounded-xl border px-5 py-2 text-sm font-semibold hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Registration
        </button>
      </div>
    );
  }

  const statusColor =
    registration.status === 'Active'
      ? 'bg-green-100 text-green-700 border-green-200'
      : registration.status === 'Inactive'
      ? 'bg-red-100 text-red-700 border-red-200'
      : 'bg-yellow-100 text-yellow-700 border-yellow-200';

  return (
    <div className="space-y-6">
      <PageHeader
        icon={
          <User className="h-5 w-5 text-[#c3195d]" />
        }
        subtitle="View registration information"
      >
        <span className="text-[#c3195d]">
          Registration
        </span>
      </PageHeader>

      <div className="flex justify-end">
        <button
          onClick={() =>
            router.push('/module/registration')
          }
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold shadow-sm hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b bg-gradient-to-r from-pink-50 to-white px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {registration.username}
              </h2>

              <p className="text-sm text-slate-500">
                View Registration Details
              </p>
            </div>

            <span
              className={`rounded-full border px-4 py-1 text-xs font-bold ${statusColor}`}
            >
              {registration.status}
            </span>
          </div>
        </div>

        <div className="grid gap-5 p-6 md:grid-cols-2">

          <div className="space-y-2">
            <p className="text-xs font-bold uppercase text-slate-400">
              Registration Date
            </p>

            <div className="flex items-center gap-2 rounded-2xl border p-4">
              <CalendarDays className="h-4 w-4 text-[#c3195d]" />
              {formatDate(
                registration.registration_date
              )}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-bold uppercase text-slate-400">
              Code Number
            </p>

            <div className="flex items-center gap-2 rounded-2xl border p-4">
              <Hash className="h-4 w-4 text-[#c3195d]" />
              {registration.code_no}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-bold uppercase text-slate-400">
              Username
            </p>

            <div className="flex items-center gap-2 rounded-2xl border p-4">
              <User className="h-4 w-4 text-[#c3195d]" />
              {registration.username}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-bold uppercase text-slate-400">
              Registered Accounts
            </p>

            <div className="flex items-center gap-2 rounded-2xl border p-4">
              <Users className="h-4 w-4 text-[#c3195d]" />
              {registration.registered_accounts}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-bold uppercase text-slate-400">
              Contact Number
            </p>

            <div className="flex items-center gap-2 rounded-2xl border p-4">
              <Phone className="h-4 w-4 text-[#c3195d]" />
              {registration.contact}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-bold uppercase text-slate-400">
              Email Address
            </p>

            <div className="flex items-center gap-2 rounded-2xl border p-4">
              <Mail className="h-4 w-4 text-[#c3195d]" />
              {registration.email}
            </div>
          </div>

          <div className="space-y-2 md:col-span-2">
            <p className="text-xs font-bold uppercase text-slate-400">
              Status
            </p>

            <div className="flex items-center gap-2 rounded-2xl border p-4">
              <CircleCheck className="h-4 w-4 text-[#c3195d]" />
              {registration.status}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}