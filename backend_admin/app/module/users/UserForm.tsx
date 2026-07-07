'use client';

import React from 'react';
import DynamicForm from '@/components/form/FullWidthDynamicForm';
import { useDynamicFields } from '@/components/generic/useDynamicFields';
import { userFields } from './userFormFields';
import { User } from '@/app/data/users';

interface Props {
  initialData?: User;  // For edit page
  onSubmit: (data: Partial<User>) => void;
}

export default function UserForm({ initialData, onSubmit }: Props) {
  // Initialize fields with initialData if available
  const initialFields = userFields.map(f => ({
    ...f,
    value: initialData ? (initialData as any)[f.key] ?? '' : f.value ?? '',
  }));

  const { fields, setFields, handleFieldChange } = useDynamicFields<User>(initialFields);

  const handleSubmit = () => {
    const payload: Record<string, any> = {};
    fields.forEach(f => (payload[f.key] = f.value));
    onSubmit(payload);
  };

  return (
    <DynamicForm
      fields={fields}
      onFieldChange={handleFieldChange}
      onSubmit={handleSubmit}
      submitText={initialData ? "Update User" : "Create User"}
    />
  );
}