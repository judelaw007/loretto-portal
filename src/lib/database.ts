// ============================================
// LORETTO SCHOOL PORTAL - DATABASE LAYER
// ============================================
// PostgreSQL with Drizzle ORM

import { db } from './db';
import { eq, desc, and, or, gt, lt, inArray } from 'drizzle-orm';
import {
  users,
  sessions,
  otpRequests,
  apps,
  appPermissions,
  announcements,
  feeStructures,
  feePayments,
  parentChildren,
  type UserRole,
  type AdminType,
  type ClassLevel,
  type AppTargetType,
  type PaymentMethod,
} from './schema';

// Re-export types
export type {
  UserRole,
  AdminType,
  ClassLevel,
  AppTargetType,
  PaymentMethod,
};

// Infer types from schema
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type App = typeof apps.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type Announcement = typeof announcements.$inferSelect;
export type FeeStructure = typeof feeStructures.$inferSelect;
export type FeePayment = typeof feePayments.$inferSelect;

// ============================================
// USER OPERATIONS
// ============================================

export const Users = {
  async getAll() {
    return db.select().from(users).orderBy(desc(users.createdAt));
  },

  async getById(id: string) {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0] || null;
  },

  async getByPhone(phone: string) {
    const result = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
    return result[0] || null;
  },

  async getByRole(role: UserRole) {
    return db.select().from(users).where(eq(users.role, role)).orderBy(desc(users.createdAt));
  },

  async create(data: NewUser) {
    const result = await db.insert(users).values({
      ...data,
      isActive: data.isActive ?? true,
    }).returning();
    return result[0];
  },

  async update(id: string, data: Partial<NewUser>) {
    const result = await db.update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  },

  async delete(id: string) {
    try {
      await db.delete(users).where(eq(users.id, id));
      return true;
    } catch {
      return false;
    }
  },

  async getStudentsByClass(classLevel: ClassLevel) {
    return db.select().from(users).where(
      and(eq(users.role, 'student'), eq(users.classLevel, classLevel))
    );
  },

  async getChildren(parentId: string) {
    const relations = await db.select({ childId: parentChildren.childId })
      .from(parentChildren)
      .where(eq(parentChildren.parentId, parentId));

    if (relations.length === 0) return [];

    const childIds = relations.map(r => r.childId);
    return db.select().from(users).where(inArray(users.id, childIds));
  },

  async linkParentChild(parentId: string, childId: string) {
    await db.insert(parentChildren).values({ parentId, childId }).onConflictDoNothing();
  },
};

// ============================================
// APP OPERATIONS
// ============================================

export const Apps = {
  async getAll() {
    return db.select().from(apps).orderBy(desc(apps.createdAt));
  },

  async getById(id: string) {
    const result = await db.select().from(apps).where(eq(apps.id, id)).limit(1);
    return result[0] || null;
  },

  async getBySlug(slug: string) {
    const result = await db.select().from(apps).where(eq(apps.slug, slug)).limit(1);
    return result[0] || null;
  },

  async getByTargetType(targetType: AppTargetType) {
    return db.select().from(apps).where(
      and(eq(apps.targetType, targetType), eq(apps.isActive, true))
    );
  },

  async create(data: typeof apps.$inferInsert) {
    const result = await db.insert(apps).values({
      ...data,
      isSystemApp: data.isSystemApp ?? false,
      isActive: data.isActive ?? true,
    }).returning();
    return result[0];
  },

  async update(id: string, data: Partial<typeof apps.$inferInsert>) {
    const result = await db.update(apps)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(apps.id, id))
      .returning();
    return result[0];
  },

  async delete(id: string) {
    try {
      const app = await this.getById(id);
      if (app?.isSystemApp) return false;
      await db.delete(apps).where(eq(apps.id, id));
      return true;
    } catch {
      return false;
    }
  },
};

// ============================================
// APP PERMISSION OPERATIONS
// ============================================

