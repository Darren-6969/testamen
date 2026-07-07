import axios from "axios";

export interface Company {
  COMPANYNAME: string;
  BRN: string;
  BRN2?: string;
  SERVICETAXNO?: string;
  ADDRESS1: string;
  ADDRESS2?: string;
  ADDRESS3?: string;
  ADDRESS4?: string | null;
  EMAIL?: string;
}

export const mockCompanies: Company[] = [];

const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
// fetch company profile
export async function fetchCompanyProfile(): Promise<Company | null> {
  const prod = process.env.NEXT_PUBLIC_API_ENABLED;
  if(prod ==="TRUE"){
    try {
      const response = await axios.get<Company>(`/api/company`, {
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching company profile:', error);
      return null;
    }
  }else{
    return mockCompanies[0];
  }
}

export function getMockCompany() {
  return {
    COMPANYNAME: 'REACH TEN MULTIMEDIA SDN BHD',
    BRN2: '200501016334',
    BRN: '693377H',
    SERVICETAXNO: 'Y60-1808-31016555',
    EMAIL: 'account@reach10.com',
    TEL: '+6082-266 888',
    FAX: '+6082-266 566',
    HP: '0111-089 0566',
    ADDRESS:
      'AT612, Level 6, Tower A1, Icom Square, Jalan Pending, 93450 Kuching Sarawak, Malaysia',
  };
}
