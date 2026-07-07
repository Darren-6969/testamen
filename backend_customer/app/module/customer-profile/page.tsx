'use client';

import { useEffect, useState } from 'react';
import PageHeader from '@/components/header/PageHeader';
import FormField from '@/components/input/FormField';
import Input from '@/components/input/Input';
import ValidatedButton from '@/components/button/ValidatedButton';
import { toast } from 'sonner';
import { User } from 'lucide-react';
import {
  CustomerProfile,
  CustomerProfileUpdate,
  fetchMyCustomerProfile,
  updateMyCustomerProfile,
} from '@/app/data/customerProfile';

const editableFields: Array<{
  key: keyof CustomerProfileUpdate;
  label: string;
}> = [
  { key: 'name', label: 'Company Name' },
  { key: 'contact_no', label: 'Contact Number' },
  { key: 'company_address', label: 'Company Address' },
  { key: 'company_city', label: 'Company City' },
  { key: 'company_postcode', label: 'Company Postcode' },
  { key: 'registration_num', label: 'Registration Number' },
  { key: 'company_fax', label: 'Company Fax' },
  { key: 'admin_title', label: 'Billing/Admin Title' },
  { key: 'admin_name', label: 'Billing/Admin Name' },
  { key: 'admin_address', label: 'Billing/Admin Address' },
  { key: 'admin_city', label: 'Billing/Admin City' },
  { key: 'admin_postcode', label: 'Billing/Admin Postcode' },
  { key: 'admin_email', label: 'Billing/Admin Email' },
  { key: 'admin_contact', label: 'Billing/Admin Contact' },
  { key: 'admin_fax', label: 'Billing/Admin Fax' },
  { key: 'signatory_name', label: 'Signatory Name' },
  { key: 'signatory_designation', label: 'Signatory Designation' },
  { key: 'signatory_icnum', label: 'Signatory IC Number' },
];

export default function CustomerProfilePage() {
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [form, setForm] = useState<CustomerProfileUpdate>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      const data = await fetchMyCustomerProfile();
      setProfile(data);

      if (data) {
        setForm(
          editableFields.reduce<CustomerProfileUpdate>((acc, field) => {
            acc[field.key] = data[field.key] as string | undefined;
            return acc;
          }, {})
        );
      }

      setLoading(false);
    };

    loadProfile();
  }, []);

  const handleSave = async () => {
    if (!profile) return;

    setSaving(true);
    const result = await updateMyCustomerProfile(profile.id, form);
    setSaving(false);

    if (!result.success) {
      toast.error(result.message || 'Failed to update profile.');
      return;
    }

    toast.success(result.message || 'Profile updated successfully.');
    setProfile({ ...profile, ...form });
  };

  if (loading) {
    return <div className="py-20 text-center text-lg">Loading profile...</div>;
  }

  if (!profile) {
    return <div className="py-20 text-center text-lg">No profile found.</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<User className="h-5 w-5 text-[#c3195d]" />}
        subtitle="Manage your own customer information"
      >
        <span className="text-[#c3195d]">My Profile</span>
      </PageHeader>

      <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6 shadow-sm">
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <FormField label="Username" htmlFor="username">
            <Input id="username" value={profile.username || ''} readOnly disabled />
          </FormField>
          <FormField label="Email" htmlFor="email">
            <Input id="email" value={profile.email || ''} readOnly disabled />
          </FormField>
          <FormField label="Package" htmlFor="package">
            <Input id="package" value={profile.package_name || ''} readOnly disabled />
          </FormField>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {editableFields.map((field) => (
            <FormField key={field.key} label={field.label} htmlFor={field.key}>
              <Input
                id={field.key}
                value={(form[field.key] as string | undefined) || ''}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    [field.key]: event.target.value,
                  }))
                }
              />
            </FormField>
          ))}
        </div>

        <div className="mt-8 flex justify-end">
          <ValidatedButton
            onValidSubmit={handleSave}
            disabled={saving}
            fields={[
              {
                name: 'Company Name',
                value: form.name || '',
                validationRules: { required: true, minLength: 3 },
              },
            ]}
          >
            Save Profile
          </ValidatedButton>
        </div>
      </div>
    </div>
  );
}
