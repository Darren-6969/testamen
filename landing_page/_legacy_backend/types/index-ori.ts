// types/index.ts

// User model
export interface Staff {
  id?: number;
  username?: string;
  name?: string;
  staffName?: string; // optional alias
  email?: string;
  contact?: string;
  role?: string;
  status?: string;
  department?: string;
  branch?: string;
  designation?: string;
  block?: string;
  unit?: string;
  password?: string;
  field1?: number;
  field2?: number;
  field3?: number;
  balance?: number;
  outstanding?: number;
}

export interface Customer {
  id?: number;
  username?: string;
  password?: string;
  email?: string;
  name?: string;
  phone?: string;
  status?: string;

  // Company Info
  application_type?: string;
  company_address?: string;
  company_city?: string;
  company_postcode?: string;
  registration_num?: string;
  company_fax?: string;

  // Admin Info
  admin_title?: string;
  admin_name?: string;
  admin_address?: string;
  admin_city?: string;
  admin_postcode?: string;
  admin_email?: string;
  admin_contact?: string;
  admin_fax?: string;

  // Package Info
  package_name?: string;
  service_length?: string;

  // Signatory Info
  signatory_name?: string;
  signatory_designation?: string;
  signatory_icnum?: string;

  // Attachments
  form_da?: string;
  form_db?: string;
  forms_9_94?: string;
  forms_13_49?: string;
  forms_79_80_80a_83_83a?: string;
  latest_phone_bill?: string;
  other_attachments?: string;
}

// export interface FieldDef<T = any> {
//   key: keyof T; // can be any property of T
//   label: string;
//   value: any;
//   validationRules?: {
//     required?: boolean;
//     minLength?: number;
//     email?: boolean;
//     min?: number;
//     max?: number;
//   };
//   options?: { label: string; value: string | number }[]; // for select inputs
//   hidden?: boolean;
//   disabled?: boolean;
//   readOnly?: boolean; // ✅ add this line
//   dependsOn?: {
//     keys: (keyof T)[];
//     condition?: (values: Record<string, any>) => boolean; // true if hidden/disabled
//     calculate?: (values: Record<string, any>) => any; // auto-calc value
//   };
// }
export interface FieldDef<T = any> {
  key: keyof T | string; // ✅ allow string keys not strictly in T
  label: string;
  value: any;
  validationRules?: {
    required?: boolean;
    minLength?: number;
    email?: boolean;
    min?: number;
    max?: number;
  };
  options?: { label: string; value: string | number }[]; // for select inputs
  hidden?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  type?: 'text' | 'number' | 'textarea' | 'select' | 'password';
  dependsOn?: {
    keys: (keyof T)[]; // dependent fields
    condition?: (values: Record<string, any>) => boolean; // hide/disable logic
    calculate?: (values: Record<string, any>) => any; // auto-calc value
  };
}
