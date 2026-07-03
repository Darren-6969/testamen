'use client';

import React, { useMemo } from 'react';
import DynamicForm from '@/components/form/FullWidthDynamicForm';
import { useDynamicFields } from '@/components/generic/useDynamicFields';
import { packageFields } from './packageFormFields';
import { Package } from '@/app/data/packages';

interface Props {
  initialData?: Package;
}

export default function PackageForm({ initialData }: Props) {
  // ✅ memoize so reference stays stable unless initialData changes
  const initialFields = useMemo(() => {
    return packageFields.map((f) => ({
      ...f,
      value: initialData ? (initialData as any)[f.key] ?? '' : f.value ?? '',
    }));
  }, [initialData]);

  const { fields } = useDynamicFields<Package>(initialFields);

  return (
    <DynamicForm
      fields={fields}
      readOnly={true}
      submitText={initialData ? "View Package" : "Create Package"}
    />
  );
}