'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { Icons } from '@/components/icons';
import styles from './super-admin.module.css';
import type { User } from '@/types';

interface DashboardData {
  user: User;
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

  const { user, stats } = data;

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
      </div>

      {/* Quick Actions */}
      <section className={styles.section}>
        <h3>Quick Actions</h3>
        <div className={styles.actionsGrid}>
          <Link href="/super-admin/users/add?role=admin" className={styles.actionCard}>
            <div className={styles.actionIcon} style={{ background: 'var(--primary)' }}>
              <Icons.UserPlus size={24} />
            </div>
            <span>Add Admin</span>
          </Link>
          <Link href="/super-admin/users/add?role=parent" className={styles.actionCard}>
            <div className={styles.actionIcon} style={{ background: 'var(--info)' }}>
              <Icons.UserPlus size={24} />
            </div>
            <span>Add Parent</span>
          </Link>
          <Link href="/super-admin/manage-apps" className={styles.actionCard}>
            <div className={styles.actionIcon} style={{ background: 'var(--secondary)' }}>
              <Icons.Grid size={24} />
            </div>
            <span>Manage Apps</span>
          </Link>
          <Link href="/super-admin/permissions" className={styles.actionCard}>
            <div className={styles.actionIcon} style={{ background: 'var(--warning)' }}>
              <Icons.Shield size={24} />
            </div>
            <span>Permissions</span>
          </Link>
        </div>
      </section>

      {/* Management Cards */}
      <div className={styles.managementGrid}>
        <section className={`${styles.section} ${styles.managementCard}`}>
          <div className={styles.sectionHeader}>
            <h3>User Management</h3>
            <Link href="/super-admin/users" className={styles.viewAll}>
              View All
              <Icons.ChevronRight size={16} />
            </Link>
          </div>
          <p className={styles.managementDesc}>
            Manage admins, parents, and view student accounts.
          </p>
          <div className={styles.managementActions}>
            <Link href="/super-admin/users?role=admin" className="btn btn-outline btn-sm">
              <Icons.Shield size={16} />
              Admins
            </Link>
            <Link href="/super-admin/users?role=parent" className="btn btn-outline btn-sm">
              <Icons.Users size={16} />
              Parents
            </Link>
            <Link href="/super-admin/users?role=student" className="btn btn-outline btn-sm">
              <Icons.User size={16} />
              Students
            </Link>
          </div>
        </section>

        <section className={`${styles.section} ${styles.managementCard}`}>
          <div className={styles.sectionHeader}>
            <h3>App Management</h3>
            <Link href="/super-admin/manage-apps" className={styles.viewAll}>
              Manage
              <Icons.ChevronRight size={16} />
            </Link>
          </div>
          <p className={styles.managementDesc}>
            Create apps and assign permissions to users, roles, or classes.
          </p>
          <div className={styles.managementActions}>
            <Link href="/super-admin/manage-apps" className="btn btn-primary btn-sm">
              <Icons.Grid size={16} />
              Manage Apps
            </Link>
            <Link href="/super-admin/permissions" className="btn btn-outline btn-sm">
              <Icons.Shield size={16} />
              Permissions
            </Link>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
