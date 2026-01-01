// ============================================
// LORETTO SCHOOL PORTAL - AUTHENTICATION
// ============================================

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { Users, Sessions } from './database';
import type { User } from '@/types';

const JWT_SECRET = process.env.JWT_SECRET || 'loretto-school-secret-key-change-in-production';
const COOKIE_NAME = 'loretto_session';

// Password hashing
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// JWT Token
export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string };
  } catch {
    return null;
  }
}

// Session Management
export async function createSession(userId: string): Promise<string> {
  const token = generateToken(userId);
  await Sessions.create(userId, token);
  return token;
}

export async function getSession(): Promise<{ user: User; token: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) return null;

  const decoded = verifyToken(token);
  if (!decoded) return null;

  const session = await Sessions.getByToken(token);
  if (!session) return null;

  const user = await Users.getById(session.userId);
  if (!user || !user.isActive) return null;

  return { user, token };
}

export async function requireAuth(): Promise<User> {
  const session = await getSession();
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session.user;
}

export async function requireRole(roles: string[]): Promise<User> {
  const user = await requireAuth();
  if (!roles.includes(user.role)) {
    throw new Error('Forbidden');
  }
  return user;
}

// Login
export async function login(
  phone: string,
  password: string
): Promise<{ success: boolean; token?: string; user?: User; error?: string }> {
  // Normalize phone number
  const normalizedPhone = normalizePhoneNumber(phone);

  const user = await Users.getByPhone(normalizedPhone);
  if (!user) {
    return { success: false, error: 'Invalid phone number or password' };
  }

  if (!user.isActive) {
    return { success: false, error: 'Your account has been deactivated. Please contact the school.' };
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    return { success: false, error: 'Invalid phone number or password' };
  }

  const token = await createSession(user.id);

  // Set cookie
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/',
  });

  return { success: true, token, user };
}

// Logout
export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (token) {
    const session = await Sessions.getByToken(token);
    if (session) {
      await Sessions.delete(session.id);
    }
  }

  cookieStore.delete(COOKIE_NAME);
}

// Phone number normalization (Nigerian format)
export function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');

  // Handle Nigerian phone numbers
  if (cleaned.startsWith('234')) {
    // Already in international format
    cleaned = '+' + cleaned;
  } else if (cleaned.startsWith('0')) {
    // Local format, convert to international
    cleaned = '+234' + cleaned.slice(1);
  } else if (cleaned.length === 10) {
    // Missing leading zero
    cleaned = '+234' + cleaned;
  } else {
    // Assume it's already correct or add +234
    if (!cleaned.startsWith('+')) {
      cleaned = '+234' + cleaned;
    }
  }

  return cleaned;
}

// Validate phone number format
export function isValidPhoneNumber(phone: string): boolean {
  const normalized = normalizePhoneNumber(phone);
  // Nigerian phone numbers should be +234 followed by 10 digits
  return /^\+234\d{10}$/.test(normalized);
}

// Password validation
export function isValidPassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 6) {
    return { valid: false, error: 'Password must be at least 6 characters' };
  }
  if (password.length > 50) {
    return { valid: false, error: 'Password must be less than 50 characters' };
  }
  return { valid: true };
}
