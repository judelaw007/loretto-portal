import { NextRequest, NextResponse } from 'next/server';
import { hashPassword, normalizePhoneNumber, isValidPhoneNumber, isValidPassword } from '@/lib/auth';
import { Users, seedDefaultData } from '@/lib/database';
import type { Parent, Student, ClassLevel } from '@/types';

export async function POST(request: NextRequest) {
  try {
    // Ensure default data is seeded
    await seedDefaultData();

    const body = await request.json();
    const {
      role,
      firstName,
      lastName,
      phone,
      email,
      password,
      // Student fields
      classLevel,
      studentId,
      dateOfBirth,
      // Parent fields
      occupation,
      address,
      childStudentId,
    } = body;

    // Validate required fields
    if (!firstName || !lastName || !phone || !password || !role) {
      return NextResponse.json(
        { success: false, error: 'First name, last name, phone, password, and account type are required' },
        { status: 400 }
      );
    }

    // Validate role
    if (!['parent', 'student'].includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Invalid account type' },
        { status: 400 }
      );
    }

    // Validate phone number
    if (!isValidPhoneNumber(phone)) {
      return NextResponse.json(
        { success: false, error: 'Invalid phone number format. Please use a valid Nigerian phone number.' },
        { status: 400 }
      );
    }

    // Validate password
    const passwordValidation = isValidPassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { success: false, error: passwordValidation.error },
        { status: 400 }
      );
    }

    // Normalize phone number
    const normalizedPhone = normalizePhoneNumber(phone);

    // Check if phone already exists
    const existingUser = await Users.getByPhone(normalizedPhone);
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'An account with this phone number already exists' },
        { status: 409 }
      );
    }

    // Student-specific validation
    if (role === 'student') {
      if (!classLevel || !studentId) {
        return NextResponse.json(
          { success: false, error: 'Class and Student ID are required for student registration' },
          { status: 400 }
        );
      }
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user based on role
    let userData: any = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: normalizedPhone,
      email: email?.trim() || undefined,
      passwordHash,
      role,
      isActive: true,
    };

    if (role === 'student') {
      // Find parent if childStudentId provided (for future linking)
      userData = {
        ...userData,
        classLevel: classLevel as ClassLevel,
        studentId: studentId.trim(),
        dateOfBirth: dateOfBirth || undefined,
        enrollmentDate: new Date().toISOString(),
        parentIds: [],
      } as Omit<Student, 'id' | 'createdAt' | 'updatedAt'>;
    } else {
      // Parent
      let childrenIds: string[] = [];

      // If child student ID provided, find and link
      if (childStudentId) {
        const students = await Users.getByRole('student');
        const childStudent = students.find(
          (s) => (s as Student).studentId === childStudentId.trim()
        );
        if (childStudent) {
          childrenIds.push(childStudent.id);
        }
      }

      userData = {
        ...userData,
        occupation: occupation?.trim() || undefined,
        address: address?.trim() || undefined,
        childrenIds,
      } as Omit<Parent, 'id' | 'createdAt' | 'updatedAt'>;
    }

    const newUser = await Users.create(userData);

    // If parent linked to a child, update child's parentIds
    if (role === 'parent' && (userData as Parent).childrenIds?.length > 0) {
      for (const childId of (userData as Parent).childrenIds) {
        const child = await Users.getById(childId) as Student;
        if (child) {
          await Users.update(childId, {
            parentIds: [...(child.parentIds || []), newUser.id],
          });
        }
      }
    }

    // Don't send password hash to client
    const { passwordHash: _, ...userWithoutPassword } = newUser;

    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
      message: 'Registration successful',
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred during registration' },
      { status: 500 }
    );
  }
}
