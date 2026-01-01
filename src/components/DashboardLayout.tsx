'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import styles from './DashboardLayout.module.css';
import { Icons, getIcon } from './icons';
import type { User, App } from '@/types';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
}

interface UserData {
  user: User;
  apps: App[];
  children?: any[];
}

export default function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();

      if (!data.success) {
        router.push('/login');
        return;
      }

      setUserData(data);
    } catch (error) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!userData) {
    return null;
  }

  const { user, apps } = userData;

  // Determine base path based on role
  const basePath = user.role === 'super_admin'
    ? '/super-admin'
    : user.role === 'admin'
      ? '/admin'
      : '/dashboard';

  // Navigation items
  const navItems = [
    { name: 'Dashboard', href: basePath, icon: 'home' },
    { name: 'My Apps', href: `${basePath}/apps`, icon: 'grid' },
    ...(user.role === 'super_admin' ? [
      { name: 'Manage Users', href: `${basePath}/users`, icon: 'users' },
      { name: 'Manage Apps', href: `${basePath}/manage-apps`, icon: 'layers' },
      { name: 'Permissions', href: `${basePath}/permissions`, icon: 'shield' },
    ] : []),
    { name: 'Profile', href: `${basePath}/profile`, icon: 'user' },
    { name: 'Settings', href: `${basePath}/settings`, icon: 'settings' },
  ];

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'super_admin': return 'Super Admin';
      case 'admin': return 'Administrator';
      case 'parent': return 'Parent';
      case 'student': return 'Student';
      default: return role;
    }
  };

  return (
    <div className={styles.container}>
      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : ''}`}>
        <div className={styles.sidebarHeader}>
          <Link href={basePath} className={styles.logo}>
            <Icons.School size={32} />
            <span>Loretto Portal</span>
          </Link>
          <button
            className={styles.closeSidebar}
            onClick={() => setSidebarOpen(false)}
          >
            <Icons.X size={24} />
          </button>
        </div>

        <nav className={styles.nav}>
          {navItems.map((item) => {
            const Icon = getIcon(item.icon);
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon size={20} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Quick Apps */}
        {apps.length > 0 && (
          <div className={styles.quickApps}>
            <h4>Quick Access</h4>
            {apps.slice(0, 4).map((app) => {
              const Icon = getIcon(app.icon);
              return (
                <Link
                  key={app.id}
                  href={app.route}
                  className={styles.quickAppItem}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon size={16} />
                  <span>{app.name}</span>
                </Link>
              );
            })}
          </div>
        )}

        <div className={styles.sidebarFooter}>
          <button onClick={handleLogout} className={styles.logoutBtn}>
            <Icons.LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.main}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <button
              className={styles.menuBtn}
              onClick={() => setSidebarOpen(true)}
            >
              <Icons.Menu size={24} />
            </button>
            <h1>{title || 'Dashboard'}</h1>
          </div>

          <div className={styles.headerRight}>
            <div className={styles.userInfo}>
              <div className={styles.userAvatar}>
                {user.firstName[0]}{user.lastName[0]}
              </div>
              <div className={styles.userDetails}>
                <span className={styles.userName}>
                  {user.firstName} {user.lastName}
                </span>
                <span className={styles.userRole}>
                  {getRoleLabel(user.role)}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className={styles.content}>
          {children}
        </div>
      </main>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className={styles.overlay}
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
