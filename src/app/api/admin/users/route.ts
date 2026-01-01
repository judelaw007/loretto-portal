import { NextRequest, NextResponse } from 'next/server';
import { getSession, hashPassword, normalizePhoneNumber, isValidPhoneNumber } from '@/lib/auth';
import { Users, seedDefaultData } from '@/lib/database';
import type { ClassLevel, AdminType } from '@/types';

export async function GET(request: NextRequest) {
  try {
    await seedDefaultData();

    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    if (!['super_admin', 'admin'].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const allUsers = await Users.getAll();

    // Remove password hashes
    const users = allUsers.map(({ passwordHash, ...user }) => user);

    return NextResponse.json({
      success: true,
      users,
    });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await seedDefaultData();

    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Only Super Admins can create users' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      role,
      firstName,
      lastName,
      phone,
      email,
      password,
      // Role-specific fields
      adminType,
      department,
      assignedClasses,
      classLevel,
      studentId,
      dateOfBirth,
      occupation,
      address,
    } = body;

    // Validate required fields
    if (!firstName || !lastName || !phone || !password || !role) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!isValidPhoneNumber(phone)) {
      return NextResponse.json(
        { success: false, error: 'Invalid phone number' },
        { status: 400 }
      );
    }

    const normalizedPhone = normalizePhoneNumber(phone);

    // Check if phone already exists
    const existingUser = await Users.getByPhone(normalizedPhone);
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Phone number already registered' },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    let userData: any = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: normalizedPhone,
      email: email?.trim() || undefined,
      passwordHash,
      role,
      isActive: true,
    };

    // Add role-specific fields
    if (role === 'admin') {
      userData.adminType = adminType as AdminType || 'general';
      userData.department = department;
      userData.assignedClasses = assignedClasses || [];
    } else if (role === 'student') {
      userData.classLevel = classLevel as ClassLevel;
      userData.studentId = studentId;
      userData.dateOfBirth = dateOfBirth;
      userData.enrollmentDate = new Date().toISOString();
      userData.parentIds = [];
    } else if (role === 'parent') {
      userData.occupation = occupation;
      userData.address = address;
      userData.childrenIds = [];
    }

    const newUser = await Users.create(userData);
    const { passwordHash: _, ...userWithoutPassword } = newUser;

    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred' },
      { status: 500 }
    );
  }
}
