// ============================================
// LORETTO SCHOOL PORTAL - DRIZZLE SCHEMA
// ============================================

import { pgTable, text, boolean, timestamp, pgEnum, jsonb, real, unique, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================
// ENUMS
// ============================================

export const userRoleEnum = pgEnum('user_role', ['super_admin', 'admin', 'parent', 'student']);

export const adminTypeEnum = pgEnum('admin_type', ['teacher', 'accountant', 'registrar', 'principal', 'general']);

export const classLevelEnum = pgEnum('class_level', [
  'creche', 'preschool_1', 'preschool_2', 'preschool_3',
  'grade_1', 'grade_2', 'grade_3', 'grade_4', 'grade_5', 'grade_6',
  'jss_1', 'jss_2', 'jss_3', 'sss_1', 'sss_2', 'sss_3'
]);

export const appTargetTypeEnum = pgEnum('app_target_type', ['admin', 'client']);

export const paymentMethodEnum = pgEnum('payment_method', ['cash', 'bank_transfer', 'card', 'online']);

// ============================================
// TYPE EXPORTS
// ============================================

export type UserRole = 'super_admin' | 'admin' | 'parent' | 'student';
export type AdminType = 'teacher' | 'accountant' | 'registrar' | 'principal' | 'general';
export type ClassLevel = 'creche' | 'preschool_1' | 'preschool_2' | 'preschool_3' |
  'grade_1' | 'grade_2' | 'grade_3' | 'grade_4' | 'grade_5' | 'grade_6' |
  'jss_1' | 'jss_2' | 'jss_3' | 'sss_1' | 'sss_2' | 'sss_3';
export type AppTargetType = 'admin' | 'client';
export type PaymentMethod = 'cash' | 'bank_transfer' | 'card' | 'online';

// ============================================
// USER TABLE
// ============================================

export const users = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  phone: text('phone').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: userRoleEnum('role').notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email'),
  profileImage: text('profile_image'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),

  // Admin specific
  adminType: adminTypeEnum('admin_type'),
  department: text('department'),
  assignedClasses: text('assigned_classes').array(),

  // Student specific
  classLevel: classLevelEnum('class_level'),
  studentId: text('student_id').unique(),
  dateOfBirth: timestamp('date_of_birth'),
  enrollmentDate: timestamp('enrollment_date'),
  section: text('section'),

  // Parent specific
  occupation: text('occupation'),
  address: text('address'),
}, (table) => ({
  roleIdx: index('users_role_idx').on(table.role),
  classLevelIdx: index('users_class_level_idx').on(table.classLevel),
  adminTypeIdx: index('users_admin_type_idx').on(table.adminType),
}));

// Parent-Child relationship table
export const parentChildren = pgTable('parent_children', {
  parentId: text('parent_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  childId: text('child_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
}, (table) => ({
  pk: unique().on(table.parentId, table.childId),
}));

// ============================================
// SESSION & AUTH
// ============================================

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('sessions_user_id_idx').on(table.userId),
  tokenIdx: index('sessions_token_idx').on(table.token),
}));

export const otpRequests = pgTable('otp_requests', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  phone: text('phone').notNull(),
  otp: text('otp').notNull(),
  purpose: text('purpose').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  isUsed: boolean('is_used').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  phoneOtpIdx: index('otp_phone_otp_idx').on(table.phone, table.otp),
}));

// ============================================
// APP & PERMISSION SYSTEM
// ============================================

export const apps = pgTable('apps', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description').notNull(),
  icon: text('icon').notNull(),
  targetType: appTargetTypeEnum('target_type').notNull(),
  route: text('route').notNull(),
  isSystemApp: boolean('is_system_app').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  targetTypeIdx: index('apps_target_type_idx').on(table.targetType),
  isActiveIdx: index('apps_is_active_idx').on(table.isActive),
}));

export const appPermissions = pgTable('app_permissions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  appId: text('app_id').notNull().references(() => apps.id, { onDelete: 'cascade' }),

  // Permission can be granted to:
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
  role: userRoleEnum('role'),
  adminType: adminTypeEnum('admin_type'),
  classLevels: text('class_levels').array(),
  targetRole: text('target_role'),

  grantedById: text('granted_by_id').notNull().references(() => users.id),
  grantedAt: timestamp('granted_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at'),
}, (table) => ({
  appIdIdx: index('app_permissions_app_id_idx').on(table.appId),
  userIdIdx: index('app_permissions_user_id_idx').on(table.userId),
  roleIdx: index('app_permissions_role_idx').on(table.role),
}));

// ============================================
// ACADEMIC STRUCTURES
// ============================================

export const academicSessions = pgTable('academic_sessions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  isCurrent: boolean('is_current').default(false).notNull(),
});

export const terms = pgTable('terms', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  sessionId: text('session_id').notNull().references(() => academicSessions.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  isCurrent: boolean('is_current').default(false).notNull(),
}, (table) => ({
  sessionIdIdx: index('terms_session_id_idx').on(table.sessionId),
}));

export const subjects = pgTable('subjects', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  code: text('code').notNull().unique(),
  classLevels: text('class_levels').array(),
});

// ============================================
// RESULTS
// ============================================

