// app/(auth)/forgot-password/page.tsx
'use client';

import ForgotPasswordVariant1 from './variants/ForgotPasswordVariant1';
import ForgotPasswordVariant2 from './variants/ForgotPasswordVariant2';
import ForgotPasswordVariant3 from './variants/ForgotPasswordVariant3';
import ForgotPasswordVariant4 from './variants/ForgotPasswordVariant4';
import ForgotPasswordVariant5 from './variants/ForgotPasswordVariant5';
import ForgotPasswordVariant6 from './variants/ForgotPasswordVariant6';
import { variantConfig } from '../lib/variantConfig';

export default function ForgotPasswordPage() {
    const variant = variantConfig.forgotPassword;

    switch (variant) {
        case 1: 
            return <ForgotPasswordVariant1 />;
        case 2: 
            return <ForgotPasswordVariant2 />;
        case 3: 
            return <ForgotPasswordVariant3 />;
        case 4: 
            return <ForgotPasswordVariant4 />;
        case 5: 
            return <ForgotPasswordVariant5 />;
        case 6: 
            return <ForgotPasswordVariant6 />;
        default: 
            return <ForgotPasswordVariant1 />;
    }
}
