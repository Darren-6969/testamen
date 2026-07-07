// app/registration/page.tsx
'use client';

import { useEffect, useState } from 'react';

import CardWithIcon from "@/components/card/CardWithIcon";
import StatusCard from "@/components/card/StatusCard";
import { UserPlus, UserRoundPlus, CircleDollarSign } from "lucide-react";
import LineChart from "@/components/charts/LineChart";
import BarChart from "@/components/charts/BarChart";
import BarChartSlanted from '@/components/charts/BarChartSlanted';
import PageHeader from "@/components/header/PageHeader";
import { QuickAction } from "@/components/card/QuickAction";
import { Pie_Chart } from "@/components/charts/PieChart";
import { useRouter } from 'next/navigation';
import { getCustomerCount } from "@/app/data/branches";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';


type ServiceData = {
  name: string;
  value: number;
  color?: string;
};

type MonthlyNew = {
  month: number;  // 1-12
  total: number;
};

type NewCustomerCard = {
  id: number;
  name: string;
  phone: string;
  pkg: string;
  date: string;
};

type PendingPaymentCard = {
  id: number;
  code: string;
  name: string;
  amount: string; // formatted "RM 78.90"
  due: string;    // formatted "Exp Date: July 20, 2025"
};

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function DashboardPage() {
	const router = useRouter();
	const [serviceData, setServiceData] = useState<ServiceData[]>([]);
	const [lineData, setLineData] = useState(
		MONTH_LABELS.map((name) => ({ name, value: 0 }))
	);
	const [newCustomers, setNewCustomers] = useState<NewCustomerCard[]>([]);

	const [newRegistrationsLast30, setNewRegistrationsLast30] = useState(0);
	// if later you add pending payment:
	const [pendingPaymentsCount, setPendingPaymentsCount] = useState(0);

	const [installationStats, setInstallationStats] = useState({ pending: 0, completed: 0, });

	const [pendingPayments, setPendingPayments] = useState<PendingPaymentCard[]>([]);

	const [customerLocationData, setCustomerLocationData] = useState<ServiceData[]>([]);

	const cards = [
		{
			title: "NEW REGISTRATION",
			value: newRegistrationsLast30,
			icon: UserRoundPlus,
		},
		{
			title: "PENDING PAYMENT",
			value: pendingPaymentsCount, // or pendingPayments if you wire it
			icon: CircleDollarSign,
		},
	];


	const quickAction = [
		{ label: "New Customer", onClick: () => router.push('/module/customers/add') },
		{ label: "Confirm Payment", onClick: () => router.push('/module/payments') },
		{ label: "Assign Installer", onClick: () => router.push('/module/activation') },
		{ label: "Upload Invoice", onClick: () => router.push('/module/payments') },
	];

	useEffect(() => {
	const loadDashboardData = async () => {
		try {
			const [serviceRes, monthlyRes, latestRes, summaryRes, installationRes, pendingRes, customerLocationRes] = await Promise.all([
				fetch(`/api/dashboard`, {
					method: 'POST',
					credentials: 'include',
				}),
				fetch(`/api/dashboard/new-customers-monthly`, {
					method: 'POST',
					credentials: 'include',
				}),
				fetch(`/api/dashboard/new-customers-latest`, {
					method: 'POST',
					credentials: 'include',
				}),
				fetch(`/api/dashboard/summary`, {
					method: 'POST',
					credentials: 'include',
				}),
				fetch(`/api/dashboard/installation-status`, {
					method: 'POST',
					credentials: 'include',
				}),
				fetch(`/api/dashboard/pending-payments`, {
					method: 'POST',
					credentials: 'include',
				}),
				getCustomerCount(),
			]);

			if (!serviceRes.ok) throw new Error('Failed to load service data');
			if (!monthlyRes.ok) throw new Error('Failed to load monthly new customers');
			if (!latestRes.ok) throw new Error('Failed to load latest new customers');
			if (!summaryRes.ok) throw new Error('Failed to load dashboard summary');
			if (!installationRes.ok) throw new Error('Failed to load installation status');
			if (!pendingRes.ok) throw new Error('Failed to load pending payments');

			// --- Service data (pie) ---
			const serviceJson: { name: string; value: number }[] = await serviceRes.json();
			// const palette = ['#f90506', '#d62828', '#b71c1c', '#6d4c41', '#424242'];
			const palette = [
							// Deep Reds
							'#8B0000','#A4161A','#9D0208','#7F0000','#6A040F',
							'#800020','#7B2C2C','#6D2E2E','#5C1A1B','#4A0F0F',

							// Muted Reds
							'#C0392B','#B03A2E','#922B21','#7B241C','#641E16',
							'#9E2A2B','#8C1C13','#7D3C3C','#6E2C2C','#5D1F1F',

							// Brick / Rust
							'#B7410E','#A0522D','#8B4513','#7E3517','#6E260E',
							'#8A3324','#7C2D12','#6B2C25','#5B2C2C','#4B1E1E',

							// Browns
							'#5D4037','#4E342E','#3E2723','#6D4C41','#795548',
							'#8D6E63','#5C4033','#4B3621','#3B2F2F','#2E1F1F',

							// Warm Greys
							'#424242','#3C3C3C','#353535','#2F2F2F','#292929',
							'#4A4A4A','#505050','#585858','#606060','#686868',

							// Charcoal
							'#2C2C2C','#1F1F1F','#252525','#303030','#383838',
							'#404040','#484848','#505050','#585858','#606060',

							// Muted Wine
							'#5E2129','#4A1C23','#3F151B','#6F1D1B','#8D0801',
							'#7A1E1E','#661111','#550000','#4A0404','#3B0000',

							// Earth Tones
							'#6E4B3A','#5A3E36','#4B3832','#3E2723','#6B4226',
							'#7C482B','#8B5A2B','#704214','#593E1A','#4E342E',

							// Dark Neutral Mix
							'#2E2E2E','#3A3A3A','#454545','#505050','#5A5A5A',
							'#636363','#6D6D6D','#777777','#808080','#8A8A8A',

							// Extra Variations
							'#7F1D1D','#991B1B','#842029','#6F2232','#5D1A1A',
							'#4C1C24','#3B0D11','#2C0A0F','#1F0508','#140204',

							'#5C2E00','#6E2C00','#7F2700','#8F2500','#9F2200',
							'#6B3A2E','#5A2D23','#4A1F1F','#3A1414','#2A0C0C'
							];


			const serviceWithColors: ServiceData[] = serviceJson.map((item, idx) => ({
				...item,
				color: palette[idx % palette.length],
			}));
			setServiceData(serviceWithColors);

			// --- Monthly new customers (line) ---
			const monthlyJson: MonthlyNew[] = await monthlyRes.json();

			const byMonth = new Map<number, number>();
			monthlyJson.forEach((row) => {
				byMonth.set(row.month, row.total);
			});

			setLineData(
				MONTH_LABELS.map((name, idx) => ({
				name,
				value: byMonth.get(idx + 1) ?? 0,
				}))
			);

			// --- Latest 2 new customers (card) ---
			const latestJson: any[] = await latestRes.json();

			const latestMapped: NewCustomerCard[] = latestJson.map((row) => ({
				id: row.id,
				name: row.name,
				phone: row.phone,
				pkg: row.pkg,
				date: new Intl.DateTimeFormat('en-US', {
				month: 'short',
				day: '2-digit',
				year: 'numeric',
				}).format(new Date(row.created_at)),
			}));

			setNewCustomers(latestMapped);

			// --- Pending payments list (left card) ---
			const pendingJson: any[] = await pendingRes.json();

			const pendingMapped: PendingPaymentCard[] = pendingJson.map((row) => {
				const amountNumber = Number(row.amount ?? 0);
				const amountFormatted = 'RM ' + amountNumber.toFixed(2); // "RM 78.90"

				const dateFormatted =
				'Exp Date: ' +
				new Intl.DateTimeFormat('en-US', {
					month: 'long',
					day: '2-digit',
					year: 'numeric',
				}).format(new Date(row.created_at));

				return {
				id: row.id,
				code: row.reference_no,
				name: row.customer_name,
				amount: amountFormatted,
				due: dateFormatted,
				};
			});

			setPendingPayments(pendingMapped);

			// --- Summary (NEW REGISTRATION + PENDING PAYMENT cards) ---
			const summaryJson: { newRegistrationsLast30: number; pendingPayments: number; } = await summaryRes.json();

			setNewRegistrationsLast30(summaryJson.newRegistrationsLast30 ?? 0);
			setPendingPaymentsCount(summaryJson.pendingPayments ?? 0);

			const installationJson: { pending: number; completed: number } =
			await installationRes.json();

			setInstallationStats({
				pending: installationJson.pending ?? 0,
				completed: installationJson.completed ?? 0,
			});

			// --- Customer location distribution (branch customer count) ---
			const customerCountData = await customerLocationRes;
			const palette2 = [
				'#8B0000','#A4161A','#9D0208','#7F0000','#6A040F',
				'#800020','#7B2C2C','#6D2E2E','#5C1A1B','#4A0F0F',
				'#C0392B','#B03A2E','#922B21','#7B241C','#641E16',
			];
			
			let customerLocationMapped: ServiceData[] = [];
			if (Array.isArray(customerCountData)) {
				customerLocationMapped = customerCountData.map((item: any, idx: number) => ({
					name: item.branch_name || item.name || `Location ${idx + 1}`,
					value: item.customer_count || item.count || item.value || 0,
					color: palette2[idx % palette2.length],
				}));
			}
			setCustomerLocationData(customerLocationMapped);
		} catch (err) {
		console.error('Error loading dashboard data:', err);
		}
  };

  loadDashboardData();
}, []);



  return (
    <div
      className="space-y-6"
      style={{
        backgroundColor: "var(--bg)",
        color: "var(--text)",
      }}
    >
      <PageHeader 
	  icon={<UserPlus className="w-5 h-5 text-[#c3195d]" />}
	  subtitle="Overview of all registered users"
	  >
        <span className="text-[#c3195d]">Registration</span>
      </PageHeader>

      {/* ROW 1: Quick Action | Top stats (same height) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Quick Action */}
        <div className="lg:col-span-4 h-full">
          <QuickAction actions={quickAction} />
        </div>

        {/* New Registration + Pending Payment + Installation */}
        <div className="lg:col-span-8 h-full ">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch h-full ">
            {/* New Registration + Pending Payment */}
            <div className="md:col-span-2 h-full">
              <CardWithIcon cards={cards} />
            </div>

            {/* Installation */}
			<StatusCard
			title="INSTALLATION"
			items={[
				{ label: "PENDING", value: installationStats.pending },
				{ label: "COMPLETED", value: installationStats.completed },
			]}
			/>

          </div>
        </div>
      </div>

      {/* ROW 2 & 3: left/right layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN – PENDING PAYMENT / NEW CUSTOMER */}
        <div className="lg:col-span-4 space-y-6">
          {/* Pending Payment */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm h-72 flex flex-col">
            <div className="px-3 py-3 border-b border-gray-200">
              <h2 className="text-xs font-semibold tracking-[0.15em] text-[#c3195d]">
                PENDING PAYMENT
              </h2>
            </div>
            <div className="px-3 py-2 space-y-4 flex-1">
              {pendingPayments.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between gap-4 pb-3 border-b last:border-0 last:pb-0"
                >
                  <div className="space-y-1">
                    <p className="text-xs text-gray-800">{item.code}</p>
                    <p className="text-sl font-semibold text-gray-800 uppercase">
                      {item.name}
                    </p>
                    <p className="text-[11px] text-gray-700">{item.due}</p>
                  </div>
                  <div className="text-right flex flex-col items-end justify-between">
                    <button className="text-[11px] text-gray-400 hover:text-gray-600">
                      See more
                    </button>
                    <p className="text-xl font-bold text-[#c3195d]">
                      {item.amount}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-3 py-2 border-t border-gray-200 text-center">
				<button
				className="text-xs font-semibold text-[#c3195d]"
				onClick={() => router.push('/module/payments')}
				>
				SHOW ALL
				</button>

            </div>
          </div>

          {/* New Customer */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm h-72 flex flex-col">
            <div className="px-3 py-3 border-b border-gray-200">
              <h2 className="text-xs font-semibold tracking-[0.15em] text-[#c3195d]">
                NEW CUSTOMER
              </h2>
            </div>
            <div className="px-3 py-2 space-y-4 flex-1">
              {newCustomers.map((c) => (
                <div
                  key={c.id}
                  className="pb-3 border-b last:border-0 last:pb-0"
                >
                  <p className="text-sm font-semibold text-gray-800">
                    {c.name}
                  </p>
                  <p className="text-xs text-gray-500">{c.phone}</p>
                  <p className="text-xs text-gray-500">{c.pkg}</p>
                  <p className="mt-1 text-[11px] text-[#c3195d] font-semibold">
                    {c.date}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN – CLD + bottom charts */}
        <div className="lg:col-span-8 space-y-6">
          {/* Customer Location Distribution */}
			<div className="rounded-md border border-gray-200 bg-white shadow-sm p-4 h-80 flex flex-col">
			<h2 className="text-xs font-semibold tracking-[0.15em] text-[#c3195d] mb-4">
				CUSTOMER LOCATION DISTRIBUTION
			</h2>
			<div className="flex-1"> {/* This ensures the chart takes up the remaining space */}
				<BarChartSlanted data={customerLocationData} />
			</div>
			</div>

          {/* Bottom row: Top Services & New Customers (monthly) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top services subscribed */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 h-72 flex flex-col">
              <h2 className="text-xs font-semibold tracking-[0.15em] text-[#c3195d]">
                TOP SERVICES SUBSCRIBED
              </h2>

              <div className="grid grid-cols-5 gap-4 items-center flex-1">
                {/* Pie chart – take 3/5 of the width */}
                <div className="col-span-2 flex items-center justify-center h-full">
                  <div className="w-full h-60">
                    <Pie_Chart data={serviceData} />
                  </div>
                </div>

                {/* Legend – now showing real data */}
                <ul className="col-span-3 space-y-2 text-xs tracking-[0.1em]">
                  {serviceData.slice(0, 5).map((pkg) => (
                    <li key={pkg.name} className="flex justify-between gap-2">
                      <span className="break-words whitespace-normal min-w-0">{pkg.name}</span>
                      <span className="font-semibold shrink-0">{pkg.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

			{/* New customers (monthly) */}
			<div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 h-72 flex flex-col">
			<h2 className="text-xs font-semibold tracking-[0.15em] text-[#c3195d]">
				NEW CUSTOMERS (MONTHLY)
			</h2>
			<div>
				<LineChart data={lineData} />
			</div>
			</div>
          </div>
        </div>
      </div>
    </div>
  );
}