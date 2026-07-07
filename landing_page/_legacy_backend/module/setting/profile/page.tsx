// app/module/setting/profile/page.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { Staff } from '@/app/data/staffs';
import { fetchMyProfile, updateMyProfile } from '@/app/data/setting';
import PageHeader from '@/components/header/PageHeader';
import FormField from '@/components/input/FormField';
import Input from '@/components/input/Input';
import { toast } from 'sonner';
import { User } from 'lucide-react';

export default function ProfilePage() {
  const [profile, setProfile] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const nameRef = useRef<HTMLInputElement | null>(null);
  const phoneRef = useRef<HTMLInputElement | null>(null);

  // load current profile
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const data = await fetchMyProfile();
        if (!data) {
          toast.error('Unable to load profile. Please ensure you are logged in.');
          return;
        }
        setProfile(data);
      } catch (err) {
        console.error('Error loading profile:', err);
        toast.error('Failed to load profile.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  const handleSave = async () => {
    if (!profile) return;

    // simple front-end validation
    const name = profile.name?.trim() ?? '';
    const phone = profile.phone?.trim() ?? '';

    if (!name) {
      toast.error('Full Name is required');
      nameRef.current?.focus();
      return;
    }

    if (!phone || phone.length < 5) {
      toast.error('Phone Number is required');
      phoneRef.current?.focus();
      return;
    }

    setSaving(true);
    console.log('[Profile] handleSave START', { name, phone });

    try {
      const success = await updateMyProfile({ name, phone });

      console.log('[Profile] handleSave RESULT', success);

      if (success) {
        toast.success('Profile updated successfully!', {
          description: `${name} (${profile.email})`,
        });
      } else {
        toast.error('Failed to update profile.');
      }
    } catch (err) {
      console.error('[Profile] handleSave ERROR', err);
      toast.error('Error updating profile.');
    } finally {
      console.log('[Profile] handleSave END');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center text-sm text-[var(--text)]">
        Loading profile...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6 text-center text-sm text-red-500">
        No profile data found.
      </div>
    );
  }

  return (
    <div
      className="space-y-6"
      style={{
        backgroundColor: 'var(--bg)',
        color: 'var(--text)',
      }}
    >
      <PageHeader icon={<User className="w-6 h-6 text-[#c3195d]" />}>
        <span className="text-[#c3195d]">Profile</span>
      </PageHeader>

      <div
        className="
          max-w-3xl mx-auto rounded-2xl p-8 space-y-8 shadow-sm
          border
          bg-[var(--card-bg)]
          text-[var(--card-text)]
          border-[var(--border-color)]
        "
      >
        <h2 className="text-m font-semibold tracking-[0.08em] text-gray-800 uppercase">
          Update Profile
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Email (read-only) */}
          <FormField label="Email Address" htmlFor="email">
            <Input id="email" value={profile.email} readOnly disabled />
          </FormField>

          {/* Full Name (editable) */}
          <FormField label="Full Name" htmlFor="name" required>
            <Input
              id="name"
              ref={nameRef}
              value={profile.name}
              placeholder="Enter full name"
              onChange={(e) =>
                setProfile((prev) =>
                  prev ? { ...prev, name: e.target.value } : prev
                )
              }
            />
          </FormField>

          {/* Phone Number (editable) */}
          <FormField label="Phone Number" htmlFor="phone" required>
            <Input
              id="phone"
              ref={phoneRef}
              value={profile.phone ?? ''}
              placeholder="Enter phone number"
              onChange={(e) =>
                setProfile((prev) =>
                  prev ? { ...prev, phone: e.target.value } : prev
                )
              }
            />
          </FormField>

          {/* Role (read-only) */}
          <FormField label="Role" htmlFor="role">
            <Input id="role" value={profile.role} readOnly disabled />
          </FormField>

          {/* Status (read-only) */}
          <FormField label="Status" htmlFor="status">
            <Input id="status" value={profile.status} readOnly disabled />
          </FormField>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-color)]">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="
              inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium
              bg-red-600 text-white hover:bg-red-700
              disabled:opacity-60 disabled:cursor-not-allowed
            "
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
