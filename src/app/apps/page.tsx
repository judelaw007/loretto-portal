'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { Icons, getIcon } from '@/components/icons';
import styles from './apps.module.css';
import type { User, App } from '@/types';

interface AppsData {
  user: User;
  apps: App[];
}

export default function MyAppsPage() {
  const router = useRouter();
  const [data, setData] = useState<AppsData | null>(null);
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

      setData({
        user: result.user,
        apps: result.apps || [],
      });
    } catch (error) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <DashboardLayout title="My Apps">
        <div className={styles.loading}>
          <div className="spinner"></div>
        </div>
      </DashboardLayout>
    );
  }

  const { user, apps } = data;

  return (
    <DashboardLayout title="My Apps">
      <div className={styles.header}>
        <div>
          <h2>My Apps</h2>
          <p>Access your assigned applications</p>
        </div>
      </div>

      {apps.length > 0 ? (
        <div className={styles.appsGrid}>
          {apps.map((app) => {
            const Icon = getIcon(app.icon);
            return (
              <Link key={app.id} href={app.route} className={styles.appCard}>
                <div className={styles.appIcon}>
                  <Icon size={32} />
                </div>
                <div className={styles.appInfo}>
                  <h3>{app.name}</h3>
                  <p>{app.description}</p>
                </div>
                <div className={styles.appArrow}>
                  <Icons.ChevronRight size={20} />
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <Icons.Grid size={64} />
          <h3>No Apps Available</h3>
          <p>You don't have any apps assigned yet.</p>
          <p className={styles.emptyHint}>
            Contact your administrator to get access to apps.
          </p>
        </div>
      )}

      {/* Show Manage Apps link for Super Admin */}
      {user.role === 'super_admin' && (
        <div className={styles.adminSection}>
          <Link href="/super-admin/manage-apps" className="btn btn-primary">
            <Icons.Settings size={18} />
            Manage All Apps
          </Link>
        </div>
      )}
    </DashboardLayout>
  );
}
