'use client';

import { useState } from 'react';
import Button from './Button';
import { ButtonProps } from './ButtonConfig';
import { toast } from 'sonner';

interface AsyncButtonProps
  extends Omit<ButtonProps, 'onClick' | 'loading' | 'type'> {
  /** Function to run on click (can be async or sync) */
  onClick: () => void | Promise<void>;

  /** Optional toast messages */
  successMessage?: string;
  errorMessage?: string;

  /** Disable automatic toast notifications */
  disableToast?: boolean;
}

export default function AsyncButton({
  onClick,
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  successMessage,
  errorMessage,
  disableToast = false,
  ...rest
}: AsyncButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (loading) return;

    setLoading(true);
    try {
      await onClick();

      if (!disableToast && successMessage) {
        toast.success(successMessage, { position: 'top-center' });
      }
    } catch (err: any) {
      console.error(err);
      if (!disableToast) {
        toast.error(errorMessage || 'Something went wrong.', {
          position: 'top-center',
        });
      }
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
      loading={loading}
      onClick={handleClick}
      {...rest}
    >
      {children}
    </Button>
  );
}
