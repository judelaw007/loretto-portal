import { NextRequest, NextResponse } from 'next/server';
import { hashPassword } from '@/lib/auth';
import { Users, seedDefaultData } from '@/lib/database';

// This endpoint creates the initial super admin
// Should only be called once during initial setup
export async function POST(request: NextRequest) {
  try {
    // First, seed default apps
    await seedDefaultData();

    // Check if any super admin exists
    const existingUsers = await Users.getAll();
    const existingSuperAdmin = existingUsers.find(u => u.role === 'super_admin');

    if (existingSuperAdmin) {
      return NextResponse.json({
        success: false,
        error: 'Super Admin already exists',
        message: 'Use the login page with your existing credentials',
      });
    }

    // Create default super admin
    // IMPORTANT: Change these credentials after first login!
    const defaultPhone = '+2348012345678';
    const defaultPassword = 'loretto2024';

    const passwordHash = await hashPassword(defaultPassword);

    const superAdmin = await Users.create({
      firstName: 'Super',
      lastName: 'Admin',
      phone: defaultPhone,
      passwordHash,
      role: 'super_admin',
      isActive: true,
    });

    return NextResponse.json({
      success: true,
      message: 'Super Admin created successfully!',
      credentials: {
        phone: defaultPhone,
        password: defaultPassword,
        note: 'IMPORTANT: Change your password after first login!',
      },
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred during seeding' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Send a POST request to this endpoint to create the initial Super Admin',
    warning: 'This should only be done once during initial setup',
  });
}
