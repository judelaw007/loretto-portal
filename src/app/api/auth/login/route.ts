import { NextRequest, NextResponse } from 'next/server';
import { login, normalizePhoneNumber, isValidPhoneNumber } from '@/lib/auth';
import { seedDefaultData } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    // Ensure default data is seeded
    await seedDefaultData();

    const body = await request.json();
    const { phone, password } = body;

    if (!phone || !password) {
      return NextResponse.json(
        { success: false, error: 'Phone number and password are required' },
        { status: 400 }
      );
    }

    // Validate phone number
    if (!isValidPhoneNumber(phone)) {
      return NextResponse.json(
        { success: false, error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    const result = await login(phone, password);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 401 }
      );
    }

    // Don't send password hash to client
    const { passwordHash, ...userWithoutPassword } = result.user!;

    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
      message: 'Login successful',
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred during login' },
      { status: 500 }
    );
  }
}
