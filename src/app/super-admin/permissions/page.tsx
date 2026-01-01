'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { Icons, getIcon } from '@/components/icons';
import styles from './permissions.module.css';
import type { App, AppPermission, User } from '@/types';
import { CLASS_LEVELS } from '@/types';

export default function PermissionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedAppId = searchParams.get('app');

  const [apps, setApps] = useState<App[]>([]);
  const [permissions, setPermissions] = useState<AppPermission[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const [formData, setFormData] = useState({
    appId: selectedAppId || '',
    permissionType: 'role', // 'role', 'admin_type', 'class', 'user'
    role: '',
    adminType: '',
    classLevels: [] as string[],
    targetRole: '',
    userId: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedAppId) {
      setFormData(prev => ({ ...prev, appId: selectedAppId }));
    }
  }, [selectedAppId]);

  const fetchData = async () => {
    try {
      const [appsRes, permsRes, usersRes] = await Promise.all([
        fetch('/api/admin/apps'),
        fetch('/api/admin/permissions'),
        fetch('/api/admin/users'),
      ]);

      const [appsData, permsData, usersData] = await Promise.all([
        appsRes.json(),
        permsRes.json(),
        usersRes.json(),
      ]);

      if (appsData.success) setApps(appsData.apps);
      if (permsData.success) setPermissions(permsData.permissions);
      if (usersData.success) setUsers(usersData.users);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPermission = async (e: React.FormEvent) => {
    e.preventDefault();

    const permissionData: any = {
      appId: formData.appId,
    };

    switch (formData.permissionType) {
      case 'role':
        permissionData.role = formData.role;
        break;
      case 'admin_type':
        permissionData.adminType = formData.adminType;
        break;
      case 'class':
        permissionData.classLevels = formData.classLevels;
        if (formData.targetRole) {
          permissionData.targetRole = formData.targetRole;
        }
        break;
      case 'user':
        permissionData.userId = formData.userId;
        break;
    }

    try {
      const res = await fetch('/api/admin/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(permissionData),
      });

      const data = await res.json();

      if (data.success) {
        setPermissions([...permissions, data.permission]);
        setShowAddModal(false);
        resetForm();
      }
    } catch (error) {
      console.error('Error creating permission:', error);
    }
  };

  const handleDeletePermission = async (permId: string) => {
    if (!confirm('Are you sure you want to remove this permission?')) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/permissions/${permId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setPermissions(permissions.filter(p => p.id !== permId));
      }
    } catch (error) {
      console.error('Error deleting permission:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      appId: selectedAppId || '',
      permissionType: 'role',
      role: '',
      adminType: '',
      classLevels: [],
      targetRole: '',
      userId: '',
    });
  };

  const getAppName = (appId: string) => {
    return apps.find(a => a.id === appId)?.name || 'Unknown App';
  };

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : 'Unknown User';
  };

  const getPermissionDescription = (perm: AppPermission) => {
    if (perm.userId) {
      return `User: ${getUserName(perm.userId)}`;
    }
    if (perm.role) {
      return `All ${perm.role}s`;
    }
    if (perm.adminType) {
      return `Admin Type: ${perm.adminType}`;
    }
    if (perm.classLevels && perm.classLevels.length > 0) {
      const classNames = perm.classLevels.map(c =>
        CLASS_LEVELS.find(cl => cl.value === c)?.label || c
      ).join(', ');
      const target = perm.targetRole ? ` (${perm.targetRole}s only)` : '';
      return `Classes: ${classNames}${target}`;
    }
    return 'Unknown';
  };

  const filteredPermissions = selectedAppId
    ? permissions.filter(p => p.appId === selectedAppId)
    : permissions;

  const groupedByApp = filteredPermissions.reduce((acc, perm) => {
    if (!acc[perm.appId]) {
      acc[perm.appId] = [];
    }
    acc[perm.appId].push(perm);
    return acc;
  }, {} as Record<string, AppPermission[]>);

  return (
    <DashboardLayout title="App Permissions">
      <div className={styles.header}>
        <div>
          <h2>Permission Management</h2>
          <p className="text-muted">Assign apps to users, roles, or class levels</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Icons.Plus size={18} />
          Add Permission
        </button>
      </div>

      {/* Filter by App */}
      <div className={styles.filters}>
        <select
          value={selectedAppId || ''}
          onChange={(e) => router.push(`/super-admin/permissions${e.target.value ? `?app=${e.target.value}` : ''}`)}
          className={styles.appFilter}
        >
          <option value="">All Apps</option>
          {apps.map(app => (
            <option key={app.id} value={app.id}>{app.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className={styles.loading}>
          <div className="spinner"></div>
        </div>
      ) : (
        <div className={styles.permissionsList}>
          {Object.keys(groupedByApp).length === 0 ? (
            <div className={styles.emptyState}>
              <Icons.Shield size={48} />
              <p>No permissions configured yet</p>
              <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                Add First Permission
              </button>
            </div>
          ) : (
            Object.entries(groupedByApp).map(([appId, perms]) => {
              const app = apps.find(a => a.id === appId);
              if (!app) return null;

              const Icon = getIcon(app.icon);

              return (
                <div key={appId} className={styles.appSection}>
                  <div className={styles.appHeader}>
                    <div className={styles.appInfo}>
                      <div className={styles.appIcon}>
                        <Icon size={20} />
                      </div>
                      <div>
                        <h4>{app.name}</h4>
                        <span className={`badge ${app.targetType === 'admin' ? 'badge-primary' : 'badge-secondary'}`}>
                          {app.targetType}
                        </span>
                      </div>
                    </div>
                    <span className={styles.count}>{perms.length} permission(s)</span>
                  </div>

                  <div className={styles.permissionsTable}>
                    {perms.map(perm => (
                      <div key={perm.id} className={styles.permissionRow}>
                        <div className={styles.permissionInfo}>
                          <Icons.Check size={16} className={styles.checkIcon} />
                          <span>{getPermissionDescription(perm)}</span>
                        </div>
                        <button
                          onClick={() => handleDeletePermission(perm.id)}
                          className="btn btn-sm btn-danger"
                        >
                          <Icons.Trash size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Add Permission Modal */}
      {showAddModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Add Permission</h3>
              <button onClick={() => { setShowAddModal(false); resetForm(); }} className={styles.closeBtn}>
                <Icons.X size={24} />
              </button>
            </div>
            <form onSubmit={handleAddPermission}>
              <div className="form-group">
                <label>Select App</label>
                <select
                  value={formData.appId}
                  onChange={(e) => setFormData({ ...formData, appId: e.target.value })}
                  required
                >
                  <option value="">Choose an app...</option>
                  {apps.map(app => (
                    <option key={app.id} value={app.id}>{app.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Permission Type</label>
                <select
                  value={formData.permissionType}
                  onChange={(e) => setFormData({ ...formData, permissionType: e.target.value })}
                >
                  <option value="role">By Role (all users of a role)</option>
                  <option value="admin_type">By Admin Type (teacher, accountant, etc.)</option>
                  <option value="class">By Class Level</option>
                  <option value="user">Specific User</option>
                </select>
              </div>

              {formData.permissionType === 'role' && (
                <div className="form-group">
                  <label>Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    required
                  >
                    <option value="">Select role...</option>
                    <option value="admin">All Admins</option>
                    <option value="parent">All Parents</option>
                    <option value="student">All Students</option>
                  </select>
                </div>
              )}

              {formData.permissionType === 'admin_type' && (
                <div className="form-group">
                  <label>Admin Type</label>
                  <select
                    value={formData.adminType}
                    onChange={(e) => setFormData({ ...formData, adminType: e.target.value })}
                    required
                  >
                    <option value="">Select admin type...</option>
                    <option value="teacher">Teachers</option>
                    <option value="accountant">Accountants</option>
                    <option value="registrar">Registrars</option>
                    <option value="principal">Principals</option>
                    <option value="general">General Staff</option>
                  </select>
                </div>
              )}

              {formData.permissionType === 'class' && (
                <>
                  <div className="form-group">
                    <label>Class Levels</label>
                    <div className={styles.classGrid}>
                      {CLASS_LEVELS.map(cls => (
                        <label key={cls.value} className={styles.checkbox}>
                          <input
                            type="checkbox"
                            checked={formData.classLevels.includes(cls.value)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({
                                  ...formData,
                                  classLevels: [...formData.classLevels, cls.value],
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  classLevels: formData.classLevels.filter(c => c !== cls.value),
                                });
                              }
                            }}
                          />
                          <span>{cls.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Target (Optional)</label>
                    <select
                      value={formData.targetRole}
                      onChange={(e) => setFormData({ ...formData, targetRole: e.target.value })}
                    >
                      <option value="">Both parents and students</option>
                      <option value="parent">Parents only</option>
                      <option value="student">Students only</option>
                    </select>
                  </div>
                </>
              )}

              {formData.permissionType === 'user' && (
                <div className="form-group">
                  <label>Select User</label>
                  <select
                    value={formData.userId}
                    onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                    required
                  >
                    <option value="">Choose a user...</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.firstName} {user.lastName} ({user.role})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className={styles.modalActions}>
                <button type="button" className="btn btn-outline" onClick={() => { setShowAddModal(false); resetForm(); }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Permission
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
