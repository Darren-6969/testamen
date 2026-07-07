'use client';

import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import Input from '../../../../components/input/Input';
import Select from '../../../../components/input/SelectInput';
import FormField from '../../../../components/input/FormField';
import ValidatedButton from '../../../../components/button/ValidatedButton';
import { toast } from 'sonner';
import { useDynamicFields } from '@/components/generic/useDynamicFields';
import { FieldDef } from '../../../types/index';
import { addStaff } from '../../../data/staffs';
import PageHeader from '@/components/header/PageHeader';

// ✅ Create a form type just for creating staff
type StaffCreateForm = {
  username: string;
  email: string;
  name: string;          // use "name" (matches backend + Staff interface)
  phone?: string;        // use "phone" (matches backend + Staff interface)
  status: 'Active' | 'Inactive';
  role: string;          // you send "1"/"2"/"3" (or change to number if needed)
  password: string;
};

export default function AddStaffPage() {
  const router = useRouter();
  const fieldRefs = useRef<Array<HTMLInputElement | HTMLSelectElement | null>>([]);

  const staffFields: FieldDef<StaffCreateForm>[] = [
    { key: 'username', label: 'Username', value: '', validationRules: { required: true } },
    { key: 'email', label: 'Email Address', value: '', validationRules: { required: true, email: true } },
    { key: 'name', label: 'Full Name', value: '', validationRules: { required: true, minLength: 3 } },
    { key: 'phone', label: 'Phone Number', value: '' },

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
      value: '2',
      validationRules: { required: true },
      options: [
        { label: 'Admin', value: '1' },
        { label: 'User', value: '2' },
        { label: 'Manager', value: '3' },
      ],
    },

    { key: 'password', label: 'Password', value: '', validationRules: { required: true, minLength: 6 } },
  ];

  const { fields, handleFieldChange } = useDynamicFields(staffFields);

  const validatedFields = fields.map((f, idx) => ({
    name: f.label,
    value: f.value,
    validationRules: f.validationRules,
    ref: { current: fieldRefs.current[idx] } as any,
  }));

  return (
    <div className="p-6 space-y-6">
      {/* ✅ remove activeTab prop because your PageHeaderProps doesn't have it */}
      <PageHeader>Add Staff</PageHeader>

      <div className="bg-white shadow-sm rounded-2xl p-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {fields.map((f) => (
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
                />
              ) : (
                <Input
                  id={String(f.key)}
                  type={f.key === 'password' ? 'password' : 'text'}
                  value={String(f.value ?? '')}
                  placeholder={`Enter ${f.label.toLowerCase()}`}
                  onChange={e => handleFieldChange(f.key, e.target.value)}
                />
              )}
            </FormField>
          ))}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <ValidatedButton
            variant="danger"
            fields={validatedFields}
            onValidSubmit={async () => {
              const staffData = Object.fromEntries(fields.map(f => [String(f.key), f.value])) as Partial<StaffCreateForm>;

              const success = await addStaff(staffData as any); // or update addStaff typing to accept StaffCreateForm

              if (success) {
                toast.success('Staff added successfully!', {
                  description: `${staffData.name} (${staffData.email})`,
                });
                router.push('/module/people');
              } else {
                toast.error('Failed to add staff.');
              }
            }}
          >
            Save Staff
          </ValidatedButton>

          <ValidatedButton variant="outline" fields={[]} onValidSubmit={() => router.push('/module/people')}>
            Cancel
          </ValidatedButton>
        </div>
      </div>
    </div>
  );
}
