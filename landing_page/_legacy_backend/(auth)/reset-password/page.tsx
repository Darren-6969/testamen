// app/(auth)/reset-password/page.tsx
import { Suspense } from 'react';

import ResetPasswordVariant1 from './variants/ResetPasswordVariant1';
import ResetPasswordVariant2 from './variants/ResetPasswordVariant2';
import ResetPasswordVariant3 from './variants/ResetPasswordVariant3';
import ResetPasswordVariant4 from './variants/ResetPasswordVariant4';
import ResetPasswordVariant5 from './variants/ResetPasswordVariant5';
import ResetPasswordVariant6 from './variants/ResetPasswordVariant6';

import { variantConfig } from '../lib/variantConfig';

function ResetPasswordSwitch() {
  const variant = variantConfig.resetPassword;

  switch (variant) {
    case 1:
      return <ResetPasswordVariant1 />;
    case 2:
      return <ResetPasswordVariant2 />;
    case 3:
      return <ResetPasswordVariant3 />;
    case 4:
      return <ResetPasswordVariant4 />;
    case 5:
      return <ResetPasswordVariant5 />;
    case 6:
      return <ResetPasswordVariant6 />;
    default:
      return <ResetPasswordVariant1 />;
  }
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordSwitch />
    </Suspense>
  );
}
