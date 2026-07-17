'use client';

import { useState, Suspense, useTransition, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Notification from '../../components/ui/Notification';
import { APP_CONSTANT } from '../../app/config/Constant';
import { AUTH_IMAGES } from '@/app/(auth)/lib/authAssets';
import PageLoader from '../loader/PageLoader';
import ThemeSwitch from '../../components/ui/ThemeSwitch';
import '../hooks/themes.css';
import Cookies from "js-cookie";

import {
  ChevronLeft,
  ChevronRight,
  Menu,
  User,
  LogOut,
} from 'lucide-react';
import { SidebarItem, fetchModuleList } from '../../app/data/sidebar';

// 🔹 import your Staff type + profile fetcher
import {
  CustomerProfile,
  fetchMyCustomerProfile,
} from '@/app/data/customerProfile';

import {
  fetchUnreadNotificationCount,
  fetchUnreadNotifications,
  NotificationItem,
  markNotificationAsRead, 
} from '@/app/data/notifications';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [sidebarItems, setSidebarItems] = useState<SidebarItem[]>([]);

  // 🔹 current logged-in user
  const [currentUser, setCurrentUser] = useState<CustomerProfile | null>(null);

  // 🔔 notifications
  const [notifCount, setNotifCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifList, setNotifList] = useState<NotificationItem[]>([]);

  // get api path
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  useEffect(() => {
    const loadModules = async () => {
      try {
        const data = await fetchModuleList();
        setSidebarItems(data);
      } catch (error) {
        console.error('Failed to load modules:', error);
      }
    };
    loadModules();
  }, []);

  // 🔹 load current user profile
  useEffect(() => {
    const loadProfile = async () => {
      try {
        // fetchMyCustomerProfile returns a discriminated result so an expired
        // session is distinguishable from an empty profile.
        const result = await fetchMyCustomerProfile();
        if (result.ok) {
          setCurrentUser(result.data);
        } else {
          console.error('Failed to load profile in layout:', result.error);
        }
      } catch (error) {
        console.error('Failed to load profile in layout:', error);
      }
    };
    loadProfile();
  }, []);

  // Load from localStorage on first mount
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved === 'true') {
      setSidebarCollapsed(true);
    }
  }, []);

  useEffect(() => {
    const loadNotifCount = async () => {
      try {
        const count = await fetchUnreadNotificationCount();
        setNotifCount(count);
      } catch (err) {
        console.error('Failed to load notification count:', err);
      }
    };
    loadNotifCount();
  }, []);

  const handleNotificationClick = async () => {
    // toggle panel
    const nextOpen = !notifOpen;
    setNotifOpen(nextOpen);

    if (!nextOpen) return; // closing -> no fetch

    setNotifLoading(true);
    try {
      const list = await fetchUnreadNotifications();
      setNotifList(list);
      setNotifCount(list.length); // keep badge consistent
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setNotifLoading(false);
    }
  };

  const handleNotificationItemClick = async (id: number) => {
    try {
      const ok = await markNotificationAsRead(id);
      if (!ok) return;

      // Remove from list + reduce badge
      setNotifList((prev) => prev.filter((n) => n.id !== id));
      setNotifCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  // Toggle + persist
  const toggleSidebarCollapsed = () => {
    const next = !sidebarCollapsed;
    setSidebarCollapsed(next);
    localStorage.setItem('sidebar-collapsed', String(next));
  };

  // const handleLogout = () => router.push('/');
  const handleLogout = async() => {
    try {
      // ✅ call API logout so server clears httpOnly cookies (if any)
      await fetch(`/api/auth/logout`, {
        method: "POST", // or GET if your backend uses GET
        credentials: "include", // ✅ REQUIRED so cookies are sent
        headers: { "Content-Type": "application/json" },
      });
    } catch (e) {
      console.log("Logout error:", e);
    } finally {
      // if you used old name before:
      Cookies.remove("access_token", { path: "/" });

      // ✅ optional: clear localStorage
      localStorage.removeItem("currentUser");
      localStorage.removeItem("authToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("session_expiry_at");

      router.replace("/login");
    }
  };



  const handleMenuClick = (href: string) => {
    setSidebarOpen(false);
    startTransition(() => router.push(href));
  };

  const handleProfileClick = () => {
    router.push(`/module/setting/profile`);
  }

  // 🔹 derived display values
  // mt_user_account has no separate display-name column; username IS the full
  // name (the legacy my-profile query aliased `username AS name`).
  const displayName = currentUser?.username || 'User';
  const displayEmail = currentUser?.email || '—';

  return (
    <div className="flex h-screen bg-[var(--bg)] text-[var(--text)]">
      {/* Sidebar Overlay (Mobile) */}
      <div
        className={`fixed inset-0 z-30 bg-black/40 transition-opacity md:hidden ${
          sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-full bg-[var(--sidebar-bg)] shadow-lg transform transition-transform duration-300
        md:relative md:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        ${sidebarCollapsed ? 'w-20 md:w-20' : 'w-65 md:w-64'}`}
      >
        <div className="flex flex-col h-full">
          {/* Logo / Brand */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
          <Link href="/module/dashboard" className="flex items-center space-x-2 cursor-pointer">
            <img
              src={sidebarCollapsed ? AUTH_IMAGES.logoCollapsed : AUTH_IMAGES.logo}
              alt="Logo"
              className="transition-all duration-300 w-15 h-auto"
            />
          </Link>
          
          <button
            onClick={() =>
              window.innerWidth < 768
                ? setSidebarOpen(false)
                : toggleSidebarCollapsed()
            }
            className="p-0.5 rounded-lg hover:bg-[var(--sidebar-hover-bg)] transition-colors"
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </button>
        </div>

          {/* Navigation Menu */}
          <nav className="flex-1 p-4 overflow-y-auto">
            {sidebarItems.map((item) => {
              const IconComponent = item.icon;

              const tabGroupMap: Record<string, string[]> = {
                '/module/people': ['/module/staffs', '/module/customers'],
              };

              const isActive =
                pathname.startsWith(item.href) ||
                (tabGroupMap[item.href]?.some((sub) => pathname.startsWith(sub)) ??
                  false);

              return (
                <button
                  key={item.label}
                  onClick={() => handleMenuClick(item.href)}
                  className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-colors text-left
                    ${
                      isActive
                        ? 'bg-[var(--button-bg)] text-[var(--button-text)]'
                        : 'hover:bg-[var(--sidebar-hover-bg)]'
                    }`}
                >
                  <IconComponent className="w-5 h-5 flex-shrink-0" 
                  strokeWidth={1.5}/>
                  {!sidebarCollapsed && (
                    <span className="font-light">{item.label}</span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* User Profile Section */}
          <div 
            className="border-t border-[var(--border-color)] p-4 hover:border-t hover:border-[red] hover:cursor-pointer"
            onClick={handleProfileClick}>
            <div
              className={`flex items-center space-x-3 mb-3 ${
                sidebarCollapsed ? 'justify-center' : ''
              }`}
            >
              <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 flex-shrink-0">
                {currentUser?.picture_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={currentUser.picture_url}
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-4 h-4 text-white" />
                )}
              </div>
              {!sidebarCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {displayName}
                  </p>
                  <p className="text-xs truncate opacity-70">
                    {displayEmail}
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-sm rounded-lg transition-colors hover:bg-[var(--sidebar-hover-bg)]"
            >
              <LogOut className="w-4 h-4" />
              {!sidebarCollapsed && <span>Sign out</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden md:ml-0">
        {/* Top Navigation */}
        <header className="bg-[var(--header-bg)] h-16 flex items-center justify-between px-4 md:px-6 flex-shrink-0">
          <div className="flex items-center space-x-4">
            <button
              className="md:hidden p-2 rounded-lg hover:bg-[var(--sidebar-hover-bg)] transition-colors"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <p className="text-xs opacity-70 hidden sm:block">
                Welcome back, {displayName}
              </p>
            </div>
          </div>

                    <div className="flex items-center space-x-4 relative">
            {/* 🔔 Notification bell + dropdown */}
            <div className="relative">
              <Notification
                count={notifCount}
                onClick={handleNotificationClick}
              />

              {notifOpen && (
                <div
                  className="absolute right-0 mt-2 w-80 bg-[var(--card-bg)]
                             border border-[var(--border-color)]
                             rounded-xl shadow-lg z-50"
                >
                  <div className="px-4 py-2 border-b border-[var(--border-color)] text-sm font-semibold">
                    Notifications
                  </div>

                  <div className="max-h-80 overflow-y-auto">
                    {notifLoading ? (
                      <div className="px-4 py-3 text-xs text-[var(--muted)]">
                        Loading...
                      </div>
                    ) : notifList.length === 0 ? (
                      <div className="px-4 py-3 text-xs text-[var(--muted)]">
                        No unread notifications.
                      </div>
                    ) : (
                      notifList.map((n) => (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => handleNotificationItemClick(n.id)}
                          className="
                            w-full text-left px-4 py-3 border-b border-[var(--border-color)] last:border-b-0
                            hover:bg-black/10 cursor-pointer
                          "
                        >
                          <div className="text-xs font-semibold mb-1">
                            {n.subject}
                          </div>
                          <div className="text-xs text-[var(--muted)]">
                            {n.message}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* <ThemeSwitch /> */}
          </div>

        </header>

        <Suspense fallback={<PageLoader />}>
          <main className="flex-1 overflow-auto">
            {isPending ? (
              <PageLoader />
            ) : (
              <div className="p-4 md:p-6">{children}</div>
            )}
          </main>
        </Suspense>
      </div>
    </div>
  );
}