// ============================================
// LORETTO SCHOOL PORTAL - TYPE DEFINITIONS
// ============================================

// Re-export types from database schema
export type {
  UserRole,
  AdminType,
  ClassLevel,
  AppTargetType,
  PaymentMethod,
} from '@/lib/schema';

// Import types from database for use
import type {
  UserRole,
  ClassLevel,
  AdminType,
  AppTargetType,
} from '@/lib/schema';

// Class level metadata
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

// ============================================
// USER TYPES
// ============================================

// Base User Interface (matches database schema)
export interface User {
  id: string;
  phone: string;
  passwordHash: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  email: string | null;
  profileImage: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  // Admin specific fields
  adminType: AdminType | null;
  department: string | null;
  assignedClasses: string[] | null;

  // Student specific fields
  classLevel: ClassLevel | null;
  studentId: string | null;
  dateOfBirth: Date | null;
  enrollmentDate: Date | null;
  section: string | null;

  // Parent specific fields
  occupation: string | null;
  address: string | null;
}

// Super Admin - Full system control
export interface SuperAdmin extends User {
  role: 'super_admin';
}

// Admin - Staff members (teachers, accountants, etc.)
export interface Admin extends User {
  role: 'admin';
  adminType: AdminType;
}

// Parent - Can have multiple children (linked via junction table)
export interface Parent extends User {
  role: 'parent';
}

// Student
export interface Student extends User {
  role: 'student';
  classLevel: ClassLevel;
  studentId: string;
}

// ============================================
// APP/FEATURE SYSTEM
// ============================================

// App Definition - A feature/module in the system
export interface App {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  targetType: AppTargetType;
  route: string;
  isSystemApp: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Permission - Links apps to users or groups
export interface AppPermission {
  id: string;
  appId: string;
  userId: string | null;
  role: UserRole | null;
  adminType: AdminType | null;
  classLevels: string[] | null;
  targetRole: string | null;
  grantedById: string;
  grantedAt: Date;
  expiresAt: Date | null;
}

// ============================================
// ACADEMIC STRUCTURES
// ============================================

export interface AcademicSession {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  isCurrent: boolean;
}

export interface Term {
  id: string;
  sessionId: string;
  name: string;
  startDate: Date;
  endDate: Date;
  isCurrent: boolean;
}

// ============================================
// FEE MANAGEMENT
// ============================================

export interface FeeStructure {
  id: string;
  classLevel: ClassLevel;
  termId: string;
  sessionId: string;
  tuitionFee: number;
  otherFees: unknown; // JSON
  totalAmount: number;
}

export interface FeePayment {
  id: string;
  studentId: string;
  feeStructureId: string;
  amountPaid: number;
  paymentDate: Date;
  paymentMethod: 'cash' | 'bank_transfer' | 'card' | 'online';
  receiptNumber: string;
  recordedById: string;
  notes: string | null;
  createdAt: Date;
}

// ============================================
// ANNOUNCEMENTS
// ============================================

export interface Announcement {
  id: string;
  title: string;
  content: string;
  authorId: string;
  targetRoles: string[] | null;
  targetClasses: string[] | null;
  isPinned: boolean;
  publishedAt: Date;
  expiresAt: Date | null;
}

// ============================================
// RESULTS
// ============================================

export interface Subject {
  id: string;
  name: string;
  code: string;
  classLevels: string[] | null;
}

export interface Result {
  id: string;
  studentId: string;
  subjectId: string;
  termId: string;
  continuousAssessment: number;
  examScore: number;
  totalScore: number;
  grade: string;
  remarks: string | null;
  recordedById: string;
  recordedAt: Date;
}

// ============================================
// SESSION & AUTH
// ============================================

export interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface OTPRequest {
  id: string;
  phone: string;
  otp: string;
  purpose: string;
  expiresAt: Date;
  isUsed: boolean;
  createdAt: Date;
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
