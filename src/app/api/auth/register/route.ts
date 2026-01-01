import { NextRequest, NextResponse } from 'next/server';
import { hashPassword, normalizePhoneNumber, isValidPhoneNumber, isValidPassword } from '@/lib/auth';
import { Users, seedDefaultData } from '@/lib/database';
import type { ClassLevel } from '@/types';

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
      email: email?.trim() || null,
      passwordHash,
      role,
      isActive: true,
    };

    // Find child to link if parent is registering with childStudentId
    let childToLink: string | null = null;

    if (role === 'student') {
      userData = {
        ...userData,
        classLevel: classLevel as ClassLevel,
        studentId: studentId.trim(),
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        enrollmentDate: new Date(),
      };
    } else {
      // Parent
      userData = {
        ...userData,
        occupation: occupation?.trim() || null,
        address: address?.trim() || null,
      };

      // If child student ID provided, find the child
      if (childStudentId) {
        const students = await Users.getByRole('student');
        const childStudent = students.find(
          (s) => s.studentId === childStudentId.trim()
        );
        if (childStudent) {
          childToLink = childStudent.id;
        }
      }
    }

    const newUser = await Users.create(userData);

    // If parent linked to a child, create the relationship in junction table
    if (role === 'parent' && childToLink) {
      await Users.linkParentChild(newUser.id, childToLink);
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
