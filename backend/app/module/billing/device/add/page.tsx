'use client';

import { useRouter } from 'next/navigation';
import axios from 'axios';
import DeviceForm from '../DeviceForm';
import { Device } from '@/app/data/devices';
import PageHeader from '@/components/header/PageHeader';
import { toast } from 'sonner';

export default function AddDevicePage() {
  const router = useRouter();

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  const api = axios.create({
    baseURL: '/api',
    withCredentials: true, // send cookies/session if needed
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const handleAddDevice = async (data: Partial<Device>) => {
    try {
      const response = await api.post('/devices/add', data); // adjust endpoint if needed
      toast.success('Device created successfully!');
      router.push('/module/package/device'); // redirect to device list
    } catch (error: any) {
      console.error('Error creating device:', error.response || error);
      if (error.response?.status === 401) {
        toast.error('Unauthorized. Please login first.');
        router.push('/login');
      } else {
        toast.error('Failed to create device. Please try again.');
      }
    }
  };

  return (
    <div className="p-6">
      <PageHeader>
        Add Device
      </PageHeader>
      <DeviceForm onSubmit={handleAddDevice} />
    </div>
  );
}
