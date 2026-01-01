'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { Icons, getIcon } from '@/components/icons';
import styles from './super-admin.module.css';
import type { User, App } from '@/types';

interface DashboardData {
  user: User;
  apps: App[];
  stats: {
    totalUsers: number;
    totalStudents: number;
    totalParents: number;
    totalAdmins: number;
    totalApps: number;
  };
}

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [userRes, statsRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/admin/stats'),
      ]);

      const userData = await userRes.json();

      if (!userData.success) {
        router.push('/login');
        return;
      }

      if (userData.user.role !== 'super_admin') {
        router.push('/dashboard');
        return;
      }

      const statsData = await statsRes.json();

      setData({
        user: userData.user,
        apps: userData.apps,
        stats: statsData.success ? statsData.stats : {
          totalUsers: 0,
          totalStudents: 0,
          totalParents: 0,
          totalAdmins: 0,
          totalApps: 0,
        },
      });
    } catch (error) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <DashboardLayout title="Super Admin Dashboard">
        <div className={styles.loading}>
          <div className="spinner"></div>
        </div>
      </DashboardLayout>
    );
  }

  const { user, apps, stats } = data;

  const quickActions = [
    { name: 'Add Admin', href: '/super-admin/users/add?role=admin', icon: 'user-plus', color: 'var(--primary)' },
    { name: 'Add Student', href: '/super-admin/users/add?role=student', icon: 'user-plus', color: 'var(--success)' },
    { name: 'Add Parent', href: '/super-admin/users/add?role=parent', icon: 'user-plus', color: 'var(--info)' },
    { name: 'Manage Apps', href: '/super-admin/manage-apps', icon: 'layers', color: 'var(--secondary)' },
    { name: 'Permissions', href: '/super-admin/permissions', icon: 'shield', color: 'var(--warning)' },
    { name: 'Announcements', href: '/super-admin/announcements', icon: 'megaphone', color: 'var(--accent)' },
  ];

  return (
    <DashboardLayout title="Super Admin Dashboard">
      {/* Welcome Section */}
      <div className={styles.welcome}>
        <div className={styles.welcomeText}>
          <h2>Welcome, {user.firstName}!</h2>
          <p>Manage the entire school portal from here.</p>
        </div>
        <div className={styles.date}>
          {new Date().toLocaleDateString('en-NG', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </div>
      </div>

      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'var(--primary)' }}>
            <Icons.Users size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{stats.totalUsers}</span>
            <span className={styles.statLabel}>Total Users</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'var(--success)' }}>
            <Icons.User size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{stats.totalStudents}</span>
            <span className={styles.statLabel}>Students</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'var(--info)' }}>
            <Icons.Users size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{stats.totalParents}</span>
            <span className={styles.statLabel}>Parents</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'var(--warning)' }}>
            <Icons.Shield size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{stats.totalAdmins}</span>
            <span className={styles.statLabel}>Admins</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'var(--secondary)' }}>
            <Icons.Grid size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{stats.totalApps}</span>
            <span className={styles.statLabel}>Active Apps</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <section className={styles.section}>
        <h3>Quick Actions</h3>
        <div className={styles.actionsGrid}>
          {quickActions.map((action) => {
            const Icon = getIcon(action.icon);
            return (
              <Link key={action.name} href={action.href} className={styles.actionCard}>
                <div className={styles.actionIcon} style={{ background: action.color }}>
                  <Icon size={24} />
                </div>
                <span>{action.name}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Management Sections */}
      <div className={styles.managementGrid}>
        <section className={`${styles.section} ${styles.managementCard}`}>
          <div className={styles.sectionHeader}>
            <h3>User Management</h3>
            <Link href="/super-admin/users" className={styles.viewAll}>
              View All
              <Icons.ChevronRight size={16} />
            </Link>
          </div>
          <div className={styles.managementActions}>
            <Link href="/super-admin/users?role=student" className="btn btn-outline btn-sm">
              <Icons.User size={16} />
              Students
            </Link>
            <Link href="/super-admin/users?role=parent" className="btn btn-outline btn-sm">
              <Icons.Users size={16} />
              Parents
            </Link>
            <Link href="/super-admin/users?role=admin" className="btn btn-outline btn-sm">
              <Icons.Shield size={16} />
              Admins
            </Link>
          </div>
        </section>

        <section className={`${styles.section} ${styles.managementCard}`}>
          <div className={styles.sectionHeader}>
            <h3>App & Permission Management</h3>
            <Link href="/super-admin/manage-apps" className={styles.viewAll}>
              Manage
              <Icons.ChevronRight size={16} />
            </Link>
          </div>
          <p className={styles.managementDesc}>
            Create, edit, and manage apps. Assign permissions to users, roles, or specific classes.
          </p>
          <div className={styles.managementActions}>
            <Link href="/super-admin/manage-apps" className="btn btn-primary btn-sm">
              <Icons.Layers size={16} />
              Manage Apps
            </Link>
            <Link href="/super-admin/permissions" className="btn btn-outline btn-sm">
              <Icons.Shield size={16} />
              Permissions
            </Link>
          </div>
        </section>
      </div>

      {/* All Apps */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3>All Apps</h3>
          <Link href="/super-admin/manage-apps" className={styles.viewAll}>
            Manage Apps
            <Icons.ChevronRight size={16} />
          </Link>
        </div>
        <div className={styles.appsGrid}>
          {apps.map((app) => {
            const Icon = getIcon(app.icon);
            return (
              <div key={app.id} className={styles.appCard}>
                <div className={styles.appIcon}>
                  <Icon size={24} />
                </div>
                <div className={styles.appInfo}>
                  <h4>{app.name}</h4>
                  <span className={`badge ${app.targetType === 'admin' ? 'badge-primary' : 'badge-secondary'}`}>
                    {app.targetType === 'admin' ? 'Admin' : 'Client'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </DashboardLayout>
  );
}
