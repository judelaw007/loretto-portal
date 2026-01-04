'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { Icons, getIcon } from '@/components/icons';
import styles from './manage-apps.module.css';
import type { App, User, ClassLevel, AdminType } from '@/types';
import { CLASS_LEVELS } from '@/types';

interface AppPermission {
  id: string;
  appId: string;
  userId: string | null;
  role: string | null;
  adminType: string | null;
  classLevels: string[] | null;
  targetRole: string | null;
}

interface AppWithPermissions extends App {
  permissions: AppPermission[];
}

export default function ManageAppsPage() {
  const router = useRouter();
  const [apps, setApps] = useState<AppWithPermissions[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<AppWithPermissions | null>(null);
  const [showAllocationModal, setShowAllocationModal] = useState(false);
  const [allocationType, setAllocationType] = useState<'individual' | 'group'>('group');
  const [allocationData, setAllocationData] = useState({
    userId: '',
    groupType: '', // 'all_parents', 'all_students', 'all_admins', 'class_students', 'class_parents', 'admin_type'
    classLevel: '' as ClassLevel | '',
    adminType: '' as AdminType | '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [appsRes, usersRes] = await Promise.all([
        fetch('/api/admin/apps?includePermissions=true'),
        fetch('/api/admin/users'),
      ]);

      const appsData = await appsRes.json();
      const usersData = await usersRes.json();

      if (appsData.success) {
        setApps(appsData.apps);
      }
      if (usersData.success) {
        setUsers(usersData.users);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
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

  const openAllocationModal = (app: AppWithPermissions) => {
    setSelectedApp(app);
    setAllocationType('group');
    setAllocationData({
      userId: '',
      groupType: '',
      classLevel: '',
      adminType: '',
    });
    setShowAllocationModal(true);
  };

  const handleAllocate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;

    let permissionData: any = { appId: selectedApp.id };

    if (allocationType === 'individual') {
      permissionData.userId = allocationData.userId;
    } else {
      switch (allocationData.groupType) {
        case 'all_parents':
          permissionData.role = 'parent';
          break;
        case 'all_students':
          permissionData.role = 'student';
          break;
        case 'all_admins':
          permissionData.role = 'admin';
          break;
        case 'class_students':
          permissionData.role = 'student';
          permissionData.classLevels = [allocationData.classLevel];
          break;
        case 'class_parents':
          permissionData.targetRole = 'parent';
          permissionData.classLevels = [allocationData.classLevel];
          break;
        case 'admin_type':
          permissionData.role = 'admin';
          permissionData.adminType = allocationData.adminType;
          break;
      }
    }

    try {
      const res = await fetch('/api/admin/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(permissionData),
      });

      if (res.ok) {
        await fetchData(); // Refresh data
        setShowAllocationModal(false);
      }
    } catch (error) {
      console.error('Error allocating app:', error);
    }
  };

  const handleRemovePermission = async (permissionId: string) => {
    if (!confirm('Remove this allocation?')) return;

    try {
      const res = await fetch(`/api/admin/permissions/${permissionId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error('Error removing permission:', error);
    }
  };

  const getPermissionLabel = (perm: AppPermission): string => {
    if (perm.userId) {
      const user = users.find(u => u.id === perm.userId);
      return user ? `${user.firstName} ${user.lastName} (Individual)` : 'Unknown User';
    }
    if (perm.classLevels && perm.classLevels.length > 0) {
      const classLabel = CLASS_LEVELS.find(c => c.value === perm.classLevels![0])?.label || perm.classLevels[0];
      if (perm.targetRole === 'parent') {
        return `Parents of ${classLabel} students`;
      }
      return `${classLabel} Students`;
    }
    if (perm.adminType) {
      return `All ${perm.adminType.charAt(0).toUpperCase() + perm.adminType.slice(1)}s`;
    }
    if (perm.role === 'parent') return 'All Parents';
    if (perm.role === 'student') return 'All Students';
    if (perm.role === 'admin') return 'All Admins';
    return 'Unknown';
  };

  const adminApps = apps.filter(app => app.targetType === 'admin');
  const clientApps = apps.filter(app => app.targetType === 'client');

  return (
    <DashboardLayout title="Manage Apps">
      <div className={styles.header}>
        <div>
          <h2>App Management</h2>
          <p className="text-muted">Allocate apps to users and manage access</p>
        </div>
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
            <p className={styles.sectionDesc}>Apps for school staff (teachers, accountants, registrars)</p>

            {adminApps.length === 0 ? (
              <div className={styles.emptyState}>
                <Icons.Grid size={48} />
                <p>No admin apps available</p>
              </div>
            ) : (
              <div className={styles.appsGrid}>
                {adminApps.map((app) => {
                  const Icon = getIcon(app.icon);
                  return (
                    <div key={app.id} className={`${styles.appCard} ${!app.isActive ? styles.inactive : ''}`}>
                      <div className={styles.appHeader}>
                        <div className={styles.appIcon}>
                          <Icon size={24} />
                        </div>
                        <div className={styles.appStatus}>
                          <span className={`badge ${app.isActive ? 'badge-success' : 'badge-error'}`}>
                            {app.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>

                      <h4>{app.name}</h4>
                      <p className={styles.appDesc}>{app.description}</p>

                      {/* Current Allocations */}
                      <div className={styles.allocations}>
                        <span className={styles.allocationLabel}>Allocated to:</span>
                        {app.permissions && app.permissions.length > 0 ? (
                          <div className={styles.allocationTags}>
                            {app.permissions.map((perm) => (
                              <span key={perm.id} className={styles.allocationTag}>
                                {getPermissionLabel(perm)}
                                <button
                                  onClick={() => handleRemovePermission(perm.id)}
                                  className={styles.removeTag}
                                >
                                  <Icons.X size={12} />
                                </button>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className={styles.noAllocations}>No allocations</span>
                        )}
                      </div>

                      <div className={styles.appActions}>
                        <button
                          onClick={() => openAllocationModal(app)}
                          className="btn btn-sm btn-primary"
                          disabled={!app.isActive}
                        >
                          <Icons.UserPlus size={14} />
                          Allocate
                        </button>
                        <button
                          onClick={() => handleToggleActive(app.id, app.isActive)}
                          className={`btn btn-sm ${app.isActive ? 'btn-outline' : 'btn-success'}`}
                        >
                          {app.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Client Apps */}
          <section className={styles.section}>
            <h3>
              <Icons.Users size={20} />
              Client Apps ({clientApps.length})
            </h3>
            <p className={styles.sectionDesc}>Apps for parents and students</p>

            {clientApps.length === 0 ? (
              <div className={styles.emptyState}>
                <Icons.Grid size={48} />
                <p>No client apps available</p>
              </div>
            ) : (
              <div className={styles.appsGrid}>
                {clientApps.map((app) => {
                  const Icon = getIcon(app.icon);
                  return (
                    <div key={app.id} className={`${styles.appCard} ${!app.isActive ? styles.inactive : ''}`}>
                      <div className={styles.appHeader}>
                        <div className={styles.appIcon}>
                          <Icon size={24} />
                        </div>
                        <div className={styles.appStatus}>
                          <span className={`badge ${app.isActive ? 'badge-success' : 'badge-error'}`}>
                            {app.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>

                      <h4>{app.name}</h4>
                      <p className={styles.appDesc}>{app.description}</p>

                      {/* Current Allocations */}
                      <div className={styles.allocations}>
                        <span className={styles.allocationLabel}>Allocated to:</span>
                        {app.permissions && app.permissions.length > 0 ? (
                          <div className={styles.allocationTags}>
                            {app.permissions.map((perm) => (
                              <span key={perm.id} className={styles.allocationTag}>
                                {getPermissionLabel(perm)}
                                <button
                                  onClick={() => handleRemovePermission(perm.id)}
                                  className={styles.removeTag}
                                >
                                  <Icons.X size={12} />
                                </button>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className={styles.noAllocations}>No allocations</span>
                        )}
                      </div>

                      <div className={styles.appActions}>
                        <button
                          onClick={() => openAllocationModal(app)}
                          className="btn btn-sm btn-primary"
                          disabled={!app.isActive}
                        >
                          <Icons.UserPlus size={14} />
                          Allocate
                        </button>
                        <button
                          onClick={() => handleToggleActive(app.id, app.isActive)}
                          className={`btn btn-sm ${app.isActive ? 'btn-outline' : 'btn-success'}`}
                        >
                          {app.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}

      {/* Allocation Modal */}
      {showAllocationModal && selectedApp && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Allocate: {selectedApp.name}</h3>
              <button onClick={() => setShowAllocationModal(false)} className={styles.closeBtn}>
                <Icons.X size={24} />
              </button>
            </div>

            <form onSubmit={handleAllocate}>
              {/* Allocation Type Toggle */}
              <div className={styles.allocationTypeToggle}>
                <button
                  type="button"
                  className={`${styles.toggleBtn} ${allocationType === 'group' ? styles.active : ''}`}
                  onClick={() => setAllocationType('group')}
                >
                  <Icons.Users size={18} />
                  Group
                </button>
                <button
                  type="button"
                  className={`${styles.toggleBtn} ${allocationType === 'individual' ? styles.active : ''}`}
                  onClick={() => setAllocationType('individual')}
                >
                  <Icons.User size={18} />
                  Individual
                </button>
              </div>

              {allocationType === 'individual' ? (
                <div className="form-group">
                  <label>Select User</label>
                  <select
                    value={allocationData.userId}
                    onChange={(e) => setAllocationData({ ...allocationData, userId: e.target.value })}
                    required
                  >
                    <option value="">-- Select a user --</option>
                    {users.filter(u => u.role !== 'super_admin').map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.firstName} {user.lastName} ({user.role})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <>
                  <div className="form-group">
                    <label>Select Group</label>
                    <select
                      value={allocationData.groupType}
                      onChange={(e) => setAllocationData({
                        ...allocationData,
                        groupType: e.target.value,
                        classLevel: '',
                        adminType: '',
                      })}
                      required
                    >
                      <option value="">-- Select a group --</option>
                      <optgroup label="All Users by Role">
                        <option value="all_parents">All Parents</option>
                        <option value="all_students">All Students</option>
                        <option value="all_admins">All Admins</option>
                      </optgroup>
                      <optgroup label="By Class">
                        <option value="class_students">Students in a specific class</option>
                        <option value="class_parents">Parents of students in a specific class</option>
                      </optgroup>
                      <optgroup label="By Admin Type">
                        <option value="admin_type">Specific admin type (Teachers, Accountants, etc.)</option>
                      </optgroup>
                    </select>
                  </div>

                  {/* Class Level Selector */}
                  {(allocationData.groupType === 'class_students' || allocationData.groupType === 'class_parents') && (
                    <div className="form-group">
                      <label>Select Class</label>
                      <select
                        value={allocationData.classLevel}
                        onChange={(e) => setAllocationData({ ...allocationData, classLevel: e.target.value as ClassLevel })}
                        required
                      >
                        <option value="">-- Select a class --</option>
                        {CLASS_LEVELS.map((level) => (
                          <option key={level.value} value={level.value}>
                            {level.label} ({level.category})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Admin Type Selector */}
                  {allocationData.groupType === 'admin_type' && (
                    <div className="form-group">
                      <label>Select Admin Type</label>
                      <select
                        value={allocationData.adminType}
                        onChange={(e) => setAllocationData({ ...allocationData, adminType: e.target.value as AdminType })}
                        required
                      >
                        <option value="">-- Select admin type --</option>
                        <option value="teacher">Teachers</option>
                        <option value="accountant">Accountants</option>
                        <option value="registrar">Registrars</option>
                        <option value="principal">Principals</option>
                        <option value="general">General Staff</option>
                      </select>
                    </div>
                  )}
                </>
              )}

              <div className={styles.modalActions}>
                <button type="button" className="btn btn-outline" onClick={() => setShowAllocationModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Allocate App
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
