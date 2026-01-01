// ============================================
// LORETTO SCHOOL PORTAL - DATABASE LAYER
// ============================================
// JSON-based storage for MVP (can be migrated to PostgreSQL/Replit DB later)

import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import type {
  User,
  SuperAdmin,
  Admin,
  Parent,
  Student,
  App,
  AppPermission,
  Announcement,
  FeeStructure,
  FeePayment,
  Session,
  OTPRequest,
  AcademicSession,
  Term,
  Subject,
  Result,
} from '@/types';

const DATA_DIR = path.join(process.cwd(), 'data');

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

// Generic file operations
async function readJsonFile<T>(filename: string): Promise<T[]> {
  await ensureDataDir();
  const filePath = path.join(DATA_DIR, `${filename}.json`);
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeJsonFile<T>(filename: string, data: T[]): Promise<void> {
  await ensureDataDir();
  const filePath = path.join(DATA_DIR, `${filename}.json`);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

// ============================================
// USER OPERATIONS
// ============================================

export const Users = {
  async getAll(): Promise<User[]> {
    return readJsonFile<User>('users');
  },

  async getById(id: string): Promise<User | null> {
    const users = await this.getAll();
    return users.find(u => u.id === id) || null;
  },

  async getByPhone(phone: string): Promise<User | null> {
    const users = await this.getAll();
    return users.find(u => u.phone === phone) || null;
  },

  async getByRole(role: string): Promise<User[]> {
    const users = await this.getAll();
    return users.filter(u => u.role === role);
  },

  async create(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const users = await this.getAll();
    const now = new Date().toISOString();
    const newUser: User = {
      ...user,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };
    users.push(newUser);
    await writeJsonFile('users', users);
    return newUser;
  },

  async update(id: string, updates: Partial<User>): Promise<User | null> {
    const users = await this.getAll();
    const index = users.findIndex(u => u.id === id);
    if (index === -1) return null;

    users[index] = {
      ...users[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    await writeJsonFile('users', users);
    return users[index];
  },

  async delete(id: string): Promise<boolean> {
    const users = await this.getAll();
    const filtered = users.filter(u => u.id !== id);
    if (filtered.length === users.length) return false;
    await writeJsonFile('users', filtered);
    return true;
  },

  // Get students by class
  async getStudentsByClass(classLevel: string): Promise<Student[]> {
    const users = await this.getAll();
    return users.filter(
      u => u.role === 'student' && (u as Student).classLevel === classLevel
    ) as Student[];
  },

  // Get parent's children
  async getChildren(parentId: string): Promise<Student[]> {
    const parent = await this.getById(parentId) as Parent | null;
    if (!parent || parent.role !== 'parent') return [];

    const users = await this.getAll();
    return users.filter(
      u => u.role === 'student' && parent.childrenIds.includes(u.id)
    ) as Student[];
  },
};

// ============================================
// APP OPERATIONS
// ============================================

export const Apps = {
  async getAll(): Promise<App[]> {
    return readJsonFile<App>('apps');
  },

  async getById(id: string): Promise<App | null> {
    const apps = await this.getAll();
    return apps.find(a => a.id === id) || null;
  },

  async getBySlug(slug: string): Promise<App | null> {
    const apps = await this.getAll();
    return apps.find(a => a.slug === slug) || null;
  },

  async getByTargetType(targetType: 'admin' | 'client'): Promise<App[]> {
    const apps = await this.getAll();
    return apps.filter(a => a.targetType === targetType && a.isActive);
  },

  async create(app: Omit<App, 'id' | 'createdAt' | 'updatedAt'>): Promise<App> {
    const apps = await this.getAll();
    const now = new Date().toISOString();
    const newApp: App = {
      ...app,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };
    apps.push(newApp);
    await writeJsonFile('apps', apps);
    return newApp;
  },

  async update(id: string, updates: Partial<App>): Promise<App | null> {
    const apps = await this.getAll();
    const index = apps.findIndex(a => a.id === id);
    if (index === -1) return null;

    apps[index] = {
      ...apps[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    await writeJsonFile('apps', apps);
    return apps[index];
  },

  async delete(id: string): Promise<boolean> {
    const apps = await this.getAll();
    const app = apps.find(a => a.id === id);
    if (!app || app.isSystemApp) return false;

    const filtered = apps.filter(a => a.id !== id);
    await writeJsonFile('apps', filtered);
    return true;
  },
};

// ============================================
// APP PERMISSION OPERATIONS
// ============================================

export const AppPermissions = {
  async getAll(): Promise<AppPermission[]> {
    return readJsonFile<AppPermission>('permissions');
  },

  async getByAppId(appId: string): Promise<AppPermission[]> {
    const permissions = await this.getAll();
    return permissions.filter(p => p.appId === appId);
  },

  async getByUserId(userId: string): Promise<AppPermission[]> {
    const permissions = await this.getAll();
    return permissions.filter(p => p.userId === userId);
  },

  async create(permission: Omit<AppPermission, 'id' | 'grantedAt'>): Promise<AppPermission> {
    const permissions = await this.getAll();
    const newPermission: AppPermission = {
      ...permission,
      id: uuidv4(),
      grantedAt: new Date().toISOString(),
    };
    permissions.push(newPermission);
    await writeJsonFile('permissions', permissions);
    return newPermission;
  },

  async delete(id: string): Promise<boolean> {
    const permissions = await this.getAll();
    const filtered = permissions.filter(p => p.id !== id);
    if (filtered.length === permissions.length) return false;
    await writeJsonFile('permissions', filtered);
    return true;
  },

  async deleteByAppId(appId: string): Promise<number> {
    const permissions = await this.getAll();
    const filtered = permissions.filter(p => p.appId !== appId);
    const deletedCount = permissions.length - filtered.length;
    await writeJsonFile('permissions', filtered);
    return deletedCount;
  },

  // Check if a user has access to an app
  async checkAccess(userId: string, appId: string): Promise<boolean> {
    const user = await Users.getById(userId);
    if (!user) return false;

    // Super admin has access to everything
    if (user.role === 'super_admin') return true;

    const permissions = await this.getAll();

    for (const perm of permissions) {
      if (perm.appId !== appId) continue;

      // Check expiration
      if (perm.expiresAt && new Date(perm.expiresAt) < new Date()) continue;

      // Direct user permission
      if (perm.userId === userId) return true;

      // Role-based permission
      if (perm.role === user.role) return true;

      // Admin type permission
      if (user.role === 'admin' && perm.adminType === (user as Admin).adminType) {
        return true;
      }

      // Class-based permission
      if (perm.classLevels && perm.classLevels.length > 0) {
        if (user.role === 'student') {
          const student = user as Student;
          if (perm.classLevels.includes(student.classLevel)) {
            if (!perm.targetRole || perm.targetRole === 'student') {
              return true;
            }
          }
        }

        if (user.role === 'parent') {
          const children = await Users.getChildren(user.id);
          for (const child of children) {
            if (perm.classLevels.includes(child.classLevel)) {
              if (!perm.targetRole || perm.targetRole === 'parent') {
                return true;
              }
            }
          }
        }
      }
    }

    return false;
  },

  // Get all apps a user has access to
  async getUserApps(userId: string): Promise<App[]> {
    const user = await Users.getById(userId);
    if (!user) return [];

    const allApps = await Apps.getAll();
    const activeApps = allApps.filter(a => a.isActive);

    // Super admin sees all apps
    if (user.role === 'super_admin') {
      return activeApps;
    }

    // Filter based on target type
    const targetType = (user.role === 'admin') ? 'admin' : 'client';
    const relevantApps = activeApps.filter(a => a.targetType === targetType);

    // Check permissions for each app
    const accessibleApps: App[] = [];
    for (const app of relevantApps) {
      if (await this.checkAccess(userId, app.id)) {
        accessibleApps.push(app);
      }
    }

    return accessibleApps;
  },
};

// ============================================
// SESSION OPERATIONS
// ============================================

export const Sessions = {
  async getAll(): Promise<Session[]> {
    return readJsonFile<Session>('sessions');
  },

  async getByToken(token: string): Promise<Session | null> {
    const sessions = await this.getAll();
    const session = sessions.find(s => s.token === token);
    if (!session) return null;

    // Check if expired
    if (new Date(session.expiresAt) < new Date()) {
      await this.delete(session.id);
      return null;
    }

    return session;
  },

  async create(userId: string, token: string, expiresInHours: number = 24 * 7): Promise<Session> {
    const sessions = await this.getAll();
    const now = new Date();
    const newSession: Session = {
      id: uuidv4(),
      userId,
      token,
      expiresAt: new Date(now.getTime() + expiresInHours * 60 * 60 * 1000).toISOString(),
      createdAt: now.toISOString(),
    };
    sessions.push(newSession);
    await writeJsonFile('sessions', sessions);
    return newSession;
  },

  async delete(id: string): Promise<boolean> {
    const sessions = await this.getAll();
    const filtered = sessions.filter(s => s.id !== id);
    if (filtered.length === sessions.length) return false;
    await writeJsonFile('sessions', filtered);
    return true;
  },

  async deleteByUserId(userId: string): Promise<number> {
    const sessions = await this.getAll();
    const filtered = sessions.filter(s => s.userId !== userId);
    const deletedCount = sessions.length - filtered.length;
    await writeJsonFile('sessions', filtered);
    return deletedCount;
  },

  async cleanup(): Promise<number> {
    const sessions = await this.getAll();
    const now = new Date();
    const valid = sessions.filter(s => new Date(s.expiresAt) > now);
    const deletedCount = sessions.length - valid.length;
    await writeJsonFile('sessions', valid);
    return deletedCount;
  },
};

// ============================================
// OTP OPERATIONS
// ============================================

export const OTPs = {
  async getAll(): Promise<OTPRequest[]> {
    return readJsonFile<OTPRequest>('otps');
  },

  async create(phone: string, purpose: 'password_reset' | 'verification'): Promise<OTPRequest> {
    const otps = await this.getAll();

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const now = new Date();
    const newOtp: OTPRequest = {
      id: uuidv4(),
      phone,
      otp,
      purpose,
      expiresAt: new Date(now.getTime() + 10 * 60 * 1000).toISOString(), // 10 minutes
      isUsed: false,
      createdAt: now.toISOString(),
    };

    otps.push(newOtp);
    await writeJsonFile('otps', otps);
    return newOtp;
  },

  async verify(phone: string, otp: string, purpose: 'password_reset' | 'verification'): Promise<boolean> {
    const otps = await this.getAll();
    const now = new Date();

    const validOtp = otps.find(
      o => o.phone === phone &&
           o.otp === otp &&
           o.purpose === purpose &&
           !o.isUsed &&
           new Date(o.expiresAt) > now
    );

    if (!validOtp) return false;

    // Mark as used
    validOtp.isUsed = true;
    await writeJsonFile('otps', otps);
    return true;
  },

  async cleanup(): Promise<number> {
    const otps = await this.getAll();
    const now = new Date();
    const valid = otps.filter(o => new Date(o.expiresAt) > now && !o.isUsed);
    const deletedCount = otps.length - valid.length;
    await writeJsonFile('otps', valid);
    return deletedCount;
  },
};

// ============================================
// ANNOUNCEMENT OPERATIONS
// ============================================

export const Announcements = {
  async getAll(): Promise<Announcement[]> {
    return readJsonFile<Announcement>('announcements');
  },

  async getById(id: string): Promise<Announcement | null> {
    const announcements = await this.getAll();
    return announcements.find(a => a.id === id) || null;
  },

  async create(announcement: Omit<Announcement, 'id' | 'publishedAt'>): Promise<Announcement> {
    const announcements = await this.getAll();
    const newAnnouncement: Announcement = {
      ...announcement,
      id: uuidv4(),
      publishedAt: new Date().toISOString(),
    };
    announcements.push(newAnnouncement);
    await writeJsonFile('announcements', announcements);
    return newAnnouncement;
  },

  async update(id: string, updates: Partial<Announcement>): Promise<Announcement | null> {
    const announcements = await this.getAll();
    const index = announcements.findIndex(a => a.id === id);
    if (index === -1) return null;

    announcements[index] = { ...announcements[index], ...updates };
    await writeJsonFile('announcements', announcements);
    return announcements[index];
  },

  async delete(id: string): Promise<boolean> {
    const announcements = await this.getAll();
    const filtered = announcements.filter(a => a.id !== id);
    if (filtered.length === announcements.length) return false;
    await writeJsonFile('announcements', filtered);
    return true;
  },

  async getForUser(userId: string): Promise<Announcement[]> {
    const user = await Users.getById(userId);
    if (!user) return [];

    const announcements = await this.getAll();
    const now = new Date();

    return announcements.filter(a => {
      // Check expiration
      if (a.expiresAt && new Date(a.expiresAt) < now) return false;

      // Check role targeting
      if (a.targetRoles && a.targetRoles.length > 0) {
        if (!a.targetRoles.includes(user.role)) return false;
      }

      // Check class targeting
      if (a.targetClasses && a.targetClasses.length > 0) {
        if (user.role === 'student') {
          if (!a.targetClasses.includes((user as Student).classLevel)) return false;
        } else if (user.role === 'parent') {
          // Check if any child is in target classes
          // This would need async handling in real implementation
        }
      }

      return true;
    }).sort((a, b) => {
      // Pinned first, then by date
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });
  },
};

// ============================================
// FEE OPERATIONS
// ============================================

export const FeeStructures = {
  async getAll(): Promise<FeeStructure[]> {
    return readJsonFile<FeeStructure>('fee_structures');
  },

  async getById(id: string): Promise<FeeStructure | null> {
    const structures = await this.getAll();
    return structures.find(s => s.id === id) || null;
  },

  async getByClassAndTerm(classLevel: string, termId: string): Promise<FeeStructure | null> {
    const structures = await this.getAll();
    return structures.find(s => s.classLevel === classLevel && s.termId === termId) || null;
  },

  async create(structure: Omit<FeeStructure, 'id'>): Promise<FeeStructure> {
    const structures = await this.getAll();
    const newStructure: FeeStructure = {
      ...structure,
      id: uuidv4(),
    };
    structures.push(newStructure);
    await writeJsonFile('fee_structures', structures);
    return newStructure;
  },

  async update(id: string, updates: Partial<FeeStructure>): Promise<FeeStructure | null> {
    const structures = await this.getAll();
    const index = structures.findIndex(s => s.id === id);
    if (index === -1) return null;

    structures[index] = { ...structures[index], ...updates };
    await writeJsonFile('fee_structures', structures);
    return structures[index];
  },
};

export const FeePayments = {
  async getAll(): Promise<FeePayment[]> {
    return readJsonFile<FeePayment>('fee_payments');
  },

  async getByStudentId(studentId: string): Promise<FeePayment[]> {
    const payments = await this.getAll();
    return payments.filter(p => p.studentId === studentId);
  },

  async create(payment: Omit<FeePayment, 'id'>): Promise<FeePayment> {
    const payments = await this.getAll();
    const newPayment: FeePayment = {
      ...payment,
      id: uuidv4(),
    };
    payments.push(newPayment);
    await writeJsonFile('fee_payments', payments);
    return newPayment;
  },
};

// ============================================
// SEED DATA - Initialize with default apps
// ============================================

export async function seedDefaultData() {
  // Check if already seeded
  const existingApps = await Apps.getAll();
  if (existingApps.length > 0) return;

  const now = new Date().toISOString();

  // Default Admin Apps
  const adminApps: Omit<App, 'id' | 'createdAt' | 'updatedAt'>[] = [
    {
      name: 'Student Management',
      slug: 'student-management',
      description: 'Manage student records, enrollment, and profiles',
      icon: 'users',
      targetType: 'admin',
      route: '/admin/apps/student-management',
      isSystemApp: true,
      isActive: true,
    },
    {
      name: 'Parent Management',
      slug: 'parent-management',
      description: 'Manage parent records and student-parent relationships',
      icon: 'user-plus',
      targetType: 'admin',
      route: '/admin/apps/parent-management',
      isSystemApp: true,
      isActive: true,
    },
    {
      name: 'Class Management',
      slug: 'class-management',
      description: 'Manage classes, sections, and class assignments',
      icon: 'layers',
      targetType: 'admin',
      route: '/admin/apps/class-management',
      isSystemApp: true,
      isActive: true,
    },
    {
      name: 'Fee Management',
      slug: 'fee-management',
      description: 'Manage fee structures, payments, and receipts',
      icon: 'credit-card',
      targetType: 'admin',
      route: '/admin/apps/fee-management',
      isSystemApp: true,
      isActive: true,
    },
    {
      name: 'Announcements',
      slug: 'announcements-admin',
      description: 'Create and manage school announcements',
      icon: 'megaphone',
      targetType: 'admin',
      route: '/admin/apps/announcements',
      isSystemApp: true,
      isActive: true,
    },
    {
      name: 'Results Entry',
      slug: 'results-entry',
      description: 'Enter and manage student results',
      icon: 'file-text',
      targetType: 'admin',
      route: '/admin/apps/results-entry',
      isSystemApp: true,
      isActive: true,
    },
  ];

  // Default Client Apps
  const clientApps: Omit<App, 'id' | 'createdAt' | 'updatedAt'>[] = [
    {
      name: 'View Results',
      slug: 'view-results',
      description: 'View academic results and report cards',
      icon: 'award',
      targetType: 'client',
      route: '/dashboard/apps/view-results',
      isSystemApp: true,
      isActive: true,
    },
    {
      name: 'Pay Fees',
      slug: 'pay-fees',
      description: 'View fee status and make payments',
      icon: 'wallet',
      targetType: 'client',
      route: '/dashboard/apps/pay-fees',
      isSystemApp: true,
      isActive: true,
    },
    {
      name: 'Announcements',
      slug: 'announcements',
      description: 'View school announcements and notices',
      icon: 'bell',
      targetType: 'client',
      route: '/dashboard/apps/announcements',
      isSystemApp: true,
      isActive: true,
    },
    {
      name: 'Profile',
      slug: 'profile',
      description: 'View and update your profile',
      icon: 'user',
      targetType: 'client',
      route: '/dashboard/apps/profile',
      isSystemApp: true,
      isActive: true,
    },
  ];

  // Create all apps
  for (const app of [...adminApps, ...clientApps]) {
    await Apps.create(app);
  }

  // Create default permissions (all apps available to all relevant roles)
  const apps = await Apps.getAll();
  for (const app of apps) {
    if (app.targetType === 'admin') {
      await AppPermissions.create({
        appId: app.id,
        role: 'admin',
        grantedBy: 'system',
      });
    } else {
      await AppPermissions.create({
        appId: app.id,
        role: 'parent',
        grantedBy: 'system',
      });
      await AppPermissions.create({
        appId: app.id,
        role: 'student',
        grantedBy: 'system',
      });
    }
  }

  console.log('Default data seeded successfully');
}
