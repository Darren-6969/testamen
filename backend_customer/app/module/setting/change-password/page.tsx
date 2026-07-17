// app/module/setting/change-password/page.tsx
'use client';

import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Lock } from 'lucide-react';
import PageHeader from '@/components/header/PageHeader';
import FormField from '@/components/input/FormField';
import Input from '@/components/input/Input';
import SettingCard from '@/components/setting/SettingCard';
import SettingSaveButton from '@/components/setting/SettingSaveButton';
import { updateMyPassword } from '@/app/data/customerProfile';

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const currentRef = useRef<HTMLInputElement | null>(null);
  const newRef = useRef<HTMLInputElement | null>(null);
  const confirmRef = useRef<HTMLInputElement | null>(null);

  const handleChangePassword = async () => {
    const curr = currentPassword.trim();
    const next = newPassword.trim();
    const confirm = confirmPassword.trim();

    if (!curr) {
      toast.error('Current password is required');
      currentRef.current?.focus();
      return;
    }
    if (!next || next.length < 6) {
      toast.error('New password must be at least 6 characters');
      newRef.current?.focus();
      return;
    }
    if (next !== confirm) {
      toast.error('New password and confirm password do not match');
      confirmRef.current?.focus();
      return;
    }
    if (curr === next) {
      toast.error('New password must be different from the current password');
      newRef.current?.focus();
      return;
    }

    setSaving(true);
    const result = await updateMyPassword({
      currentPassword: curr,
      newPassword: next,
      confirmPassword: confirm,
    });
    setSaving(false);

    if (!result.success) {
      toast.error(result.message || 'Failed to update password.');
      return;
    }

    toast.success(result.message || 'Password updated successfully');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div
      className="space-y-6"
      style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}
    >
      <PageHeader
        icon={<Lock className="w-6 h-6 text-[#c3195d]" />}
        subtitle="Update your login password"
      >
        <span className="text-[#c3195d]">Change Password</span>
      </PageHeader>

      <SettingCard
        title="Change Password"
        footer={
          <SettingSaveButton
            onClick={handleChangePassword}
            saving={saving}
            savingLabel="Updating..."
          >
            Change Password
          </SettingSaveButton>
        }
      >
        <div className="grid grid-cols-1 gap-6">
          <FormField label="Current Password" htmlFor="current_password" required>
            <Input
              id="current_password"
              type="password"
              ref={currentRef}
              value={currentPassword}
              placeholder="Enter current password"
              autoComplete="current-password"
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </FormField>

          <FormField
            label="New Password"
            htmlFor="new_password"
            required
            helperText="At least 6 characters."
          >
            <Input
              id="new_password"
              type="password"
              ref={newRef}
              value={newPassword}
              placeholder="Enter new password"
              autoComplete="new-password"
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </FormField>

          <FormField label="Confirm New Password" htmlFor="confirm_password" required>
            <Input
              id="confirm_password"
              type="password"
              ref={confirmRef}
              value={confirmPassword}
              placeholder="Re-enter new password"
              autoComplete="new-password"
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </FormField>
        </div>
      </SettingCard>
    </div>
  );
}