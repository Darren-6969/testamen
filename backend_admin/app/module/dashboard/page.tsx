'use client';

import { useRouter } from 'next/navigation';
import {
  UserPlus,
  HandHeart,
  TriangleAlert,
  CreditCard,
  CheckCircle2,
  ArrowRight,
  Activity,
  Bell,
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();

  const today = new Date().toLocaleDateString('en-MY', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const quickModules = [
    {
      title: 'Registration',
      desc: 'Manage registrations and application records.',
      icon: UserPlus,
      path: '/module/registration',
    },
    {
      title: 'Deceased',
      desc: 'Manage deceased records and memorial information.',
      icon: HandHeart,
      path: '/module/deceased',
    },
    {
      title: 'Incident',
      desc: 'Manage incident reports and follow-up actions.',
      icon: TriangleAlert,
      path: '/module/incident',
    },
    {
      title: 'Billing & Payment',
      desc: 'Track invoices, payments and billing records.',
      icon: CreditCard,
      path: '/module/billing',
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-800">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-8 pb-5">
          <h1 className="text-2xl font-bold tracking-wider text-[#c3195d]">
            MEMODISE Control Center
          </h1>
          <p className="text-sm text-neutral-500 mt-1">{today}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8 space-y-6">
        {/* Welcome Hero */}
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
          <div className="h-1 bg-[#c3195d]" />

          <div className="p-6">
            <h2 className="text-xl font-semibold text-neutral-900">
              Welcome Back
            </h2>

            <p className="mt-2 text-sm text-neutral-500 leading-relaxed max-w-3xl">
              Manage registrations, deceased records, public prayer requests,
              billing activities and incident reports from one centralized
              platform.
            </p>
          </div>
        </div>

        {/* KPI SECTION */}
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-[#c3195d] mb-3">
            Today Overview
          </h3>

          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-sm">
              <p className="text-3xl font-bold">25</p>
              <p className="text-sm text-neutral-500 mt-1">Registrations</p>
            </div>

            <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-sm">
              <p className="text-3xl font-bold">12</p>
              <p className="text-sm text-neutral-500 mt-1">Deceased Records</p>
            </div>

            <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-sm">
              <p className="text-3xl font-bold">2</p>
              <p className="text-sm text-neutral-500 mt-1">Incidents</p>
            </div>

            <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-sm">
              <p className="text-3xl font-bold text-[#c3195d]">
                RM 2,240
              </p>
              <p className="text-sm text-neutral-500 mt-1">Payments</p>
            </div>
          </div>
        </div>

        {/* QUICK ACCESS */}
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-[#c3195d] mb-3">
            Quick Access
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quickModules.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  onClick={() => router.push(item.path)}
                  className="
                    group
                    bg-white
                    border
                    border-neutral-200
                    rounded-xl
                    p-5
                    cursor-pointer
                    transition-all
                    duration-200
                    hover:shadow-md
                    hover:-translate-y-1
                    hover:border-[#c3195d]/30
                  "
                >
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-lg bg-pink-50 text-[#c3195d] flex items-center justify-center shrink-0">
                      <Icon size={20} />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-neutral-900 group-hover:text-[#c3195d] transition-colors">
                          {item.title}
                        </h4>

                        <ArrowRight
                          size={16}
                          className="
                            text-neutral-400
                            group-hover:text-[#c3195d]
                            group-hover:translate-x-1
                            transition-all
                          "
                        />
                      </div>

                      <p className="text-sm text-neutral-500 mt-1 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* BOTTOM SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Recent Activity */}
          <div className="lg:col-span-2 bg-white border border-neutral-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-5">
              <Activity size={18} className="text-[#c3195d]" />
              <h3 className="font-semibold">Recent Activity</h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Bell size={16} className="text-[#c3195d] mt-1" />
                <div>
                  <p className="text-sm font-medium">
                    New registration submitted
                  </p>
                  <p className="text-xs text-neutral-500">
                    10 minutes ago
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Bell size={16} className="text-[#c3195d] mt-1" />
                <div>
                  <p className="text-sm font-medium">
                    Payment received (RM200)
                  </p>
                  <p className="text-xs text-neutral-500">
                    45 minutes ago
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Bell size={16} className="text-[#c3195d] mt-1" />
                <div>
                  <p className="text-sm font-medium">
                    Incident report updated
                  </p>
                  <p className="text-xs text-neutral-500">
                    1 hour ago
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Bell size={16} className="text-[#c3195d] mt-1" />
                <div>
                  <p className="text-sm font-medium">
                    Public prayer request approved
                  </p>
                  <p className="text-xs text-neutral-500">
                    2 hours ago
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* System Status */}
          <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm">
            <h3 className="font-semibold mb-5">
              System Status
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span>Database</span>
                <span className="flex items-center gap-2 text-emerald-600 font-medium">
                  <CheckCircle2 size={15} />
                  Online
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span>API Layer</span>
                <span className="flex items-center gap-2 text-emerald-600 font-medium">
                  <CheckCircle2 size={15} />
                  Stable
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span>File Storage</span>
                <span className="flex items-center gap-2 text-emerald-600 font-medium">
                  <CheckCircle2 size={15} />
                  Normal
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4">
          <p className="text-center text-xs text-neutral-400">
            MEMODISE v1.0 — Secure Memorial Management System
          </p>
        </div>
      </div>
    </div>
  );
}