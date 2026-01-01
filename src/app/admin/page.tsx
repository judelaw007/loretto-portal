'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { Icons, getIcon } from '@/components/icons';
import styles from './admin.module.css';
import type { User, App, Admin } from '@/types';

interface DashboardData {
  user: Admin;
  apps: App[];
}

export default function AdminDashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const result = await res.json();

      if (!result.success) {
        router.push('/login');
        return;
      }

      if (result.user.role !== 'admin') {
        if (result.user.role === 'super_admin') {
          router.push('/super-admin');
        } else {
          router.push('/dashboard');
        }
        return;
      }

      setData(result);
    } catch (error) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <DashboardLayout title="Admin Dashboard">
        <div className={styles.loading}>
          <div className="spinner"></div>
        </div>
      </DashboardLayout>
    );
  }

  const { user, apps } = data;

  const getAdminTypeLabel = (type: string) => {
    switch (type) {
      case 'teacher': return 'Teacher';
      case 'accountant': return 'Accountant';
      case 'registrar': return 'Registrar';
      case 'principal': return 'Principal';
      default: return 'Staff';
    }
  };

  return (
    <DashboardLayout title="Admin Dashboard">
      {/* Welcome Section */}
      <div className={styles.welcome}>
        <div className={styles.welcomeText}>
          <h2>Welcome, {user.firstName}!</h2>
          <p>Role: {getAdminTypeLabel(user.adminType)}</p>
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

      {/* My Apps */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3>My Apps</h3>
          <Link href="/admin/apps" className={styles.viewAll}>
            View All
            <Icons.ChevronRight size={16} />
          </Link>
        </div>
        <div className={styles.appsGrid}>
          {apps.map((app) => {
            const Icon = getIcon(app.icon);
            return (
              <Link key={app.id} href={app.route} className={styles.appCard}>
                <div className={styles.appIcon}>
                  <Icon size={28} />
                </div>
                <h4>{app.name}</h4>
                <p>{app.description}</p>
              </Link>
            );
          })}

          {apps.length === 0 && (
            <div className={styles.emptyApps}>
              <Icons.Grid size={48} />
              <p>No apps assigned to you yet.</p>
              <p className="text-sm text-muted">Contact the Super Administrator for access.</p>
            </div>
          )}
        </div>
      </section>

      {/* Quick Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'var(--primary)' }}>
            <Icons.Grid size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{apps.length}</span>
            <span className={styles.statLabel}>Available Apps</span>
          </div>
        </div>
        {user.assignedClasses && user.assignedClasses.length > 0 && (
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: 'var(--success)' }}>
              <Icons.Layers size={24} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{user.assignedClasses.length}</span>
              <span className={styles.statLabel}>Assigned Classes</span>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
