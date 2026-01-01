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
              ? `You have ${children.length} ${children.length === 1 ? 'child' : 'children'} registered.`
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

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        {isParent && (
          <>
            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: 'var(--primary)' }}>
                <Icons.Users size={24} />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{children.length}</span>
                <span className={styles.statLabel}>Children</span>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: 'var(--success)' }}>
                <Icons.Award size={24} />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>-</span>
                <span className={styles.statLabel}>Results Available</span>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: 'var(--warning)' }}>
                <Icons.Wallet size={24} />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>-</span>
                <span className={styles.statLabel}>Pending Fees</span>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: 'var(--info)' }}>
                <Icons.Bell size={24} />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>0</span>
                <span className={styles.statLabel}>New Announcements</span>
              </div>
            </div>
          </>
        )}

        {isStudent && (
          <>
            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: 'var(--primary)' }}>
                <Icons.Layers size={24} />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{getClassLabel((user as Student).classLevel)}</span>
                <span className={styles.statLabel}>Current Class</span>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: 'var(--success)' }}>
                <Icons.Award size={24} />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>-</span>
                <span className={styles.statLabel}>Average Score</span>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: 'var(--warning)' }}>
                <Icons.Wallet size={24} />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>-</span>
                <span className={styles.statLabel}>Fee Status</span>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: 'var(--info)' }}>
                <Icons.Bell size={24} />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>0</span>
                <span className={styles.statLabel}>Announcements</span>
              </div>
            </div>
          </>
        )}
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
                <div className={styles.childActions}>
                  <Link href={`/dashboard/child/${child.id}`} className="btn btn-sm btn-outline">
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Quick Apps */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3>Quick Access</h3>
          <Link href="/dashboard/apps" className={styles.viewAll}>
            View All Apps
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
              <p>No apps available yet.</p>
              <p className="text-sm text-muted">Contact the administrator if you need access to specific apps.</p>
            </div>
          )}
        </div>
      </section>

      {/* Recent Announcements */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3>Recent Announcements</h3>
          <Link href="/dashboard/apps/announcements" className={styles.viewAll}>
            View All
            <Icons.ChevronRight size={16} />
          </Link>
        </div>
        <div className={styles.announcementsList}>
          <div className={styles.emptyState}>
            <Icons.Bell size={32} />
            <p>No announcements yet</p>
          </div>
        </div>
      </section>
    </DashboardLayout>
  );
}
