'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import axios from 'axios';
import DeviceForm from '../DeviceForm';
import { Device } from '@/app/data/devices';
import PageHeader from '@/components/header/PageHeader';
import { toast } from 'sonner';

export default function EditDevicePage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;
  const searchParams = useSearchParams();
  const mode = (searchParams.get('mode') as 'view' | 'edit') || 'edit';

  const [device, setDevice] = useState<Device | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRef = useRef(false); // Prevent double fetch in Strict Mode

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  const api = axios.create({
    baseURL: '/api',
    withCredentials: true, // send cookies/session if needed
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // ------------------- Fetch single device -------------------
  useEffect(() => {
    if (!id || fetchRef.current) return;
    fetchRef.current = true;

    const fetchDeviceById = async () => {
      try {
        const response = await api.get<Device>(`/devices/${id}`);
        setDevice(response.data);
      } catch (error: any) {
        if (error.response?.status === 401) {
          toast.error("Unauthorized. Please login first.");
          router.push('/login');
        } else {
          toast.error("Failed to fetch device. Please try again.");
          router.push('/module/package/device');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDeviceById();
  }, [id, router]);

  const handleUpdateDevice = async (data: Partial<Device>) => {
    if (!id) return;
    if (mode === 'view') return;
    try {
      await api.put(`/devices/${id}`, data);
      toast.success("Device updated successfully!");
      router.push('/module/package/device');
    } catch (error: any) {
      if (error.response?.status === 401) {
        toast.error("Unauthorized. Please login first.");
        router.push('/login');
      } else {
        toast.error("Failed to update device. Please try again.");
      }
    }
  };
  
  if (loading) return <p>Loading...</p>;
  if (!device) return <p>Device not found</p>;

  return (
    <div className="p-6">
      <PageHeader>
        {mode === 'view' ? 'View Device' : 'Edit Device'}
      </PageHeader>
      <DeviceForm initialData={device} mode={mode} onSubmit={handleUpdateDevice} />
    </div>
  );
}
