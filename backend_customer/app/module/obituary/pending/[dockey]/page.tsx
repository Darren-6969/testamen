// app/module/payments/pending/[dockey]/page.tsx
'use client';

import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import axios from 'axios';
import PaymentForm from '../../PaymentForm';
import { Payment } from '@/app/data/payments';
import PageHeader from '@/components/header/PageHeader';
import Button from '@/components/button/Button';
import { useSearchParams } from 'next/navigation';
import Breadcrumb from '@/components/breadcrumb/Breadcrumb';
import { toast } from 'sonner';

export default function PaymentsPage() {
	const router = useRouter();
	const params = useParams();
	const dockey = params?.dockey;
	const searchParams = useSearchParams();
	const mode = (searchParams.get('mode') as 'view' | 'edit') || 'edit';

	const [pending_payment, setPayment] = useState<Payment | null>(null);
	const [loading, setLoading] = useState(true);

	const fetchRef = useRef(false);
	const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
	// const api = axios.create({
	// 	baseURL: baseUrl,
	// 	withCredentials: true,
	// 	headers: { 'Content-Type': 'application/json' },
	// });
	const api = useMemo(() => {
		return axios.create({
			baseURL: `/api`,
			withCredentials: true,
			headers: { 'Content-Type': 'application/json' },
		});
	}, [baseUrl]);


	useEffect(() => {
		if (!dockey || fetchRef.current) return;
		fetchRef.current = true;

		const fetchPaymentID = async () => {
			try {
				const response = await api.get<Payment>(`/payments/pending/${dockey}`);
				setPayment(response.data);
			} catch (error: any) {
				console.error('Error fetching payment:', error.response || error);
				if (error.response?.status === 401) {
					toast.error("Unauthorized. Please login first.");
					router.push('/login');
				} else {
					toast.error("Failed to fetch payment. Please try again.");
					router.push('/module/payments/pending');
				}
			} finally {
				setLoading(false);
			}
		};

		fetchPaymentID();
	}, [dockey, router, api]);

	// const handleUpdatePayment = async (data: Partial<Payment>) => {
	// 	if (!dockey) return;
	// 	if (mode === 'view') return;
	// 	try {
	// 		await api.put(`/payments/pending/${dockey}`, data);
	// 		toast.success("Payment updated successfully!");
	// 		router.refresh();
	// 	} catch (error: any) {
	// 		console.error("Error updating payment:", error.response || error);
	// 		if (error.response?.status === 401) {
	// 			toast.error("Unauthorized. Please login first.");
	// 			router.push('/login');
	// 		} else {
	// 			toast.error("Failed to update payment. Please try again.");
	// 		}
	// 	}
	// };
	const handleUpdatePayment = useCallback(async (data: Partial<Payment>) => {
		if (!dockey) return;
		if (mode === 'view') return;

		try {
			await api.put(`/payments/pending/${dockey}`, data);
			toast.success("Payment updated successfully!");
			router.refresh();
		} catch (error: any) {
			console.error("Error updating payment:", error.response || error);
			if (error.response?.status === 401) {
			toast.error("Unauthorized. Please login first.");
			router.push('/login');
			} else {
			toast.error("Failed to update payment. Please try again.");
			}
		}
	}, [api, dockey, mode, router]);


	if (loading) return <p>Loading...</p>;
	if (!pending_payment) return <p>Payment not found.</p>;

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<PageHeader>
					{mode === 'view' ? 'View Payment' : 'Edit Payment'}
				</PageHeader>
				<Button
					variant={'outline'}
					color='black'
					onClick={() => router.back()}
				>
					Back
				</Button>
			</div>

			<Breadcrumb
				items={[
					{ label: 'Payment', href: '/module/payments/pending' },
					{ label: pending_payment?.reference_no ?? 'View Payment' }
				]}
			/>
			<PaymentForm initialData={pending_payment} mode={mode} source='POSTGRES' onSubmit={handleUpdatePayment} />
		</div>
	);
}