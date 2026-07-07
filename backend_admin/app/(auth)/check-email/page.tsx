// app/(auth)/check-email/page.tsx
'use client';

import CheckEmailVariant1 from './variants/CheckEmailVariant1';
import CheckEmailVariant2 from './variants/CheckEmailVariant2';
import CheckEmailVariant3 from './variants/CheckEmailVariant3';
import CheckEmailVariant4 from './variants/CheckEmailVariant4';
import CheckEmailVariant5 from './variants/CheckEmailVariant5';
import CheckEmailVariant6 from './variants/CheckEmailVariant6';

import { variantConfig } from '../lib/variantConfig';

export default function CheckEmailPage() {
    const variant = variantConfig.checkEmail;

    switch (variant) {
        case 1:
            return <CheckEmailVariant1 />;
        case 2:
            return <CheckEmailVariant2 />;
        case 3:
            return <CheckEmailVariant3 />;
        case 4:
            return <CheckEmailVariant4 />;
        case 5:
            return <CheckEmailVariant5 />;
        case 6:
            return <CheckEmailVariant6 />;
        default:
            return <CheckEmailVariant1 />; // fallback
    }
}
