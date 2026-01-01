// ============================================
// LORETTO SCHOOL PORTAL - TYPE DEFINITIONS
// ============================================

// User Roles
export type UserRole = 'super_admin' | 'admin' | 'parent' | 'student';

// Class Levels
export type ClassLevel =
  | 'creche'
  | 'preschool_1' | 'preschool_2' | 'preschool_3'
  | 'grade_1' | 'grade_2' | 'grade_3' | 'grade_4' | 'grade_5' | 'grade_6'
  | 'jss_1' | 'jss_2' | 'jss_3'
  | 'sss_1' | 'sss_2' | 'sss_3';

export const CLASS_LEVELS: { value: ClassLevel; label: string; category: string }[] = [
  { value: 'creche', label: 'Creche', category: 'Early Years' },
  { value: 'preschool_1', label: 'Preschool 1', category: 'Preschool' },
  { value: 'preschool_2', label: 'Preschool 2', category: 'Preschool' },
  { value: 'preschool_3', label: 'Preschool 3', category: 'Preschool' },
  { value: 'grade_1', label: 'Grade 1', category: 'Primary' },
  { value: 'grade_2', label: 'Grade 2', category: 'Primary' },
  { value: 'grade_3', label: 'Grade 3', category: 'Primary' },
  { value: 'grade_4', label: 'Grade 4', category: 'Primary' },
  { value: 'grade_5', label: 'Grade 5', category: 'Primary' },
  { value: 'grade_6', label: 'Grade 6', category: 'Primary' },
  { value: 'jss_1', label: 'JSS 1', category: 'Junior Secondary' },
  { value: 'jss_2', label: 'JSS 2', category: 'Junior Secondary' },
  { value: 'jss_3', label: 'JSS 3', category: 'Junior Secondary' },
  { value: 'sss_1', label: 'SSS 1', category: 'Senior Secondary' },
  { value: 'sss_2', label: 'SSS 2', category: 'Senior Secondary' },
  { value: 'sss_3', label: 'SSS 3', category: 'Senior Secondary' },
];

// Admin Types (for role-specific app allocation)
export type AdminType = 'teacher' | 'accountant' | 'registrar' | 'principal' | 'general';

// Base User Interface
export interface User {
  id: string;
  phone: string;
  passwordHash: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  email?: string;
  profileImage?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Super Admin - Full system control
export interface SuperAdmin extends User {
  role: 'super_admin';
}

// Admin - Staff members (teachers, accountants, etc.)
export interface Admin extends User {
  role: 'admin';
  adminType: AdminType;
  department?: string;
  assignedClasses?: ClassLevel[]; // For teachers
  employeeId?: string;
}

// Parent - Can have multiple children
export interface Parent extends User {
  role: 'parent';
  occupation?: string;
  address?: string;
  childrenIds: string[]; // References to Student IDs
}

// Student
export interface Student extends User {
  role: 'student';
  classLevel: ClassLevel;
  studentId: string; // School-issued ID
  parentIds: string[]; // References to Parent IDs
  dateOfBirth?: string;
  enrollmentDate: string;
  section?: string; // e.g., "A", "B", "C"
}

// ============================================
// APP/FEATURE SYSTEM
// ============================================

// Target audience for an app
export type AppTargetType = 'admin' | 'client';

// App Definition - A feature/module in the system
export interface App {
  id: string;
  name: string;
  slug: string; // URL-friendly identifier
  description: string;
  icon: string; // Icon name or URL
  targetType: AppTargetType; // 'admin' or 'client'
  route: string; // The route/path for this app
  isSystemApp: boolean; // System apps can't be deleted
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Permission - Links apps to users or groups
export interface AppPermission {
  id: string;
  appId: string;

  // Permission can be granted to:
  // 1. Specific user
  userId?: string;

  // 2. All users of a role
  role?: UserRole;

  // 3. All admins of a specific type
  adminType?: AdminType;

  // 4. All students/parents of specific classes
  classLevels?: ClassLevel[];

  // 5. Combination of role + class (e.g., parents of JSS1 students)
  targetRole?: 'parent' | 'student';

  grantedBy: string; // User ID of super admin who granted
  grantedAt: string;
  expiresAt?: string; // Optional expiration
}

// ============================================
// ACADEMIC STRUCTURES
// ============================================

export interface AcademicSession {
  id: string;
  name: string; // e.g., "2024/2025"
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

export interface Term {
  id: string;
  sessionId: string;
  name: string; // "First Term", "Second Term", "Third Term"
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

// ============================================
// FEE MANAGEMENT
// ============================================

export interface FeeStructure {
  id: string;
  classLevel: ClassLevel;
  termId: string;
  tuitionFee: number;
  otherFees: { name: string; amount: number }[];
  totalAmount: number;
}

export interface FeePayment {
  id: string;
  studentId: string;
  feeStructureId: string;
  amountPaid: number;
  paymentDate: string;
  paymentMethod: 'cash' | 'bank_transfer' | 'card' | 'online';
  receiptNumber: string;
  recordedBy: string; // Admin ID
  notes?: string;
}

// ============================================
// ANNOUNCEMENTS
// ============================================

export interface Announcement {
  id: string;
  title: string;
  content: string;
  authorId: string;
  targetRoles?: UserRole[];
  targetClasses?: ClassLevel[];
  isPinned: boolean;
  publishedAt: string;
  expiresAt?: string;
}

// ============================================
// RESULTS
// ============================================

export interface Subject {
  id: string;
  name: string;
  code: string;
  classLevels: ClassLevel[]; // Which classes have this subject
}

export interface Result {
  id: string;
  studentId: string;
  subjectId: string;
  termId: string;
  continuousAssessment: number; // CA score
  examScore: number;
  totalScore: number;
  grade: string;
  remarks?: string;
  recordedBy: string; // Teacher ID
  recordedAt: string;
}

// ============================================
// SESSION & AUTH
// ============================================

export interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: string;
  createdAt: string;
}

export interface OTPRequest {
  id: string;
  phone: string;
  otp: string;
  purpose: 'password_reset' | 'verification';
  expiresAt: string;
  isUsed: boolean;
  createdAt: string;
}

// ============================================
// API RESPONSES
// ============================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
