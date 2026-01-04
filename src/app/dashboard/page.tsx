'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { Icons, getIcon } from '@/components/icons';
import styles from './dashboard.module.css';
import type { User, App, Student, ClassLevel } from '@/types';
import { CLASS_LEVELS } from '@/types';

interface DashboardData {
  user: User;
  apps: App[];
  children: Student[];
}

export default function ClientDashboard() {
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

      // Redirect if not a client (parent or student)
      if (!['parent', 'student'].includes(result.user.role)) {
        if (result.user.role === 'super_admin') {
          router.push('/super-admin');
        } else if (result.user.role === 'admin') {
          router.push('/admin');
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

  const getClassLabel = (level: ClassLevel) => {
    return CLASS_LEVELS.find(c => c.value === level)?.label || level;
  };

  if (loading || !data) {
    return (
      <DashboardLayout title="Dashboard">
        <div className={styles.loading}>
          <div className="spinner"></div>
        </div>
      </DashboardLayout>
    );
  }

  const { user, apps, children } = data;
  const isParent = user.role === 'parent';
  const isStudent = user.role === 'student';

  return (
    <DashboardLayout title="Dashboard">
      {/* Welcome Section */}
      <div className={styles.welcome}>
        <div className={styles.welcomeText}>
          <h2>Welcome back, {user.firstName}!</h2>
          <p>
            {isParent
              ? children.length > 0
                ? `You have ${children.length} ${children.length === 1 ? 'child' : 'children'} registered.`
                : 'No children linked to your account yet.'
              : `Class: ${getClassLabel((user as Student).classLevel)}`
            }
          </p>
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

      {/* Quick Info Cards */}
      <div className={styles.statsGrid}>
        {isParent && (
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: 'var(--primary)' }}>
              <Icons.Users size={24} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{children.length}</span>
              <span className={styles.statLabel}>Children</span>
            </div>
          </div>
        )}

        {isStudent && (
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: 'var(--primary)' }}>
              <Icons.Layers size={24} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{getClassLabel((user as Student).classLevel)}</span>
              <span className={styles.statLabel}>Current Class</span>
            </div>
          </div>
        )}

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'var(--secondary)' }}>
            <Icons.Grid size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{apps.length}</span>
            <span className={styles.statLabel}>Available Apps</span>
          </div>
        </div>
      </div>

      {/* Children Cards (for parents) */}
      {isParent && children.length > 0 && (
        <section className={styles.section}>
          <h3>Your Children</h3>
          <div className={styles.childrenGrid}>
            {children.map((child) => (
              <div key={child.id} className={styles.childCard}>
                <div className={styles.childAvatar}>
                  {child.firstName[0]}{child.lastName[0]}
                </div>
                <div className={styles.childInfo}>
                  <h4>{child.firstName} {child.lastName}</h4>
                  <p className={styles.childClass}>{getClassLabel(child.classLevel)}</p>
                  <p className={styles.childId}>ID: {child.studentId}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* My Apps */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3>My Apps</h3>
          <Link href="/apps" className={styles.viewAll}>
            View All
            <Icons.ChevronRight size={16} />
          </Link>
        </div>

        {apps.length > 0 ? (
          <div className={styles.appsGrid}>
            {apps.slice(0, 4).map((app) => {
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
          </div>
        ) : (
          <div className={styles.emptyApps}>
            <Icons.Grid size={48} />
            <p>No apps available yet.</p>
            <p className="text-sm text-muted">Contact the administrator to get access to apps.</p>
          </div>
        )}
      </section>
    </DashboardLayout>
  );
}
