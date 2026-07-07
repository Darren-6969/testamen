// types/index.ts

export type { Registration } from '../data/registration';

// User model
export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  department?: string;
  block?: string;
  unit?: string;
  field1?: number;
  field2?: number;
  field3?: number; // calculated
}

// // Staff model
// export interface Staff {
//   staffName?: string;
//   email?: string;
//   contact?: string;
//   department?: string;
//   branch?: string;
//   designation?: string;
//   username?: string;
//   password?: string;
//   balance?: number;
//   outstanding?: number;
// }

export interface FieldDef<T = any> {
  key: Extract<keyof T, string>;
  label: string;
  value: any;
  validationRules?: {
    required?: boolean;
    minLength?: number;
    email?: boolean;
    min?: number;
    max?: number;
  };
  options?: { label: string; value: string | number }[];
  hidden?: boolean;
  disabled?: boolean;
  readOnly?: boolean; // ✅ add this
  type?: 'text' | 'number' | 'textarea' | 'select' | 'password' | 'date' | 'datetime-local' | 'checkbox';
  dependsOn?: {
    keys: Extract<keyof T, string>[];
    condition?: (values: Record<string, any>) => boolean;
    calculate?: (values: Record<string, any>) => any;
  };
}
