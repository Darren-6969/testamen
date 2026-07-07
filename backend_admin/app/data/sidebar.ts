// src/utils/sidebar.ts
import axios from 'axios';
import { 
  User, 
  LayoutDashboard, 
  UserPlus,
  UserRound,
  HandHeart, 
  ReceiptText,
  TriangleAlert, 
  CreditCard, 
  Feather,
  Wrench, 
  MessageSquareText,
  Package, 
  SlidersHorizontal, 
  HeartHandshake,
  ChartNoAxesCombined, 
  UserCog,
  HelpCircle, 
  LayoutGrid,
  Database,
  ChartColumn,
  Settings,
  Save
} from 'lucide-react';

export type AllowedIcons = typeof User | typeof LayoutDashboard | typeof UserPlus | typeof HandHeart | typeof LayoutGrid | typeof ReceiptText | typeof TriangleAlert | typeof CreditCard | typeof Feather | typeof Wrench | typeof MessageSquareText | typeof Package | typeof SlidersHorizontal | typeof HeartHandshake | typeof ChartNoAxesCombined | typeof UserCog | typeof HelpCircle | typeof Database | typeof ChartColumn | typeof Settings | typeof Save;

// Types
interface RawSidebarItem {
  icon: string;
  label: string;
  href: string;
}

export interface SidebarItem {
  label: string;
  href: `/module/${string}`;
  icon: AllowedIcons;
}

// Icon name mapping
const ICON_MAP: Record<string, AllowedIcons> = {
  LayoutDashboard,
  LayoutGrid,
  UserPlus,
  UserRound,
  HandHeart,
  ReceiptText,
  TriangleAlert,
  CreditCard,
  Feather,
  Wrench,
  MessageSquareText,
  Package,
  SlidersHorizontal,
  HeartHandshake,
  ChartNoAxesCombined,
  UserCog,
  Database,
  ChartColumn,
  Settings,
  Save,
};

function transformSidebarItems(raw: RawSidebarItem[]): SidebarItem[] {
  return raw.map((item) => ({
    label: item.label,
    href: item.href as `/module/${string}`,
    icon: ICON_MAP[item.icon] ?? HelpCircle,
  }));
}

// API
const baseUrl = process.env.NEXT_PUBLIC_API_URL!;

export async function fetchModuleList(): Promise<SidebarItem[]> {
  const response = await axios.get<RawSidebarItem[]>(
    `/api/users/modulelist`,
    { withCredentials: true }
  );

  return transformSidebarItems(response.data);
}
