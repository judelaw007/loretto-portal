import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { Apps, AppPermissions } from '@/lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const app = await Apps.getById(id);

    if (!app) {
      return NextResponse.json(
        { success: false, error: 'App not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      app,
    });
  } catch (error) {
    console.error('Get app error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Only Super Admins can update apps' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const app = await Apps.getById(id);

    if (!app) {
      return NextResponse.json(
        { success: false, error: 'App not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const updates: any = {};

    // Allowed fields to update
    const allowedFields = ['name', 'description', 'icon', 'route', 'isActive'];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    const updatedApp = await Apps.update(id, updates);

    if (!updatedApp) {
      return NextResponse.json(
        { success: false, error: 'Failed to update app' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      app: updatedApp,
    });
  } catch (error) {
    console.error('Update app error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Only Super Admins can delete apps' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const app = await Apps.getById(id);

    if (!app) {
      return NextResponse.json(
        { success: false, error: 'App not found' },
        { status: 404 }
      );
    }

    if (app.isSystemApp) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete system apps' },
        { status: 403 }
      );
    }

    // Delete associated permissions first
    await AppPermissions.deleteByAppId(id);

    // Then delete the app
    const deleted = await Apps.delete(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete app' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'App deleted successfully',
    });
  } catch (error) {
    console.error('Delete app error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred' },
      { status: 500 }
    );
  }
}
