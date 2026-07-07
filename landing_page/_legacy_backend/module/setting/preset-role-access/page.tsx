// app/module/setting/preset-role-access/page.tsx
'use client';

import { useEffect, useState } from 'react';
import PageHeader from '@/components/header/PageHeader';
import { fetchRoles } from '@/app/data/setting';
import { Role } from '@/app/data/setting';
import { toast } from 'sonner';
import { Shield, Pencil } from 'lucide-react';
import Link from 'next/link';

export default function RoleListPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRoles = async () => {
      try {
        const data = await fetchRoles();
        setRoles(data);
      } catch (err) {
        console.error('Error loading roles:', err);
        toast.error('Failed to load roles.');
      } finally {
        setLoading(false);
      }
    };

    loadRoles();
  }, []);

  return (
    <div
      className="space-y-6"
      style={{
        backgroundColor: 'var(--bg)',
        color: 'var(--text)',
      }}
    >
      <PageHeader icon={<Shield className="w-6 h-6 text-[#c3195d]" />}>
        <span className="text-[#c3195d]">Role Management</span>
      </PageHeader>

      <div
        className="
          max-w-5xl mx-auto rounded-2xl p-6 space-y-6 shadow-sm
          border
          bg-[var(--card-bg)]
          text-[var(--card-text)]
          border-[var(--border-color)]
        "
      >
        <div className="flex items-center justify-between">
          <h2 className="text-m font-semibold tracking-[0.08em] text-gray-800 uppercase">
            ROLES
          </h2>
          <p className="text-xs text-[var(--muted)]">
            Click &quot;Edit Access&quot; to configure which modules each role can access.
          </p>
        </div>

        {loading ? (
          <div className="text-sm text-[var(--muted)]">Loading roles...</div>
        ) : roles.length === 0 ? (
          <div className="text-sm text-red-500">No roles found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-color)] text-left">
                  <th className="py-2 px-3">Role Name</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((role) => (
                  <tr
                    key={role.id}
                    className="border-b border-[var(--border-color)] hover:bg-black/5"
                  >
                    <td className="py-2 px-3 font-medium">
                      {role.role_name}
                    </td>
                    <td className="py-2 px-3">
                      <span
                        className={`
                          inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold
                          ${
                            role.status === 'Active'
                              ? 'bg-green-600/10 text-green-500'
                              : 'bg-zinc-600/10 text-zinc-400'
                          }
                        `}
                      >
                        {role.status || 'Unknown'}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right">
                      <Link
                        href={`/module/setting/preset-role-access/${role.id}`}
                        className="
                          inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium
                          bg-[#c3195d] text-white hover:bg-red-700
                        "
                      >
                        <Pencil className="w-3 h-3" />
                        Edit Access
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
