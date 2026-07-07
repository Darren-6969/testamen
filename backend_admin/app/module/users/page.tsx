'use client';

import GenericTablePage from '@/components/generic/GenericTablePage';
import { fetchUsers } from '@/app/data/users';
import { userColumns } from '@/app/config/UsersTableConfig';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/header/PageHeader';
import { Users } from 'lucide-react';

export default function UsersPage() {
  const router = useRouter();
  const handleDelete = (id: number) => alert(`Delete user ${id}`);

  return (
    <div className="space-y-6">
      <PageHeader icon={<Users className="w-6 h-6" />} subtitle="Manage all users in the system">
        Users
      </PageHeader>

      <GenericTablePage
        fetchData={fetchUsers}
        columns={userColumns(router, handleDelete)}
        addRoute="/module/users/add"
        config={{
          addButtonLabel: 'Add User',
          pageSize: 10,
        }}
      />
    </div>
  );
}
