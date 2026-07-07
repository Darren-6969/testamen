'use client';

import { useEffect, useState, useRef, use } from 'react';
import { useRouter, useParams } from 'next/navigation';
import axios from 'axios';
import PaymentForm from '../PaymentForm';
import { Payment } from '@/app/data/payments';
import PageHeader from '@/components/header/PageHeader';
import Button from '@/components/button/Button';
import { toast } from 'sonner';

export default function AddPaymentPage() {
	const router = useRouter();

	const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

	const api = axios.create({
		baseURL: baseUrl,
		withCredentials: true,
		headers: { 'Content-Type': 'application/json' },
	});

	const handleAddPayment = async (data: Partial<Payment>) => {
		console.log('Submitting new payment:', data);
		try {
			const response = await api.post('/payments/add', data);
			toast.success('Payment created successfully!');
			console.log('Created payment:', response.data);
			router.push('/module/payments/pending');
		} catch (error: any) {
			console.error('Error creating payment:', error.response || error);
			if (error.response?.status === 401) {
				toast.error('Unauthorized. Please login first.');
				router.push('/login');
			} else {
				toast.error('Failed to create payment. Please try again.');
			}
		}
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<PageHeader>
					New Payment
				</PageHeader>
				<Button
					variant={'outline'}
					color='black'
					onClick={() => router.push('/module/payments/pending')}
				>
					Back
				</Button>
			</div>

			<PaymentForm onSubmit={handleAddPayment} source='POSTGRES' />
		</div>
	);
}