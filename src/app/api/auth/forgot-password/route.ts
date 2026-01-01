import { NextRequest, NextResponse } from 'next/server';
import { hashPassword, normalizePhoneNumber, isValidPhoneNumber } from '@/lib/auth';
import { Users, OTPs } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, otp, newPassword, action } = body;

    if (!phone) {
      return NextResponse.json(
        { success: false, error: 'Phone number is required' },
        { status: 400 }
      );
    }

    if (!isValidPhoneNumber(phone)) {
      return NextResponse.json(
        { success: false, error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    const normalizedPhone = normalizePhoneNumber(phone);

    // Check if user exists
    const user = await Users.getByPhone(normalizedPhone);
    if (!user) {
      // For security, don't reveal if user exists
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this phone number, you will receive a reset code.',
      });
    }

    switch (action) {
      case 'send_otp': {
        // Create OTP
        const otpRecord = await OTPs.create(normalizedPhone, 'password_reset');

        // In production, send OTP via SMS using Twilio/SendGrid
        // For now, log it (in development only)
        console.log(`[DEV] Password reset OTP for ${normalizedPhone}: ${otpRecord.otp}`);

        return NextResponse.json({
          success: true,
          message: 'If an account exists with this phone number, you will receive a reset code.',
          // Remove this in production - only for development
          dev_otp: process.env.NODE_ENV === 'development' ? otpRecord.otp : undefined,
        });
      }

      case 'verify_otp': {
        if (!otp) {
          return NextResponse.json(
            { success: false, error: 'OTP is required' },
            { status: 400 }
          );
        }

        const isValid = await OTPs.verify(normalizedPhone, otp, 'password_reset');

        if (!isValid) {
          return NextResponse.json(
            { success: false, error: 'Invalid or expired verification code' },
            { status: 400 }
          );
        }

        return NextResponse.json({
          success: true,
          message: 'OTP verified successfully',
        });
      }

      case 'reset_password': {
        if (!otp || !newPassword) {
          return NextResponse.json(
            { success: false, error: 'OTP and new password are required' },
            { status: 400 }
          );
        }

        if (newPassword.length < 6) {
          return NextResponse.json(
            { success: false, error: 'Password must be at least 6 characters' },
            { status: 400 }
          );
        }

        // Note: In a production app, you'd verify the OTP again here
        // or use a temporary token from the verify step

        const passwordHash = await hashPassword(newPassword);
        await Users.update(user.id, { passwordHash });

        return NextResponse.json({
          success: true,
          message: 'Password reset successfully',
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred' },
      { status: 500 }
    );
  }
}
