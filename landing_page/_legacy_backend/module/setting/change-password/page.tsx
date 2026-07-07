// app/module/setting/password/page.tsx
'use client';

import { useState, useRef } from 'react';
import PageHeader from '@/components/header/PageHeader';
import FormField from '@/components/input/FormField';
import Input from '@/components/input/Input';
import { updateMyPassword } from '@/app/data/setting';
import { toast } from 'sonner';
import { Lock } from 'lucide-react';

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

  setSaving(true);
  console.log('[ChangePassword] START');

  try {
    const result = await updateMyPassword({
      currentPassword: curr,
      newPassword: next,
      confirmPassword: confirm,
    });

    console.log('[ChangePassword] RESULT', result);

    if (result.success) {
      toast.success(result.message || 'Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      toast.error(result.message || 'Failed to update password.');
    }
  } catch (err) {
    console.error('[ChangePassword] ERROR', err);
    toast.error('Error updating password.');
  } finally {
    console.log('[ChangePassword] END');
    setSaving(false);
  }
};


  return (
    <div
      className="space-y-6"
      style={{
        backgroundColor: 'var(--bg)',
        color: 'var(--text)',
      }}
    >
      <PageHeader icon={<Lock className="w-6 h-6 text-[#c3195d]" />}>
        <span className="text-[#c3195d]">Change Password</span>
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
          Change Password
        </h2>

        <div className="grid grid-cols-1 gap-6">
          {/* Current password */}
          <FormField label="Current Password" htmlFor="current_password" required>
            <Input
              id="current_password"
              type="password"
              ref={currentRef}
              value={currentPassword}
              placeholder="Enter current password"
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </FormField>

          {/* New password */}
          <FormField label="New Password" htmlFor="new_password" required>
            <Input
              id="new_password"
              type="password"
              ref={newRef}
              value={newPassword}
              placeholder="Enter new password"
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </FormField>

          {/* Confirm password */}
          <FormField
            label="Confirm New Password"
            htmlFor="confirm_password"
            required
          >
            <Input
              id="confirm_password"
              type="password"
              ref={confirmRef}
              value={confirmPassword}
              placeholder="Re-enter new password"
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </FormField>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-color)]">
          <button
            type="button"
            onClick={handleChangePassword}
            disabled={saving}
            className="
              inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium
              bg-[#c3195d] text-white hover:bg-red-700
              disabled:opacity-60 disabled:cursor-not-allowed
            "
          >
            {saving ? 'Updating...' : 'Change Password'}
          </button>
        </div>
      </div>
    </div>
  );
}
