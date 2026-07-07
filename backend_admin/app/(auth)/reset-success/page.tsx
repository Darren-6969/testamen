// app/(auth)/reset-success/page.tsx
'use client';

import SuccessVariant1 from './variants/SuccessVariant1';
import SuccessVariant2 from './variants/SuccessVariant2';
import SuccessVariant3 from './variants/SuccessVariant3';
import SuccessVariant4 from './variants/SuccessVariant4';
import SuccessVariant5 from './variants/SuccessVariant5';
import SuccessVariant6 from './variants/SuccessVariant6';

import { variantConfig } from '../lib/variantConfig';

export default function SuccessPage() {
    const variant = variantConfig.success;

    switch (variant) {
        case 1:
            return <SuccessVariant1 />;
        case 2:
            return <SuccessVariant2 />;
        case 3:
            return <SuccessVariant3 />;
        case 4:
            return <SuccessVariant4 />;
        case 5:
            return <SuccessVariant5 />;
        case 6:
            return <SuccessVariant6 />;
        default:
            return <SuccessVariant1 />; // fallback
    }
}