export const AppPermissions = {
  async getAll() {
    return db.select().from(appPermissions);
  },

  async getByAppId(appId: string) {
    return db.select().from(appPermissions).where(eq(appPermissions.appId, appId));
  },

  async getByUserId(userId: string) {
    return db.select().from(appPermissions).where(eq(appPermissions.userId, userId));
  },

  async create(data: typeof appPermissions.$inferInsert) {
    const result = await db.insert(appPermissions).values(data).returning();
    return result[0];
  },

  async delete(id: string) {
    try {
      await db.delete(appPermissions).where(eq(appPermissions.id, id));
      return true;
    } catch {
      return false;
    }
  },

  async deleteByAppId(appId: string) {
    const result = await db.delete(appPermissions).where(eq(appPermissions.appId, appId));
    return result.count || 0;
  },

  async checkAccess(userId: string, appId: string): Promise<boolean> {
    const user = await Users.getById(userId);
    if (!user) return false;
    if (user.role === 'super_admin') return true;

    const permissions = await db.select().from(appPermissions).where(eq(appPermissions.appId, appId));

    for (const perm of permissions) {
      if (perm.expiresAt && new Date(perm.expiresAt) < new Date()) continue;
      if (perm.userId === userId) return true;
      if (perm.role === user.role) return true;
      if (user.role === 'admin' && perm.adminType === user.adminType) return true;

      if (perm.classLevels && perm.classLevels.length > 0) {
        if (user.role === 'student' && user.classLevel) {
          if (perm.classLevels.includes(user.classLevel)) {
            if (!perm.targetRole || perm.targetRole === 'student') return true;
          }
        }
        if (user.role === 'parent') {
          const children = await Users.getChildren(user.id);
          for (const child of children) {
            if (child.classLevel && perm.classLevels.includes(child.classLevel)) {
              if (!perm.targetRole || perm.targetRole === 'parent') return true;
            }
          }
        }
      }
    }
    return false;
  },

  async getUserApps(userId: string) {
    const user = await Users.getById(userId);
    if (!user) return [];

    const allApps = await db.select().from(apps).where(eq(apps.isActive, true));
    if (user.role === 'super_admin') return allApps;

    const targetType: AppTargetType = user.role === 'admin' ? 'admin' : 'client';
    const relevantApps = allApps.filter(a => a.targetType === targetType);

    const accessibleApps = [];
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
  async getByToken(token: string) {
    const result = await db.select().from(sessions).where(eq(sessions.token, token)).limit(1);
    const session = result[0];
    if (!session) return null;
    if (new Date(session.expiresAt) < new Date()) {
      await this.delete(session.id);
      return null;
    }
    // Get user data
    const user = await Users.getById(session.userId);
    return { ...session, user };
  },

  async create(userId: string, token: string, expiresInHours: number = 24 * 7) {
    const result = await db.insert(sessions).values({
      userId,
      token,
      expiresAt: new Date(Date.now() + expiresInHours * 60 * 60 * 1000),
    }).returning();
    return result[0];
  },

  async delete(id: string) {
    try {
      await db.delete(sessions).where(eq(sessions.id, id));
      return true;
    } catch {
      return false;
    }
  },

  async deleteByUserId(userId: string) {
    const result = await db.delete(sessions).where(eq(sessions.userId, userId));
    return result.count || 0;
  },

  async cleanup() {
    const result = await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
    return result.count || 0;
  },
};

// ============================================
// OTP OPERATIONS
// ============================================

export const OTPs = {
  async create(phone: string, purpose: string) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const result = await db.insert(otpRequests).values({
      phone,
      otp,
      purpose,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    }).returning();
    return result[0];
  },

  async verify(phone: string, otp: string, purpose: string): Promise<boolean> {
    const result = await db.select().from(otpRequests).where(
      and(
        eq(otpRequests.phone, phone),
        eq(otpRequests.otp, otp),
        eq(otpRequests.purpose, purpose),
        eq(otpRequests.isUsed, false),
        gt(otpRequests.expiresAt, new Date())
      )
    ).limit(1);

    const record = result[0];
    if (!record) return false;

    await db.update(otpRequests)
      .set({ isUsed: true })
      .where(eq(otpRequests.id, record.id));

    return true;
  },

  async cleanup() {
    const result = await db.delete(otpRequests).where(
      or(
        lt(otpRequests.expiresAt, new Date()),
        eq(otpRequests.isUsed, true)
      )
    );
    return result.count || 0;
  },
};

// ============================================
// ANNOUNCEMENT OPERATIONS
// ============================================