export const results = pgTable('results', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  studentId: text('student_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  subjectId: text('subject_id').notNull().references(() => subjects.id),
  termId: text('term_id').notNull().references(() => terms.id),
  continuousAssessment: real('continuous_assessment').notNull(),
  examScore: real('exam_score').notNull(),
  totalScore: real('total_score').notNull(),
  grade: text('grade').notNull(),
  remarks: text('remarks'),
  recordedById: text('recorded_by_id').notNull().references(() => users.id),
  recordedAt: timestamp('recorded_at').defaultNow().notNull(),
}, (table) => ({
  studentSubjectTermUnique: unique().on(table.studentId, table.subjectId, table.termId),
  studentIdIdx: index('results_student_id_idx').on(table.studentId),
  termIdIdx: index('results_term_id_idx').on(table.termId),
}));

// ============================================
// FEE MANAGEMENT
// ============================================

export const feeStructures = pgTable('fee_structures', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  classLevel: classLevelEnum('class_level').notNull(),
  termId: text('term_id').notNull().references(() => terms.id),
  sessionId: text('session_id').notNull().references(() => academicSessions.id),
  tuitionFee: real('tuition_fee').notNull(),
  otherFees: jsonb('other_fees').notNull(), // Array of {name: string, amount: number}
  totalAmount: real('total_amount').notNull(),
}, (table) => ({
  classTermUnique: unique().on(table.classLevel, table.termId),
  classLevelIdx: index('fee_structures_class_level_idx').on(table.classLevel),
  termIdIdx: index('fee_structures_term_id_idx').on(table.termId),
}));

export const feePayments = pgTable('fee_payments', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  studentId: text('student_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  feeStructureId: text('fee_structure_id').notNull().references(() => feeStructures.id),
  amountPaid: real('amount_paid').notNull(),
  paymentDate: timestamp('payment_date').notNull(),
  paymentMethod: paymentMethodEnum('payment_method').notNull(),
  receiptNumber: text('receipt_number').notNull().unique(),
  recordedById: text('recorded_by_id').notNull().references(() => users.id),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  studentIdIdx: index('fee_payments_student_id_idx').on(table.studentId),
  feeStructureIdIdx: index('fee_payments_fee_structure_id_idx').on(table.feeStructureId),
}));

// ============================================
// ANNOUNCEMENTS
// ============================================

export const announcements = pgTable('announcements', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text('title').notNull(),
  content: text('content').notNull(),
  authorId: text('author_id').notNull().references(() => users.id),
  targetRoles: text('target_roles').array(),
  targetClasses: text('target_classes').array(),
  isPinned: boolean('is_pinned').default(false).notNull(),
  publishedAt: timestamp('published_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at'),
}, (table) => ({
  authorIdIdx: index('announcements_author_id_idx').on(table.authorId),
  publishedAtIdx: index('announcements_published_at_idx').on(table.publishedAt),
}));

// ============================================
// RELATIONS
// ============================================

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  grantedPermissions: many(appPermissions, { relationName: 'grantedBy' }),
  userPermissions: many(appPermissions, { relationName: 'userPermission' }),
  announcements: many(announcements),
  recordedResults: many(results, { relationName: 'recordedBy' }),
  studentResults: many(results, { relationName: 'studentResults' }),
  feePaymentsRecorded: many(feePayments, { relationName: 'recordedBy' }),
  studentFeePayments: many(feePayments, { relationName: 'studentPayments' }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const appsRelations = relations(apps, ({ many }) => ({
  permissions: many(appPermissions),
}));

export const appPermissionsRelations = relations(appPermissions, ({ one }) => ({
  app: one(apps, { fields: [appPermissions.appId], references: [apps.id] }),
  user: one(users, { fields: [appPermissions.userId], references: [users.id], relationName: 'userPermission' }),
  grantedBy: one(users, { fields: [appPermissions.grantedById], references: [users.id], relationName: 'grantedBy' }),
}));

export const academicSessionsRelations = relations(academicSessions, ({ many }) => ({
  terms: many(terms),
  feeStructures: many(feeStructures),
}));

export const termsRelations = relations(terms, ({ one, many }) => ({
  session: one(academicSessions, { fields: [terms.sessionId], references: [academicSessions.id] }),
  results: many(results),
  feeStructures: many(feeStructures),
}));

export const subjectsRelations = relations(subjects, ({ many }) => ({
  results: many(results),
}));

export const resultsRelations = relations(results, ({ one }) => ({
  student: one(users, { fields: [results.studentId], references: [users.id], relationName: 'studentResults' }),
  subject: one(subjects, { fields: [results.subjectId], references: [subjects.id] }),
  term: one(terms, { fields: [results.termId], references: [terms.id] }),
  recordedBy: one(users, { fields: [results.recordedById], references: [users.id], relationName: 'recordedBy' }),
}));

export const feeStructuresRelations = relations(feeStructures, ({ one, many }) => ({
  term: one(terms, { fields: [feeStructures.termId], references: [terms.id] }),
  session: one(academicSessions, { fields: [feeStructures.sessionId], references: [academicSessions.id] }),
  payments: many(feePayments),
}));

export const feePaymentsRelations = relations(feePayments, ({ one }) => ({
  student: one(users, { fields: [feePayments.studentId], references: [users.id], relationName: 'studentPayments' }),
  feeStructure: one(feeStructures, { fields: [feePayments.feeStructureId], references: [feeStructures.id] }),
  recordedBy: one(users, { fields: [feePayments.recordedById], references: [users.id], relationName: 'recordedBy' }),
}));

export const announcementsRelations = relations(announcements, ({ one }) => ({
  author: one(users, { fields: [announcements.authorId], references: [users.id] }),
}));
