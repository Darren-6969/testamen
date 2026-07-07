'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import axios from 'axios';
import UserForm from '../UserForm';
import { User } from '@/app/data/users';
import PageHeader from '@/components/header/PageHeader';
import { SquarePen } from 'lucide-react';

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRef = useRef(false); // Prevent double fetch in Strict Mode

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  const api = axios.create({
    baseURL: baseUrl,
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json',
      // 'Authorization': `Bearer ${token}`, // if using JWT
    },
  });

  // ------------------- Fetch single user -------------------
  useEffect(() => {
    if (!id || fetchRef.current) return;
    fetchRef.current = true;

    const fetchUserById = async () => {
      try {
        const response = await api.get<User>(`/users/${id}`);
        setUser(response.data);
      } catch (error: any) {
        console.error("Error fetching user:", error.response || error);
        if (error.response?.status === 401) {
          alert("Unauthorized. Please login first.");
          router.push('/login');
        } else {
          alert("Failed to fetch user. Please try again.");
          router.push('/module/users');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserById();
  }, [id, router]);

  // ------------------- Update user -------------------
  const handleUpdateUser = async (data: Partial<User>) => {
    if (!id) return;
    try {
      await api.put(`/users/${id}`, data);
      alert("User updated successfully!");
      router.push('/module/users');
    } catch (error: any) {
      console.error("Error updating user:", error.response || error);
      if (error.response?.status === 401) {
        alert("Unauthorized. Please login first.");
        router.push('/login');
      } else {
        alert("Failed to update user. Please try again.");
      }
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!user) return <p>User not found</p>;

  return (
    <div className="p-6">
      <PageHeader icon={<SquarePen className="w-6 h-6" />}>
        Edit User
      </PageHeader>
      <UserForm initialData={user} onSubmit={handleUpdateUser} />
    </div>
  );
}