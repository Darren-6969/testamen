// app/dashboard/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { Settings, User, Lock } from "lucide-react";
import PageHeader from "@/components/header/PageHeader";

export default function DashboardPage() {
  const router = useRouter();

  const settingItems = [
    {
      title: "Profile Update",
      description: "Update your name, phone, and contact details.",
      icon: User,
      onClick: () => {
        router.push("/module/customer-profile");
      },
    },
    {
      title: "Change Password",
      description: "Change your login password securely.",
      icon: Lock,
      onClick: () => {
        router.push("/module/setting/change-password");
      },
    },
  ];

  return (
    <div
      className="space-y-6"
      style={{
        backgroundColor: "var(--bg)",
        color: "var(--text)",
      }}
    >
      <PageHeader icon={<Settings className="w-5 h-5 text-[#c3195d]" />}>
        <span className="text-[#c3195d]">Setting</span>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {settingItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.title}
              type="button"
              onClick={item.onClick}
              className="w-full text-left rounded-xl border border-gray-200 bg-white shadow-sm p-4 flex items-start gap-3 hover:shadow-md hover:border-red-700 transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-[#c3195d]" />
              </div>
              <div className="space-y-1">
                <h2 className="text-m font-semibold tracking-[0.08em] text-gray-800 uppercase">
                  {item.title}
                </h2>
                <p className="text-xs text-gray-500">{item.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
