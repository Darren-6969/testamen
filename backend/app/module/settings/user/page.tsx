// app/module/report/page.tsx
"use client";

import { useRouter } from "next/navigation";
import PageHeader from "@/components/header/PageHeader";
import {
  Users,
  UserPlus,
  HandHeart,
  CreditCard,
  WalletCards,
  HandCoins,
  Activity,
  BarChart3,
  PackageOpen,
  Clock8,
  History,
  Shield,
  UserCog,
} from "lucide-react";

interface ReportItem {
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  onClick: () => void;
}

interface ReportSection {
  label: string;
  items: ReportItem[];
}

export default function ReportPage() {
  const router = useRouter();

  const sections: ReportSection[] = [
    {
      label: "Customer",
      items: [ 
        {
          title: "Total Customers",
          subtitle: "(Active / Inactive)",
          icon: Users,
          onClick: () => router.push("/module/report/customer/total-status"),
        },
        {
          title: "New Customers",
          subtitle: "(Daily / Weekly / Monthly)",
          icon: UserPlus,
          onClick: () => router.push("/module/report/customer/new"),
        },
        {
          title: "Total Customers",
          subtitle: "(By Package)",
          icon: HandHeart,
          onClick: () => router.push("/module/report/customer/by-package"),
        },
      ],
    },
    {
      label: "Payment",
      items: [
        {
          title: "Total Payment",
          subtitle: "View payment list by date range",
          icon: CreditCard,
          onClick: () => router.push("/module/report/payment/total"),
        },
        {
          title: "Payment Status Summary",
          subtitle: "Breakdown by status",
          icon: WalletCards,
          onClick: () => router.push("/module/report/payment/status-summary"),
        },
        // {
        //   title: "Total Collection",
        //   subtitle: "(By Package / Location)",
        //   icon: HandCoins,
        //   onClick: () => router.push("/module/report/payment/collection"),
        // },
      ],
    },
    {
      label: "Activation",
      items: [
        {
          title: "Total Activations",
          subtitle: "(Daily / Weekly / Monthly)",
          icon: Activity,
          onClick: () => router.push("/module/report/activation/total"),
        },
        {
          title: "Total Activation",
          subtitle: "(By Package)",
          icon: BarChart3,
          onClick: () => router.push("/module/report/activation/by-package"),
        },
        {
          title: "Package Subscriptions",
          subtitle: "(Monthly / Yearly)",
          icon: PackageOpen,
          onClick: () =>
            router.push("/module/report/activation/subscriptions"),
        },
      ],
    },
    {
      label: "Administrator",
      items: [
        {
          title: "Login History",
          subtitle: "Account last login history",
          icon: Clock8,
          onClick: () => router.push("/module/report/user/last-login"),
        },
        {
          title: "Audit Log",
          subtitle: "Monitor actions across module",
          icon: Shield,
          onClick: () => router.push("/module/report/audit-log"),
        },
      ],
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
      <PageHeader icon={<UserCog className="w-5 h-5 text- #c3195d" />}>
        <span className="text- #c3195d">User Management</span>
      </PageHeader>

      <div className="space-y-8">
        {sections.map((section) => (
          <div key={section.label} className="space-y-3 uppercase ">
            {/* Section title */}
            <h2 className="text-sm font-bold">
              {section.label}
            </h2>

            {/* Cards – same style as Setting cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.title + item.subtitle}
                    type="button"
                    onClick={item.onClick}
                    className="w-full text-left rounded-xl border border-gray-200 bg-white shadow-sm p-4 flex items-start gap-3 hover:shadow-md hover:border-red-700 transition-all"
                  >
                    <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text- [#c3195d]" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-m font-semibold tracking-[0.08em] text-gray-800 uppercase">
                        {item.title}
                      </h3>
                      {item.subtitle && item.subtitle.trim() !== "" && (
                        <p className="text-xs text-gray-500">
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
