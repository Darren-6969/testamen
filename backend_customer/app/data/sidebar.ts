import {
  LayoutDashboard,
  LayoutGrid,
  FileText,
  HandHeart,
  Settings,
} from 'lucide-react';

export type AllowedIcons =
  | typeof LayoutDashboard
  | typeof LayoutGrid
  | typeof FileText
  | typeof HandHeart
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
    label: 'Admin',
    href: '/module/admin',
    icon: LayoutGrid,
  },
  {
    label: 'Obituary',
    href: '/module/obituary',
    icon: FileText,
  },
  {
    label: 'Love Giving',
    href: '/module/love-giving',
    icon: HandHeart,
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