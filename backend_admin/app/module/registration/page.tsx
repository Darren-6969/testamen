'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/header/PageHeader';
import GenericTablePage from '@/components/generic/GenericTablePage';
import { UserPlus, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

import {
  fetchRegistrations,
  Registration,
} from '@/app/data/registration';

import {
  registrationTableColumns,
} from '@/app/config/RegistrationTableConfig';

type SortConfig = {
  key: keyof Registration | null;
  direction: 'ascending' | 'descending' | null;
};

export default function RegistrationPage() {
  const router = useRouter();
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: null });

  const handleView = (row: Registration) => {
    router.push(`/module/registration/view/${row.id}`);
  };

  const handleEdit = (row: Registration) => {
    router.push(`/module/registration/edit/${row.id}`);
  };

  const handleDelete = async (row: Registration) => {
    const confirmDelete = confirm(
      `Are you sure you want to delete ${row.username}?`
    );

    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/registration/${row.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete');

      alert('Deleted successfully');
      router.refresh();
    } catch (error) {
      console.error(error);
      alert('Delete failed');
    }
  };


  const handleSort = (key: keyof Registration) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };


  const fetchSortedRegistrations = async () => {
    const data = await fetchRegistrations();
    
    if (!sortConfig.key || !sortConfig.direction) return data;

    return [...data].sort((a, b) => {
      const sortKey = sortConfig.key!;
      const aValue = a[sortKey];
      const bValue = b[sortKey];

      if (aValue == null) return 1;
      if (bValue == null) return -1;

      if (aValue < bValue) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
  };

  const baseColumns = registrationTableColumns(handleView, handleEdit, handleDelete);
  
  const sortedColumns = baseColumns.map((col) => {
    if (col.key === 'action') return col;

    const columnKey = (col.key === 'created' ? 'registration_date' : col.key) as keyof Registration;

    return {
      ...col,
      label: (
        <button
          type="button"
          onClick={() => handleSort(columnKey)}
          className={`flex items-center gap-1 font-semibold hover:text-gray-900 transition-colors ${
            col.key === 'email' ? 'w-full justify-center' : ''
          }`}
        >
          <span>{col.label}</span>
          {sortConfig.key === columnKey ? (
            sortConfig.direction === 'ascending' ? (
              <ArrowUp className="w-3.5 h-3.5 text-[#c3195d]" />
            ) : (
              <ArrowDown className="w-3.5 h-3.5 text-[#c3195d]" />
            )
          ) : (
            <ArrowUpDown className="w-3.5 h-3.5 text-gray-400 opacity-60" />
          )}
        </button>
      ),
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader 
        icon={<UserPlus className="w-5 h-5 text-[#c3195d]" />}
        subtitle="Overview of all registered users"
      >
        <span className="text-[#c3195d]">Registration</span>
      </PageHeader>

      {/* Table Component */}
      <GenericTablePage
        key={`${sortConfig.key}-${sortConfig.direction}`}
        fetchData={fetchSortedRegistrations}
        columns={sortedColumns}
      />
    </div>
  );
}
