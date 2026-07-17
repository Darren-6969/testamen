// app/module/setting/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { Settings, User, Lock, CreditCard } from 'lucide-react';
import PageHeader from '@/components/header/PageHeader';
import SettingTile from '@/components/setting/SettingTile';

export default function SettingPage() {
  const router = useRouter();

  const settingItems = [
    {
      title: 'Profile Update',
      description: 'Update your full name, phone number, and referral code.',
      icon: User,
      href: '/module/setting/profile',
    },
    {
      title: 'Change Password',
      description: 'Change your login password securely.',
      icon: Lock,
      href: '/module/setting/change-password',
    },
    {
      title: 'Plan & Subscription',
      description: 'View your current plan, storage, and payment history.',
      icon: CreditCard,
      href: '/module/setting/plan',
    },
  ];

  return (
    <div
      className="space-y-6"
      style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}
    >
      <PageHeader icon={<Settings className="w-5 h-5 text-[#c3195d]" />}>
        <span className="text-[#c3195d]">Setting</span>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {settingItems.map((item) => (
          <SettingTile
            key={item.title}
            title={item.title}
            description={item.description}
            icon={item.icon}
            onClick={() => router.push(item.href)}
          />
        ))}
      </div>
    </div>
  );
}