export const Announcements = {
  async getAll() {
    return db.select().from(announcements).orderBy(desc(announcements.isPinned), desc(announcements.publishedAt));
  },

  async getById(id: string) {
    const result = await db.select().from(announcements).where(eq(announcements.id, id)).limit(1);
    return result[0] || null;
  },

  async create(data: typeof announcements.$inferInsert) {
    const result = await db.insert(announcements).values(data).returning();
    return result[0];
  },

  async update(id: string, data: Partial<typeof announcements.$inferInsert>) {
    const result = await db.update(announcements)
      .set(data)
      .where(eq(announcements.id, id))
      .returning();
    return result[0];
  },

  async delete(id: string) {
    try {
      await db.delete(announcements).where(eq(announcements.id, id));
      return true;
    } catch {
      return false;
    }
  },

  async getForUser(userId: string) {
    const user = await Users.getById(userId);
    if (!user) return [];

    const allAnnouncements = await db.select().from(announcements).where(
      or(
        eq(announcements.expiresAt, null as unknown as Date),
        gt(announcements.expiresAt, new Date())
      )
    ).orderBy(desc(announcements.isPinned), desc(announcements.publishedAt));

    return allAnnouncements.filter(a => {
      if (a.targetRoles && a.targetRoles.length > 0) {
        if (!a.targetRoles.includes(user.role)) return false;
      }
      if (a.targetClasses && a.targetClasses.length > 0 && user.role === 'student' && user.classLevel) {
        if (!a.targetClasses.includes(user.classLevel)) return false;
      }
      return true;
    });
  },
};

// ============================================
// FEE OPERATIONS
// ============================================

export const FeeStructures = {
  async getAll() {
    return db.select().from(feeStructures);
  },

  async getById(id: string) {
    const result = await db.select().from(feeStructures).where(eq(feeStructures.id, id)).limit(1);
    return result[0] || null;
  },

  async getByClassAndTerm(classLevel: ClassLevel, termId: string) {
    const result = await db.select().from(feeStructures).where(
      and(eq(feeStructures.classLevel, classLevel), eq(feeStructures.termId, termId))
    ).limit(1);
    return result[0] || null;
  },

  async create(data: typeof feeStructures.$inferInsert) {
    const result = await db.insert(feeStructures).values(data).returning();
    return result[0];
  },

  async update(id: string, data: Partial<typeof feeStructures.$inferInsert>) {
    const result = await db.update(feeStructures)
      .set(data)
      .where(eq(feeStructures.id, id))
      .returning();
    return result[0];
  },
};

export const FeePayments = {
  async getAll() {
    return db.select().from(feePayments);
  },

  async getByStudentId(studentId: string) {
    return db.select().from(feePayments).where(eq(feePayments.studentId, studentId));
  },

  async create(data: typeof feePayments.$inferInsert) {
    const result = await db.insert(feePayments).values(data).returning();
    return result[0];
  },
};

// ============================================
// SEED DEFAULT DATA
// ============================================

export async function seedDefaultData() {
  const existingApps = await db.select().from(apps).limit(1);
  if (existingApps.length > 0) return;

  const adminApps = [
    { name: 'Student Management', slug: 'student-management', description: 'Manage student records, enrollment, and profiles', icon: 'users', targetType: 'admin' as const, route: '/admin/apps/student-management', isSystemApp: true },
    { name: 'Parent Management', slug: 'parent-management', description: 'Manage parent records and student-parent relationships', icon: 'user-plus', targetType: 'admin' as const, route: '/admin/apps/parent-management', isSystemApp: true },
    { name: 'Class Management', slug: 'class-management', description: 'Manage classes, sections, and class assignments', icon: 'layers', targetType: 'admin' as const, route: '/admin/apps/class-management', isSystemApp: true },
    { name: 'Fee Management', slug: 'fee-management', description: 'Manage fee structures, payments, and receipts', icon: 'credit-card', targetType: 'admin' as const, route: '/admin/apps/fee-management', isSystemApp: true },
    { name: 'Announcements', slug: 'announcements-admin', description: 'Create and manage school announcements', icon: 'megaphone', targetType: 'admin' as const, route: '/admin/apps/announcements', isSystemApp: true },
    { name: 'Results Entry', slug: 'results-entry', description: 'Enter and manage student results', icon: 'file-text', targetType: 'admin' as const, route: '/admin/apps/results-entry', isSystemApp: true },
  ];

  const clientApps = [
    { name: 'View Results', slug: 'view-results', description: 'View academic results and report cards', icon: 'award', targetType: 'client' as const, route: '/dashboard/apps/view-results', isSystemApp: true },
    { name: 'Pay Fees', slug: 'pay-fees', description: 'View fee status and make payments', icon: 'wallet', targetType: 'client' as const, route: '/dashboard/apps/pay-fees', isSystemApp: true },
    { name: 'Announcements', slug: 'announcements', description: 'View school announcements and notices', icon: 'bell', targetType: 'client' as const, route: '/dashboard/apps/announcements', isSystemApp: true },
    { name: 'Profile', slug: 'profile', description: 'View and update your profile', icon: 'user', targetType: 'client' as const, route: '/dashboard/apps/profile', isSystemApp: true },
  ];

  for (const app of [...adminApps, ...clientApps]) {
    await db.insert(apps).values(app);
  }

  console.log('Default apps seeded successfully');
}
