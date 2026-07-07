'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import axios from 'axios';
import PaymentForm from '../../PaymentForm';
import { Payment } from '@/app/data/payments';
import PageHeader from '@/components/header/PageHeader';
import Button from '@/components/button/Button';
import Breadcrumb from '@/components/breadcrumb/Breadcrumb';
import { toast } from 'sonner';

export default function PaymentsPage() {
  const router = useRouter();
  const params = useParams();
  const dockey = params?.dockey;
  const searchParams = useSearchParams();
  const mode = (searchParams.get('mode') as 'view' | 'edit') || 'edit';

  const [completed_payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRef = useRef(false);
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  const api = axios.create({
	baseURL: baseUrl,
	withCredentials: true,
	headers: { 'Content-Type': 'application/json' },
  });

  useEffect(() => {
	if (!dockey || fetchRef.current) return;
	fetchRef.current = true;

	const fetchPaymentDockey = async () => {
		try {
			const response = await api.get<Payment>(`/payments/completed/${dockey}`);
			setPayment(response.data);
		} catch (error: any) {
			console.error('Error fetching payment:', error.response || error);
			if (error.response?.status === 401) {
			toast.error("Unauthorized. Please login first.");
			router.push('/login');
			} else {
			toast.error("Failed to fetch payment. Please try again.");
			router.push('/module/payments/completed');
			}
		} finally {
			setLoading(false);
		}
	};

	fetchPaymentDockey();
  }, [dockey, router]);

  const handleUpdatePayment = async (data: Partial<Payment>) => {
	  if (!dockey) return;
	  if (mode === 'view') return;
	  try {
		await api.put(`/payments/${dockey}`, data);
		toast.success("Payment updated successfully!");
		router.push('/module/payments/pending');
	  } catch (error: any) {
		console.error("Error updating payment:", error.response || error);
		if (error.response?.status === 401) {
		  toast.error("Unauthorized. Please login first.");
		  router.push('/login');
		} else {
		  toast.error("Failed to update payment. Please try again.");
		}
	  }
	};

  if (loading) return <p>Loading...</p>;
  if (!completed_payment) return <p>Payment not found.</p>;

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
				{ label: 'Payment', href: '/module/payments/completed' },
				{ label: completed_payment?.docno ?? 'View Payment' }
			]}
		/>
		<PaymentForm initialData={completed_payment} mode={mode} source='JSON' onSubmit={handleUpdatePayment} />
	</div>
  );
}