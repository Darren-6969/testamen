// app/(auth)/login/page.tsx
'use client';

import { Suspense } from 'react';
import LoginVariant1 from './variants/LoginVariant1';
import LoginVariant2 from './variants/LoginVariant2';
import LoginVariant3 from './variants/LoginVariant3';
import LoginVariant4 from './variants/LoginVariant4';
import LoginVariant5 from './variants/LoginVariant5';
import LoginVariant6 from './variants/LoginVariant6';
import { variantConfig } from '../lib/variantConfig';

export default function LoginPage() {
    const variant = variantConfig.login;

    let content;

    switch (variant) {
        case 1: 
            content = <LoginVariant1 />;
            break;
        case 2: 
            content = <LoginVariant2 />;
            break;
        case 3: 
            content = <LoginVariant3 />;
            break;
        case 4: 
            content = <LoginVariant4 />;
            break;
        case 5: 
            content = <LoginVariant5 />;
            break;
        case 6: 
            content = <LoginVariant6 />;
            break;
        default: 
            content = <LoginVariant1 />;
            break;
    }

    return <Suspense fallback={null}>{content}</Suspense>;
}
