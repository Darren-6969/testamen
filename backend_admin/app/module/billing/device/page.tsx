'use client';

import GenericTablePage from '@/components/generic/GenericTablePage';
import { fetchDevices } from '@/app/data/devices';
import { deviceColumns } from '@/app/config/DevicesTableConfig';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import PageHeader from '@/components/header/PageHeader';
import TabsHeader from '@/components/tab/TabsHeader';
import { Package } from 'lucide-react';
import { toast } from 'sonner';

export default function DevicesPage() {
  const router = useRouter();
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  const api = axios.create({
    baseURL: '/api',
    withCredentials: true, // send cookies/session if needed
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // delete handler
  const handleDelete = async (id: number) => {
    if (!id) return;
    try {
      await api.delete(`/devices/${id}`);
      toast.success('Device deleted successfully');
      router.push('/module/package/device');
    } catch (error: any) {
      console.error('Delete failed:', error);
      toast.error('Failed to delete device');
    }
  };

  const tabs = [
    { label: "Package", path: "/module/package" },
    { label: "Device", path: "/module/package/device" },
  ]

  return (
    <div className="space-y-6">
      <PageHeader icon={<Package className="w-6 h-6 text-red-600" />} subtitle="">
        <span className="text-red-600">Package Management</span>
      </PageHeader>

      {/* Tab header */}
      <TabsHeader tabs={tabs} />

      {/* Table */}
      <GenericTablePage
        fetchData={fetchDevices}
        columns={deviceColumns(router, handleDelete)}
        addRoute='/module/package/device/add'
        config={{
          addButtonLabel: "Add Device",
          pageSize: 10,
        }}
      />

    </div>
  );
}