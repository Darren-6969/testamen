'use client';

import { useRouter } from 'next/navigation';
import axios from 'axios';
import UserForm from '../UserForm';
import { User } from '@/app/data/users';
import PageHeader from '@/components/header/PageHeader';
import { Plus } from 'lucide-react';

export default function AddUserPage() {
  const router = useRouter();

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  const api = axios.create({
    baseURL: baseUrl,
    withCredentials: true, // send cookies/session if needed
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const handleAddUser = async (data: Partial<User>) => {
    try {
      const response = await api.post('/users', data); // adjust endpoint if needed
      alert('User created successfully!');
      console.log('Created user:', response.data);
      router.push('/module/users'); // redirect to user list
    } catch (error: any) {
      console.error('Error creating user:', error.response || error);
      if (error.response?.status === 401) {
        alert('Unauthorized. Please login first.');
        router.push('/login');
      } else {
        alert('Failed to create user. Please try again.');
      }
    }
  };

  return (
    <div className="p-6">
      <PageHeader icon={<Plus className="w-6 h-6" />}>
        Add User
      </PageHeader>
      <UserForm onSubmit={handleAddUser} />
    </div>
  );
}
