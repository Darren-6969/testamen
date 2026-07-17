// app/module/setting/profile/page.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { User } from 'lucide-react';
import PageHeader from '@/components/header/PageHeader';
import FormField from '@/components/input/FormField';
import Input from '@/components/input/Input';
import SettingCard from '@/components/setting/SettingCard';
import SettingSaveButton from '@/components/setting/SettingSaveButton';
import CopyShareField from '@/components/setting/CopyShareField';
import AvatarUpload from '@/components/setting/AvatarUpload';
import {
  CustomerProfile,
  fetchMyCustomerProfile,
  updateMyCustomerProfile,
  uploadMyPicture,
  deleteMyPicture,
  AVATAR_MAX_BYTES,
  AVATAR_ACCEPTED_TYPES,
} from '@/app/data/customerProfile';

const MEMODISE_SITE_URL = 'https://www.memodise.com/';

function buildReferralShareText(code: string): string {
  return [
    'Hi!',
    '',
    'Memodise is a platform to create and preserve digital memorials for loved ones securely and beautifully.',
    '',
    `Here's a referral code to use during registration: ${code}`,
    '',
    'Get started and explore the features today!',
    `Visit: ${MEMODISE_SITE_URL}`,
  ].join('\n');
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const nameRef = useRef<HTMLInputElement | null>(null);
  const phoneRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const load = async () => {
      const result = await fetchMyCustomerProfile();
      if (!result.ok) {
        setError(result.error);
      } else {
        setProfile(result.data);
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async () => {
    if (!profile) return;

    const name = (profile.username || '').trim();
    const phone = (profile.phone_number || '').trim();

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
    const result = await updateMyCustomerProfile({ username: name, phone_number: phone });
    setSaving(false);

    if (!result.success) {
      toast.error(result.message || 'Failed to update profile.');
      return;
    }

    toast.success(result.message || 'Profile updated successfully!', {
      description: `${name} (${profile.email || '—'})`,
    });
  };

  // The picture saves on its own request, independent of Save Changes.
  const handlePictureUpload = async (file: File) => {
    const result = await uploadMyPicture(file);
    if (!result.success) {
      toast.error(result.message || 'Failed to upload picture.');
      return;
    }
    setProfile((prev) =>
      prev ? { ...prev, picture_url: result.picture_url ?? null } : prev
    );
    toast.success(result.message || 'Profile picture updated.');
  };

  const handlePictureRemove = async () => {
    const result = await deleteMyPicture();
    if (!result.success) {
      toast.error(result.message || 'Failed to remove picture.');
      return;
    }
    setProfile((prev) => (prev ? { ...prev, picture: null, picture_url: null } : prev));
    toast.success(result.message || 'Profile picture removed.');
  };

  if (loading) {
    return (
      <div className="p-6 text-center text-sm text-[var(--text)]">
        Loading profile...
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="p-6 text-center text-sm text-red-500">
        {error || 'No profile data found.'}
      </div>
    );
  }

  const referralCode = profile.referral_code || '';

  return (
    <div
      className="space-y-6"
      style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}
    >
      <PageHeader
        icon={<User className="w-6 h-6 text-[#c3195d]" />}
        subtitle="Manage your account information"
      >
        <span className="text-[#c3195d]">My Profile</span>
      </PageHeader>

      <SettingCard
        title="Update Profile"
        footer={
          <SettingSaveButton onClick={handleSave} saving={saving}>
            Save Changes
          </SettingSaveButton>
        }
      >
        <div className="border-b border-[var(--border-color)] pb-6">
          <AvatarUpload
            pictureUrl={profile.picture_url}
            name={profile.username || ''}
            onUpload={handlePictureUpload}
            onRemove={handlePictureRemove}
            maxBytes={AVATAR_MAX_BYTES}
            acceptedTypes={AVATAR_ACCEPTED_TYPES}
            onValidationError={(message) => toast.error(message)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Email is the login identifier — read-only here and rejected server-side. */}
          <FormField label="Email (Login)" htmlFor="email">
            <Input id="email" value={profile.email || ''} readOnly disabled />
          </FormField>

          <FormField label="Full Name" htmlFor="username" required>
            <Input
              id="username"
              ref={nameRef}
              value={profile.username || ''}
              placeholder="Enter full name"
              onChange={(e) =>
                setProfile((prev) => (prev ? { ...prev, username: e.target.value } : prev))
              }
            />
          </FormField>

          <FormField label="Phone Number" htmlFor="phone_number" required>
            <Input
              id="phone_number"
              ref={phoneRef}
              value={profile.phone_number || ''}
              placeholder="Enter phone number"
              onChange={(e) =>
                setProfile((prev) =>
                  prev ? { ...prev, phone_number: e.target.value } : prev
                )
              }
            />
          </FormField>

          <FormField label="Current Plan" htmlFor="plan">
            <Input id="plan" value={profile.plan_name} readOnly disabled />
          </FormField>

          {/* System-generated; never editable. */}
          <div className="md:col-span-2">
            <FormField
              label="Referral Code"
              htmlFor="referral_code"
              helperText={
                referralCode
                  ? 'Share this code to earn bonus storage when someone registers with it.'
                  : 'No referral code has been issued for this account yet.'
              }
            >
              <CopyShareField
                id="referral_code"
                value={referralCode}
                shareTitle="Memodise Referral Code"
                shareText={referralCode ? buildReferralShareText(referralCode) : undefined}
              />
            </FormField>
          </div>
        </div>
      </SettingCard>
    </div>
  );
}