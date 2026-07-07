// app/(auth)/login/page.tsx
'use client';

import SignupVariant6 from './variants/SignupVariant6';
import { variantConfig } from '../lib/variantConfig';

export default function SignupPage() {
    const variant = variantConfig.login;

    switch (variant) {
        case 6: 
            return <SignupVariant6 />;
        default: 
            return <SignupVariant6 />;
    }
}
