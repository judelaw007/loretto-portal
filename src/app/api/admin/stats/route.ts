import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { Users, Apps, seedDefaultData } from '@/lib/database';

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

    // Only super_admin and admin can access stats
    if (!['super_admin', 'admin'].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const allUsers = await Users.getAll();
    const allApps = await Apps.getAll();

    const stats = {
      totalUsers: allUsers.length,
      totalStudents: allUsers.filter(u => u.role === 'student').length,
      totalParents: allUsers.filter(u => u.role === 'parent').length,
      totalAdmins: allUsers.filter(u => u.role === 'admin').length,
      totalSuperAdmins: allUsers.filter(u => u.role === 'super_admin').length,
      totalApps: allApps.filter(a => a.isActive).length,
      adminApps: allApps.filter(a => a.targetType === 'admin' && a.isActive).length,
      clientApps: allApps.filter(a => a.targetType === 'client' && a.isActive).length,
    };

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred' },
      { status: 500 }
    );
  }
}
