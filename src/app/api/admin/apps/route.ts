import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { Apps, seedDefaultData } from '@/lib/database';

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

    const apps = await Apps.getAll();

    return NextResponse.json({
      success: true,
      apps,
    });
  } catch (error) {
    console.error('Get apps error:', error);
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
        { success: false, error: 'Only Super Admins can create apps' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, slug, description, icon, targetType, route } = body;

    if (!name || !slug || !description || !targetType || !route) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const existingApp = await Apps.getBySlug(slug);
    if (existingApp) {
      return NextResponse.json(
        { success: false, error: 'An app with this slug already exists' },
        { status: 409 }
      );
    }

    const newApp = await Apps.create({
      name,
      slug,
      description,
      icon: icon || 'grid',
      targetType,
      route,
      isSystemApp: false,
      isActive: true,
    });

    return NextResponse.json({
      success: true,
      app: newApp,
    });
  } catch (error) {
    console.error('Create app error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred' },
      { status: 500 }
    );
  }
}
