'use client';

import { useRouter } from 'next/navigation';
import PageHeader from '@/components/header/PageHeader';
import {
  Settings,
  ImageIcon,
  Code2,
  PackageCheck,
  ChevronRight,
} from 'lucide-react';

const MODULE_COLOR = '#c3195d';

const settingCards = [
  {
    title: 'Background Images',
    description: 'Manage system background images and visual display settings.',
    icon: ImageIcon,
    route: '/module/settings/background-images',
  },
  {
    title: 'Referral Settings',
    description: 'Configure referral codes, referral setup, and related settings.',
    icon: Code2,
    route: '/module/settings/referral-settings',
  },
  {
    title: 'Plans & Storage',
    description: 'Manage feature plans, storage limits, and subscription settings.',
    icon: PackageCheck,
    route: '/module/settings/plans-storage',
  },
];

export default function SettingsPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Settings className="h-5 w-5 text-[#c3195d]" />}
        subtitle="Control system-wide configuration"
      >
        <span className="text-[#c3195d]">Settings</span>
      </PageHeader>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {settingCards.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.title}
              type="button"
              onClick={() => router.push(item.route)}
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-[#c3195d]/40 hover:shadow-lg"
            >
              <div className="absolute right-0 top-0 h-24 w-24 rounded-bl-full bg-[#c3195d]/10 opacity-80 transition-all duration-200 group-hover:bg-[#c3195d]/15" />

              <div className="relative flex items-start justify-between gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#c3195d]/10 text-[#c3195d] transition-all duration-200 group-hover:bg-[#c3195d] group-hover:text-white">
                  <Icon className="h-7 w-7" />
                </div>

                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-400 transition-all duration-200 group-hover:bg-[#c3195d]/10 group-hover:text-[#c3195d]">
                  <ChevronRight className="h-5 w-5" />
                </div>
              </div>

              <div className="relative mt-6">
                <h2 className="text-base font-bold text-slate-900 transition-colors duration-200 group-hover:text-[#c3195d]">
                  {item.title}
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {item.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}