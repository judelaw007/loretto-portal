import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { AppPermissions, seedDefaultData } from '@/lib/database';

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

    if (session.user.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Only Super Admins can view permissions' },
        { status: 403 }
      );
    }

    const permissions = await AppPermissions.getAll();

    return NextResponse.json({
      success: true,
      permissions,
    });
  } catch (error) {
    console.error('Get permissions error:', error);
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
        { success: false, error: 'Only Super Admins can create permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { appId, userId, role, adminType, classLevels, targetRole } = body;

    if (!appId) {
      return NextResponse.json(
        { success: false, error: 'App ID is required' },
        { status: 400 }
      );
    }

    // At least one permission type must be specified
    if (!userId && !role && !adminType && (!classLevels || classLevels.length === 0)) {
      return NextResponse.json(
        { success: false, error: 'At least one permission type must be specified' },
        { status: 400 }
      );
    }

    const permissionData: any = {
      appId,
      grantedBy: session.user.id,
    };

    if (userId) permissionData.userId = userId;
    if (role) permissionData.role = role;
    if (adminType) permissionData.adminType = adminType;
    if (classLevels && classLevels.length > 0) {
      permissionData.classLevels = classLevels;
      if (targetRole) permissionData.targetRole = targetRole;
    }

    const newPermission = await AppPermissions.create(permissionData);

    return NextResponse.json({
      success: true,
      permission: newPermission,
    });
  } catch (error) {
    console.error('Create permission error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred' },
      { status: 500 }
    );
  }
}
