'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { Icons } from '@/components/icons';
import styles from './users.module.css';
import type { User, Student, Parent, Admin, ClassLevel } from '@/types';
import { CLASS_LEVELS } from '@/types';

export default function UsersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleFilter = searchParams.get('role') || 'all';

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();

      if (data.success) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const getClassLabel = (level: ClassLevel) => {
    return CLASS_LEVELS.find(c => c.value === level)?.label || level;
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'super_admin': return 'Super Admin';
      case 'admin': return 'Admin';
      case 'parent': return 'Parent';
      case 'student': return 'Student';
      default: return role;
    }
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'super_admin': return 'badge-error';
      case 'admin': return 'badge-warning';
      case 'parent': return 'badge-primary';
      case 'student': return 'badge-success';
      default: return '';
    }
  };

  const filteredUsers = users.filter(user => {
    // Role filter
    if (roleFilter !== 'all' && user.role !== roleFilter) {
      return false;
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        user.firstName.toLowerCase().includes(term) ||
        user.lastName.toLowerCase().includes(term) ||
        user.phone.includes(term) ||
        (user.email && user.email.toLowerCase().includes(term))
      );
    }

    return true;
  });

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setUsers(users.filter(u => u.id !== userId));
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  return (
    <DashboardLayout title="User Management">
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h2>Users</h2>
          <span className={styles.count}>{filteredUsers.length} users</span>
        </div>
        <Link href="/super-admin/users/add" className="btn btn-primary">
          <Icons.UserPlus size={18} />
          Add User
        </Link>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.searchBox}>
          <Icons.User size={18} />
          <input
            type="text"
            placeholder="Search by name, phone, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className={styles.roleFilter}>
          <Link
            href="/super-admin/users"
            className={`${styles.filterBtn} ${roleFilter === 'all' ? styles.active : ''}`}
          >
            All
          </Link>
          <Link
            href="/super-admin/users?role=student"
            className={`${styles.filterBtn} ${roleFilter === 'student' ? styles.active : ''}`}
          >
            Students
          </Link>
          <Link
            href="/super-admin/users?role=parent"
            className={`${styles.filterBtn} ${roleFilter === 'parent' ? styles.active : ''}`}
          >
            Parents
          </Link>
          <Link
            href="/super-admin/users?role=admin"
            className={`${styles.filterBtn} ${roleFilter === 'admin' ? styles.active : ''}`}
          >
            Admins
          </Link>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className={styles.loading}>
          <div className="spinner"></div>
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Details</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className={styles.userCell}>
                      <div className={styles.avatar}>
                        {user.firstName[0]}{user.lastName[0]}
                      </div>
                      <div>
                        <div className={styles.userName}>
                          {user.firstName} {user.lastName}
                        </div>
                        {user.email && (
                          <div className={styles.userEmail}>{user.email}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>{user.phone}</td>
                  <td>
                    <span className={`badge ${getRoleBadgeClass(user.role)}`}>
                      {getRoleLabel(user.role)}
                    </span>
                  </td>
                  <td>
                    {user.role === 'student' && (
                      <span className="text-sm">
                        {getClassLabel((user as Student).classLevel)} | ID: {(user as Student).studentId}
                      </span>
                    )}
                    {user.role === 'admin' && (
                      <span className="text-sm">
                        {(user as Admin).adminType}
                      </span>
                    )}
                    {user.role === 'parent' && (
                      <span className="text-sm">
                        Parent Account
                      </span>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${user.isActive ? 'badge-success' : 'badge-error'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <Link
                        href={`/super-admin/users/${user.id}`}
                        className="btn btn-sm btn-outline"
                      >
                        <Icons.Eye size={14} />
                      </Link>
                      <Link
                        href={`/super-admin/users/${user.id}/edit`}
                        className="btn btn-sm btn-outline"
                      >
                        <Icons.Edit size={14} />
                      </Link>
                      {user.role !== 'super_admin' && (
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="btn btn-sm btn-danger"
                        >
                          <Icons.Trash size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className={styles.emptyState}>
                    <Icons.Users size={48} />
                    <p>No users found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}
