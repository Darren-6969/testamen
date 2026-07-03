'use client';

import React, { useMemo } from 'react';
import DynamicForm from '@/components/form/FullWidthDynamicForm';
import { useDynamicFields } from '@/components/generic/useDynamicFields';
import { deviceFields } from './deviceFormFields';
import { Device } from '@/app/data/devices';

interface Props {
  initialData?: Device;
  onSubmit?: (data: Partial<Device>) => void;
  mode?: 'view' | 'edit';
}

export default function DeviceForm({ initialData, onSubmit, mode = 'edit' }: Props) {
  // ✅ stable reference unless initialData changes
  const initialFields = useMemo(() => {
    return deviceFields.map((f) => ({
      ...f,
      value: initialData ? (initialData as any)[f.key] ?? '' : f.value ?? '',
    }));
  }, [initialData]);

  const { fields, handleFieldChange } = useDynamicFields<Device>(initialFields);

  const handleSubmit = () => {
    if (mode === 'view') return;

    const payload: Record<string, any> = {};
    fields.forEach((f) => (payload[f.key] = f.value));
    onSubmit?.(payload);
  };

  return (
    <DynamicForm
      fields={fields}
      onFieldChange={handleFieldChange}
      onSubmit={handleSubmit}
      readOnly={mode === 'view'}
      submitText={initialData ? 'Update Device' : 'Create Device'}
    />
  );
}
