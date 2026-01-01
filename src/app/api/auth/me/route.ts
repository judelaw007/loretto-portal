import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { AppPermissions, Users } from '@/lib/database';
import type { Student } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get user apps
    const apps = await AppPermissions.getUserApps(session.user.id);

    // For parents, get their children
    let children: any[] = [];
    if (session.user.role === 'parent') {
      children = await Users.getChildren(session.user.id);
      children = children.map(({ passwordHash, ...child }) => child);
    }

    // Don't send password hash to client
    const { passwordHash, ...userWithoutPassword } = session.user;

    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
      apps,
      children,
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred' },
      { status: 500 }
    );
  }
}
