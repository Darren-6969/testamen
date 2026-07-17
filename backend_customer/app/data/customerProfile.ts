// app/data/customerProfile.ts
// The logged-in customer's own account, backed by mt_user_account via
// /api/customer-setting/*.
//
// This used to be typed off `Customer` from ./customers and pointed at
// /api/customers/* — that is the staff-side B2B registry (users/customer tables:
// company address, registration number, signatory). Customers live in
// mt_user_account. The two tables share an id space, so the old
// `PUT /api/customers/:id` wrote to an unrelated staff row.
//
// Also distinct from app/data/setting.ts, which is the staff/telco-template data
// layer (users/staff, branches, packages) and does not apply to customers.
import axios from 'axios';

/** Shape of an mt_user_account row as exposed by GET /api/customer-setting/profile. */
export interface CustomerProfile {
  id: number;
  username: string | null;
  email: string | null;
  phone_number: string | null;
  country_code: string | null;
  referral_code: string | null;
  referral_bonus_mb: string | null;
  feature_id: string | null;
  code_no: string | null;
  /** Raw column: an uploaded filename, or a legacy Facebook OAuth URL. */
  picture: string | null;
  /** Server-resolved src, ready to drop into an <img>. Null when unset. */
  picture_url: string | null;
  status: string | null;
  verification_status: string | null;
  /** Resolved from mt_feature; falls back to 'Free' when feature_id is null. */
  plan_name: string;
  plan_storage_mb: string;
}

/**
 * The only editable fields. email is the login identifier and referral_code is
 * system-generated — both are rejected server-side, not merely readOnly in the
 * UI. picture has its own endpoints.
 */
export interface CustomerProfileUpdate {
  username: string;
  phone_number: string;
}

export interface PasswordChangePayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword?: string;
}

export interface MutationResult {
  success: boolean;
  message?: string;
}

export interface PictureResult extends MutationResult {
  picture_url?: string | null;
}

export type ProfileResult =
  | { ok: true; data: CustomerProfile }
  | { ok: false; error: string };

/** Client-side guard mirroring the server's multer limits. */
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
export const AVATAR_ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

function errorMessage(error: unknown, fallback: string): string {
  const err = error as { response?: { status?: number; data?: { message?: string } } };
  if (err?.response?.status === 401 || err?.response?.status === 403) {
    return 'Your session has expired. Please sign in again.';
  }
  return err?.response?.data?.message || fallback;
}

/**
 * Load the logged-in customer's profile.
 *
 * Returns a discriminated result rather than `null`: a 401/500 must not be
 * indistinguishable from "this account has no profile".
 */
export async function fetchMyCustomerProfile(): Promise<ProfileResult> {
  try {
    const res = await axios.get<CustomerProfile>('/api/customer-setting/profile', {
      withCredentials: true,
    });
    return { ok: true, data: res.data };
  } catch (error) {
    console.error('fetchMyCustomerProfile error:', error);
    return { ok: false, error: errorMessage(error, 'Could not load your profile.') };
  }
}

/**
 * Update full name + phone.
 *
 * No id parameter: the server derives identity from the JWT. The legacy PHP
 * posted a hidden user_id field, which any client could tamper with.
 */
export async function updateMyCustomerProfile(
  data: CustomerProfileUpdate
): Promise<MutationResult> {
  try {
    const res = await axios.put<{ message?: string }>(
      '/api/customer-setting/profile',
      data,
      { withCredentials: true, headers: { 'Content-Type': 'application/json' } }
    );
    return { success: true, message: res.data?.message || 'Profile updated successfully.' };
  } catch (error) {
    console.error('updateMyCustomerProfile error:', error);
    return { success: false, message: errorMessage(error, 'Failed to update profile.') };
  }
}

/**
 * Replace the profile picture. The server deletes the previous file.
 *
 * Avatars are NOT counted against the storage quota — storageController only
 * sums mt_photo/mt_video/mt_memorial_background/mt_cemetary_image.
 */
export async function uploadMyPicture(file: File): Promise<PictureResult> {
  try {
    const form = new FormData();
    form.append('picture', file);

    const res = await axios.post<{ message?: string; picture_url?: string }>(
      '/api/customer-setting/profile/picture',
      form,
      { withCredentials: true }
    );

    return {
      success: true,
      message: res.data?.message || 'Profile picture updated.',
      picture_url: res.data?.picture_url ?? null,
    };
  } catch (error) {
    console.error('uploadMyPicture error:', error);
    return { success: false, message: errorMessage(error, 'Failed to upload picture.') };
  }
}

export async function deleteMyPicture(): Promise<MutationResult> {
  try {
    const res = await axios.delete<{ message?: string }>(
      '/api/customer-setting/profile/picture',
      { withCredentials: true }
    );
    return { success: true, message: res.data?.message || 'Profile picture removed.' };
  } catch (error) {
    console.error('deleteMyPicture error:', error);
    return { success: false, message: errorMessage(error, 'Failed to remove picture.') };
  }
}

export async function updateMyPassword(
  data: PasswordChangePayload
): Promise<MutationResult> {
  try {
    const res = await axios.put<{ message?: string }>(
      '/api/customer-setting/password',
      data,
      { withCredentials: true, headers: { 'Content-Type': 'application/json' } }
    );
    return { success: true, message: res.data?.message || 'Password updated successfully.' };
  } catch (error) {
    console.error('updateMyPassword error:', error);
    return { success: false, message: errorMessage(error, 'Failed to update password.') };
  }
}