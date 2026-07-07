import {
  FileText,
  LayoutDashboard,
  ReceiptText,
  Settings,
  User,
} from 'lucide-react';

export type AllowedIcons =
  | typeof LayoutDashboard
  | typeof User
  | typeof ReceiptText
  | typeof FileText
  | typeof Settings;

export interface SidebarItem {
  label: string;
  href: `/module/${string}`;
  icon: AllowedIcons;
}

const CUSTOMER_SIDEBAR_ITEMS: SidebarItem[] = [
  {
    label: 'Dashboard',
    href: '/module/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'My Profile',
    href: '/module/customer-profile',
    icon: User,
  },
  {
    label: 'Billing',
    href: '/module/billing',
    icon: ReceiptText,
  },
  {
    label: 'Obituary',
    href: '/module/obituary',
    icon: FileText,
  },
  {
    label: 'Settings',
    href: '/module/setting',
    icon: Settings,
  },
];

export async function fetchModuleList(): Promise<SidebarItem[]> {
  return CUSTOMER_SIDEBAR_ITEMS;
}
