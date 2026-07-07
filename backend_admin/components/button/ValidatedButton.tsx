// components/button/ValidatedButton.tsx

'use client';

import { ReactNode, useState } from 'react';
import Button from './Button';
import { ButtonProps } from './ButtonConfig';
import { toast } from 'sonner';

interface Field {
  name: string;
  value: any;
  validationRules?: {
    required?: boolean;
    minLength?: number;
    email?: boolean;
  };
  hidden?: boolean;
  disabled?: boolean;
}

interface ValidatedButtonProps extends Pick<ButtonProps, 'variant' | 'size' | 'fullWidth' | 'className' | 'disabled'> {
  children: ReactNode;
  fields: Field[];
  onValidSubmit: () => void | Promise<void>;
}

export default function ValidatedButton({
  children,
  fields,
  onValidSubmit,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  disabled = false,
}: ValidatedButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (loading || disabled) return;

    const errors: string[] = [];

    const visibleFields = fields.filter(f => !f.hidden && !f.disabled);

    visibleFields.forEach(f => {
      const val = f.value;
      const rules = f.validationRules;
      if (!rules) return;

      if (rules.required && (!val || String(val).trim() === '')) {
        errors.push(`${f.name} is required`);
      }
      if (rules.minLength && String(val).length < rules.minLength) {
        errors.push(`${f.name} must be at least ${rules.minLength} characters`);
      }
      if (rules.email && !/^\S+@\S+\.\S+$/.test(String(val))) {
        errors.push(`${f.name} must be a valid email`);
      }
    });

    if (errors.length > 0) {
      toast.error(
        <ul className="list-disc list-inside space-y-1">
          {errors.map((err, idx) => (
            <li key={idx}>{err}</li>
          ))}
        </ul>,
        { position: 'top-center' }
      );
      return;
    }

    setLoading(true);
    try {
      await onValidSubmit();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      fullWidth={fullWidth}
      className={className}
      onClick={handleClick}
      loading={loading}
      disabled={disabled}
    >
      {children}
    </Button>
  );
}