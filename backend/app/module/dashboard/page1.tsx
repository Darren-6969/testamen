'use client';

import { useRouter } from 'next/navigation';
import {
  UserPlus,
  HandHeart,
  TriangleAlert,
  CreditCard,
  CheckCircle2
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();

  const quickModules = [
    {
      title: 'Registration',
      desc: 'Manage new registrations, process application logs, and system data verification.',
      icon: UserPlus,
      path: '/module/registration',
    },
    {
      title: 'Deceased',
      desc: 'Record, structure, and manage comprehensive archive updates seamlessly.',
      icon: HandHeart,
      path: '/module/deceased',
    },
    {
      title: 'Incident',
      desc: 'Track global incident reports, active service requests, and platform logs.',
      icon: TriangleAlert,
      path: '/module/incident',
    },
    {
      title: 'Billing & Payment',
      desc: 'Monitor real-time invoices, balance records, and processed payment tracking.',
      icon: CreditCard,
      path: '/module/billing',
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-50/60 text-neutral-800 antialiased">
      {/* Top Header */}
      <div className="bg-white border-b border-neutral-200/80">
        <div className="max-w-7xl mx-auto px-8 pb-5 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-800">
              MEMODISE Dashboard
            </h1>
            <p className="text-sm text-neutral-500 mt-0.5">
              System overview & quick access modules
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto px-8 py-8 space-y-6">
        
        {/* Welcome Hero Card */}
        <div className="rounded-2xl p-6 shadow-sm border border-black/10">
          <h2 className="text-lg font-semibold tracking-wide">
            Welcome back,
          </h2>
          <p className="mt-1 text-sm text-neutral-400 max-w-xl leading-relaxed">
            Manage your real-time system registration metrics, processed digital records, financial payments, and incoming incident data points safely within one clean workspace.
          </p>
        </div>

        {/* Quick Modules - Structured 2x2 Clean Balanced Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickModules.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                onClick={() => router.push(item.path)}
                className="group bg-white border border-neutral-200/80 rounded-xl p-5 cursor-pointer hover:border-neutral-300 hover:shadow-sm transition-all duration-200 flex items-start gap-4"
              >
                <div className="w-11 h-11 rounded-lg flex items-center justify-center bg-pink-50 text-pink-700 group-hover:bg-pink-100/80 transition-colors shrink-0">
                  <Icon size={20} strokeWidth={2} />
                </div>

                <div className="space-y-1">
                  <h3 className="font-semibold text-neutral-900 group-hover:text-pink-700 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-neutral-500 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Section - Guaranteed Perfectly Aligned Heights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
          
          {/* System Status Container */}
          <div className="bg-white border border-neutral-200/80 rounded-xl p-6 flex flex-col justify-between">
            <div>
              <h3 className="font-semibold text-neutral-900 mb-4 tracking-tight">System Status</h3>
              <div className="space-y-3.5">
                <div className="flex items-center gap-2.5 text-sm text-neutral-600">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  <span>Database: <span className="font-medium text-neutral-900">Connected</span></span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-neutral-600">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  <span>API Layer: <span className="font-medium text-neutral-900">Stable</span></span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-neutral-600">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  <span>File Storage: <span className="font-medium text-neutral-900">Normal</span></span>
                </div>
              </div>
            </div>
          </div>

          {/* Today Overview Metrics Card */}
          <div className="bg-white border border-neutral-200/80 rounded-xl p-6 lg:col-span-2 flex flex-col justify-between">
            <div>
              <h3 className="font-semibold text-neutral-900 mb-4 tracking-tight">Today Overview</h3>
              <div className="grid grid-cols-3 gap-4 text-center h-full pt-2">
                <div className="bg-neutral-50/50 rounded-lg p-4 border border-neutral-100">
                  <p className="text-2xl font-bold text-neutral-900 tracking-tight">25</p>
                  <p className="text-xs font-medium text-neutral-500 mt-1 uppercase tracking-wider">Registrations</p>
                </div>
                <div className="bg-neutral-50/50 rounded-lg p-4 border border-neutral-100">
                  <p className="text-2xl font-bold text-neutral-900 tracking-tight">2</p>
                  <p className="text-xs font-medium text-neutral-500 mt-1 uppercase tracking-wider">Incidents</p>
                </div>
                <div className="bg-neutral-50/50 rounded-lg p-4 border border-neutral-100">
                  <p className="text-2xl font-bold text-pink-700 tracking-tight">RM 2,240</p>
                  <p className="text-xs font-medium text-neutral-500 mt-1 uppercase tracking-wider">Payments</p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <p className="text-xs text-neutral-400 text-center pt-6 tracking-wide">
          MEMODISE v1.0 — Secure Management System
        </p>
      </div>
    </div>
  );
}