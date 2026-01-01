'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { Icons, getIcon } from '@/components/icons';
import styles from './manage-apps.module.css';
import type { App } from '@/types';

export default function ManageAppsPage() {
  const router = useRouter();
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    icon: 'grid',
    targetType: 'admin' as 'admin' | 'client',
    route: '',
  });

  useEffect(() => {
    fetchApps();
  }, []);

  const fetchApps = async () => {
    try {
      const res = await fetch('/api/admin/apps');
      const data = await res.json();

      if (data.success) {
        setApps(data.apps);
      }
    } catch (error) {
      console.error('Error fetching apps:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddApp = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch('/api/admin/apps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        setApps([...apps, data.app]);
        setShowAddModal(false);
        setFormData({
          name: '',
          slug: '',
          description: '',
          icon: 'grid',
          targetType: 'admin',
          route: '',
        });
      }
    } catch (error) {
      console.error('Error creating app:', error);
    }
  };

  const handleToggleActive = async (appId: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/admin/apps/${appId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (res.ok) {
        setApps(apps.map(app =>
          app.id === appId ? { ...app, isActive: !isActive } : app
        ));
      }
    } catch (error) {
      console.error('Error toggling app:', error);
    }
  };

  const handleDelete = async (appId: string) => {
    if (!confirm('Are you sure you want to delete this app?')) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/apps/${appId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setApps(apps.filter(app => app.id !== appId));
      }
    } catch (error) {
      console.error('Error deleting app:', error);
    }
  };

  const adminApps = apps.filter(app => app.targetType === 'admin');
  const clientApps = apps.filter(app => app.targetType === 'client');

  const iconOptions = [
    'grid', 'users', 'user', 'user-plus', 'layers', 'credit-card',
    'wallet', 'bell', 'megaphone', 'award', 'file-text', 'settings',
    'shield', 'home', 'school',
  ];

  return (
    <DashboardLayout title="Manage Apps">
      <div className={styles.header}>
        <div>
          <h2>App Management</h2>
          <p className="text-muted">Create, edit, and manage apps for the portal</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Icons.Plus size={18} />
          Add New App
        </button>
      </div>

      {loading ? (
        <div className={styles.loading}>
          <div className="spinner"></div>
        </div>
      ) : (
        <>
          {/* Admin Apps */}
          <section className={styles.section}>
            <h3>
              <Icons.Shield size={20} />
              Admin Apps ({adminApps.length})
            </h3>
            <div className={styles.appsGrid}>
              {adminApps.map((app) => {
                const Icon = getIcon(app.icon);
                return (
                  <div key={app.id} className={`${styles.appCard} ${!app.isActive ? styles.inactive : ''}`}>
                    <div className={styles.appHeader}>
                      <div className={styles.appIcon}>
                        <Icon size={24} />
                      </div>
                      <div className={styles.appBadges}>
                        {app.isSystemApp && (
                          <span className="badge badge-primary">System</span>
                        )}
                        <span className={`badge ${app.isActive ? 'badge-success' : 'badge-error'}`}>
                          {app.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    <h4>{app.name}</h4>
                    <p>{app.description}</p>
                    <div className={styles.appActions}>
                      <Link href={`/super-admin/permissions?app=${app.id}`} className="btn btn-sm btn-outline">
                        <Icons.Shield size={14} />
                        Permissions
                      </Link>
                      <button
                        onClick={() => handleToggleActive(app.id, app.isActive)}
                        className={`btn btn-sm ${app.isActive ? 'btn-outline' : 'btn-success'}`}
                      >
                        {app.isActive ? 'Disable' : 'Enable'}
                      </button>
                      {!app.isSystemApp && (
                        <button
                          onClick={() => handleDelete(app.id)}
                          className="btn btn-sm btn-danger"
                        >
                          <Icons.Trash size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Client Apps */}
          <section className={styles.section}>
            <h3>
              <Icons.Users size={20} />
              Client Apps ({clientApps.length})
            </h3>
            <div className={styles.appsGrid}>
              {clientApps.map((app) => {
                const Icon = getIcon(app.icon);
                return (
                  <div key={app.id} className={`${styles.appCard} ${!app.isActive ? styles.inactive : ''}`}>
                    <div className={styles.appHeader}>
                      <div className={styles.appIcon}>
                        <Icon size={24} />
                      </div>
                      <div className={styles.appBadges}>
                        {app.isSystemApp && (
                          <span className="badge badge-primary">System</span>
                        )}
                        <span className={`badge ${app.isActive ? 'badge-success' : 'badge-error'}`}>
                          {app.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    <h4>{app.name}</h4>
                    <p>{app.description}</p>
                    <div className={styles.appActions}>
                      <Link href={`/super-admin/permissions?app=${app.id}`} className="btn btn-sm btn-outline">
                        <Icons.Shield size={14} />
                        Permissions
                      </Link>
                      <button
                        onClick={() => handleToggleActive(app.id, app.isActive)}
                        className={`btn btn-sm ${app.isActive ? 'btn-outline' : 'btn-success'}`}
                      >
                        {app.isActive ? 'Disable' : 'Enable'}
                      </button>
                      {!app.isSystemApp && (
                        <button
                          onClick={() => handleDelete(app.id)}
                          className="btn btn-sm btn-danger"
                        >
                          <Icons.Trash size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}

      {/* Add App Modal */}
      {showAddModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Add New App</h3>
              <button onClick={() => setShowAddModal(false)} className={styles.closeBtn}>
                <Icons.X size={24} />
              </button>
            </div>
            <form onSubmit={handleAddApp}>
              <div className="form-group">
                <label>App Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Attendance Tracker"
                  required
                />
              </div>

              <div className="form-group">
                <label>Slug (URL identifier)</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                  placeholder="e.g., attendance-tracker"
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the app"
                  required
                />
              </div>

              <div className="form-group">
                <label>Target Type</label>
                <select
                  value={formData.targetType}
                  onChange={(e) => setFormData({ ...formData, targetType: e.target.value as 'admin' | 'client' })}
                >
                  <option value="admin">Admin App (for staff)</option>
                  <option value="client">Client App (for parents/students)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Icon</label>
                <div className={styles.iconGrid}>
                  {iconOptions.map((icon) => {
                    const IconComp = getIcon(icon);
                    return (
                      <button
                        key={icon}
                        type="button"
                        className={`${styles.iconOption} ${formData.icon === icon ? styles.selected : ''}`}
                        onClick={() => setFormData({ ...formData, icon })}
                      >
                        <IconComp size={20} />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="form-group">
                <label>Route Path</label>
                <input
                  type="text"
                  value={formData.route}
                  onChange={(e) => setFormData({ ...formData, route: e.target.value })}
                  placeholder={formData.targetType === 'admin' ? '/admin/apps/...' : '/dashboard/apps/...'}
                  required
                />
              </div>

              <div className={styles.modalActions}>
                <button type="button" className="btn btn-outline" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create App
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
