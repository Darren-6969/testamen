import axios from 'axios';
import type { Customer } from './customers';

export type CustomerProfile = Customer;

export type CustomerProfileUpdate = Partial<
  Pick<
    Customer,
    | 'name'
    | 'contact_no'
    | 'company_address'
    | 'company_city'
    | 'company_postcode'
    | 'registration_num'
    | 'company_fax'
    | 'admin_title'
    | 'admin_name'
    | 'admin_address'
    | 'admin_city'
    | 'admin_postcode'
    | 'admin_email'
    | 'admin_contact'
    | 'admin_fax'
    | 'signatory_name'
    | 'signatory_designation'
    | 'signatory_icnum'
  >
>;

export async function fetchMyCustomerProfile(): Promise<CustomerProfile | null> {
  try {
    const res = await axios.get<CustomerProfile>('/api/customers/me', {
      withCredentials: true,
    });

    return res.data;
  } catch (error) {
    console.error('Error fetching customer profile:', error);
    return null;
  }
}

export async function updateMyCustomerProfile(
  id: number,
  data: CustomerProfileUpdate
): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await axios.put<{ message?: string }>(
      `/api/customers/${id}`,
      data,
      {
        withCredentials: true,
      }
    );

    return {
      success: true,
      message: res.data?.message || 'Profile updated successfully.',
    };
  } catch (error: any) {
    console.error('Error updating customer profile:', error);
    return {
      success: false,
      message:
        error?.response?.data?.message || 'Failed to update customer profile.',
    };
  }
}
