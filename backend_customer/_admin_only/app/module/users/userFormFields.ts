// app/users/userFormFields.ts
import { FieldDef } from '@/app/types';
import { User } from '@/app/data/users';

export const userFields: FieldDef<User>[] = [
  {
    key: 'username',
    label: 'Username',
    value: '',
    validationRules: { required: true },
    readOnly: true, // 👈 Makes it non-editable (for example when editing)
  },
  {
    key: 'name',
    label: 'Full Name',
    value: '',
    validationRules: { required: true, minLength: 3 },
  },
  {
    key: 'email',
    label: 'Email',
    value: '',
    validationRules: { required: true, email: true },
  },
  {
    key: 'role',
    label: 'Role',
    value: '',
    options: [
      { label: 'Admin', value: 'Admin' },
      { label: 'User', value: 'User' },
      { label: 'Manager', value: 'Manager' },
    ]
  },
  {
    key: 'status',
    label: 'Status',
    value: 'Active',
    options: [
      { label: 'Active', value: 'Active' },
      { label: 'Inactive', value: 'Inactive' }
    ]
  },
];
