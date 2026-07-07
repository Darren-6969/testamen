'use client';

import { updateStaff, fetchStaffById } from '../../../data/staffs';
import { useRef, useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Input from '@/components/input/Input';
import Select from '@/components/input/SelectInput';
import FormField from '@/components/input/FormField';
import { toast } from 'sonner';
import ValidatedButton from '@/components/button/ValidatedButton';
import { useDynamicFields } from '@/components/generic/useDynamicFields';
import { FieldDef } from '../../../types/index';
import PageHeader from '@/components/header/PageHeader';

// ✅ form type for edit (matches staffs.ts Staff interface + backend payload)
type StaffEditForm = {
  username: string;
  email: string;
  name: string;
  phone?: string;
  status: 'Active' | 'Inactive';
  role: string; // "Admin" | "User" | "Manager" (or whatever your backend accepts)
};

export default function EditStaffPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('id');

  const fieldRefs = useRef<Array<HTMLInputElement | HTMLSelectElement | null>>([]);
  const [loading, setLoading] = useState(true);

  // ✅ Memoize fields so useDynamicFields doesn't recreate state every render
  const staffFields = useMemo<FieldDef<StaffEditForm>[]>(() => [
    { key: 'username', label: 'Username', value: '', readOnly: true },
    { key: 'email', label: 'Email Address', value: '', readOnly: true },
    { key: 'name', label: 'Full Name', value: '', validationRules: { required: true, minLength: 3 } },
    { key: 'phone', label: 'Phone Number', value: '', validationRules: { required: true } },
    {
      key: 'status',
      label: 'Status',
      value: 'Active',
      validationRules: { required: true },
      options: [
        { label: 'Active', value: 'Active' },
        { label: 'Inactive', value: 'Inactive' },
      ],
    },
    {
      key: 'role',
      label: 'Role',
      value: 'User',
      validationRules: { required: true },
      options: [
        { label: 'Admin', value: 'Admin' },
        { label: 'User', value: 'User' },
        { label: 'Manager', value: 'Manager' },
      ],
    },
  ], []);

  const { fields, setFields, handleFieldChange } = useDynamicFields(staffFields);

  // ✅ Fetch once per userId (prevents refresh-like loops)
  const didFetch = useRef(false);

  useEffect(() => {
    didFetch.current = false;
    setLoading(true);
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      toast.error('Invalid staff ID.');
      setLoading(false);
      return;
    }
    if (didFetch.current) return;
    didFetch.current = true;

    const run = async () => {
      try {
        const data = await fetchStaffById(Number(userId));
        if (!data) {
          toast.error('Staff not found.');
          return;
        }

        // ✅ map backend Staff -> form keys
        setFields(prev =>
          prev.map(f => {
            const key = String(f.key);

            // if backend returns phone maybe undefined/null
            const value =
              key === 'username' ? (data as any).username ?? '' :
              key === 'email' ? (data as any).email ?? '' :
              key === 'name' ? (data as any).name ?? '' :
              key === 'phone' ? (data as any).phone ?? '' :
              key === 'status' ? ((data as any).status ?? 'Active') :
              key === 'role' ? ((data as any).role ?? 'User') :
              f.value;

            return { ...f, value };
          })
        );
      } catch (err) {
        console.error('❌ Error fetching staff:', err);
        toast.error('Failed to load staff.');
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [userId, setFields]);

  const validatedFields = fields.map((f, idx) => ({
    name: f.label,
    value: f.value,
    validationRules: f.validationRules,
    hidden: f.hidden,
    disabled: f.disabled,
    ref: { current: fieldRefs.current[idx] } as any,
  }));

  if (loading) return <div className="text-center text-lg py-20">Loading staff data...</div>;

  return (
    <div className="p-6 space-y-6">
      <PageHeader>Edit Staff</PageHeader>

      <div className="bg-white shadow-sm rounded-2xl p-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {fields.map((f) =>
            f.hidden ? null : (
              <FormField
                key={String(f.key)}
                label={f.label}
                htmlFor={String(f.key)}
                required={f.validationRules?.required}
              >
                {f.options ? (
                  <Select
                    id={String(f.key)}
                    label={f.label}
                    value={String(f.value ?? '')}
                    options={f.options.map(o => ({ ...o, value: String(o.value) }))}
                    onChange={e => handleFieldChange(f.key, e.target.value)}
                    disabled={f.disabled}
                  />
                ) : (
                  <Input
                    id={String(f.key)}
                    value={String(f.value ?? '')}
                    placeholder={`Enter ${f.label.toLowerCase()}`}
                    onChange={e => handleFieldChange(f.key, e.target.value)}
                    disabled={f.disabled}
                    readOnly={f.readOnly}
                  />
                )}
              </FormField>
            )
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-color)]">
          <ValidatedButton
            variant="danger"
            fields={validatedFields}
            onValidSubmit={async () => {
              if (!userId) return;

              const payload = Object.fromEntries(
                fields.map(f => [String(f.key), f.value ?? ''])
              ) as Partial<StaffEditForm>;

              // ✅ updateStaff expects Partial<Staff> in your data layer
              // Staff has: name, email, role, phone, status (id optional)
              const success = await updateStaff(Number(userId), {
                username: payload.username,
                name: payload.name,
                email: payload.email,
                role: payload.role,
                phone: payload.phone,
                status: payload.status,
              });

              if (success) {
                toast.success('Staff updated successfully!', {
                  description: `${payload.name} (${payload.email})`,
                });
                router.push('/module/people');
              } else {
                toast.error('Failed to update staff.');
              }
            }}
          >
            Save Changes
          </ValidatedButton>

          <ValidatedButton variant="outline" fields={[]} onValidSubmit={() => router.push('/module/people')}>
            Cancel
          </ValidatedButton>
        </div>
      </div>
    </div>
  );
}
