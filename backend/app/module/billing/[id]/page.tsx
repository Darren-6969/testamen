'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import axios from 'axios';
import PackageForm from '../PackageForm';
import { Package } from '@/app/data/packages';
import PageHeader from '@/components/header/PageHeader';
import { toast } from 'sonner';

export default function ViewPackagePage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;

  const [pkg, setPackage] = useState<Package | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRef = useRef(false);

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  const api = axios.create({
    baseURL: '/api',
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' },
  });

  // ------------------ Fetch single package by ID ------------------
  useEffect(() => {
    if (!id || fetchRef.current) return;
	fetchRef.current = true;

    const fetchPackageId = async () => {
      try {
        const response = await api.get<Package>(`/packages/${id}`);
        setPackage(response.data);
      } catch (error: any) {
        if (error.response?.status === 401) {
          toast.error("Unauthorized. Please login first.");
          router.push('/login');
        } else {
          toast.error("Failed to fetch package. Please try again.");
          router.push('/module/package');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPackageId();
  }, [id, router]);

  if (loading) return <p>Loading...</p>;
  if (!pkg) return <p>Package not found.</p>;

  // ------------------ Render read-only form ------------------
  return (
    <div className="p-6">
      <PageHeader>View Package</PageHeader>
      <PackageForm initialData={pkg} />
    </div>
  );
}