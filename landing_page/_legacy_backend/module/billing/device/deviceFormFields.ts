// app/users/userFormFields.ts
import { FieldDef } from '@/app/types';
import { Device } from '@/app/data/devices';

export const deviceFields: FieldDef<Device>[] = [
  {
    key: 'device_code',
    label: 'Device Code',
    value: '',
    validationRules: { required: true, minLength: 3 },
  },
  {
    key: 'device_name',
    label: 'Device Name',
    value: '',
    validationRules: { required: true },
  },
  {
    key: 'device_price',
    label: 'Price',
    value: '',
    validationRules: { required: true, min: 0 },
  },
  {
    key: 'remarks',
    label: 'Remarks',
    value: '',
  },
];
