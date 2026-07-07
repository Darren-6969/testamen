export interface Billing {
  id: number;
  number_list: number;
  invoice_no: string;
  fullname: string;
  plan_code: string;
  amount_rm: number;
  updated_at: string;
  payment_method: string;
  status: string;
}

/**
 * DTO for creating billing (matches Add Bill form)
 */
export interface CreateBillingDTO {
  bill_name: string;
  amount: number;
  email?: string | null;
  description?: string | null;
}

/**
 * DTO for updating billing (partial allowed)
 */
export interface UpdateBillingDTO {
  bill_name?: string;
  amount?: number;
  email?: string | null;
  description?: string | null;
  payment_method?: string;
  status?: string;
}

/**
 * Fetch all billing records
 */
export async function fetchBilling(): Promise<Billing[]> {
  try {
    const res = await fetch('/api/billing/list', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error('Failed to fetch billing records');
    }

    return await res.json();
  } catch (error) {
    console.error('fetchBilling error:', error);
    return [];
  }
}

/**
 * Fetch single billing record by ID
 */
export async function fetchBillingById(id: number): Promise<Billing | null> {
  try {
    const res = await fetch(`/api/billing/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error('Failed to fetch billing record');
    }

    return await res.json();
  } catch (error) {
    console.error('fetchBillingById error:', error);
    return null;
  }
}

/**
 * Create new billing record
 */
export async function createBilling(data: CreateBillingDTO) {
  try {
    const res = await fetch('/api/billing', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      throw new Error('Failed to create billing record');
    }

    return await res.json();
  } catch (error) {
    console.error('createBilling error:', error);
    return null;
  }
}

/**
 * Update billing record
 */
export async function updateBilling(
  id: number,
  data: UpdateBillingDTO
) {
  try {
    const res = await fetch(`/api/billing/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      throw new Error('Failed to update billing record');
    }

    return await res.json();
  } catch (error) {
    console.error('updateBilling error:', error);
    return null;
  }
}

/**
 * Delete billing record
 */
export async function deleteBilling(id: number): Promise<boolean> {
  try {
    const res = await fetch(`/api/billing/${id}`, {
      method: 'DELETE',
    });

    return res.ok;
  } catch (error) {
    console.error('deleteBilling error:', error);
    return false;
  }
}