// app/users/userFormFields.ts
import { FieldDef } from '@/app/types';
import { Package } from '@/app/data/packages';

export const packageFields: FieldDef<Package>[] = [
  {
    key: 'package_code',
    label: 'Package Code',
    value: '',
    validationRules: { required: true, minLength: 3 },
  },
  {
    key: 'package_name',
    label: 'Package Name',
    value: '',
    validationRules: { required: true },
  },
  {
    key: 'monthly_fee',
    label: 'Price',
    value: '',
    validationRules: { required: true, min: 0 },
  },
  {
    key: 'remarks',
    label: 'Remarks',
    value: '',
    type: 'textarea',
  },
];
