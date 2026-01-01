import { NextRequest, NextResponse } from 'next/server';
import { hashPassword } from '@/lib/auth';
import { Users, seedDefaultData } from '@/lib/database';

// This endpoint creates sample users for testing
export async function POST(request: NextRequest) {
  try {
    // First, seed default apps
    await seedDefaultData();

    const passwordHash = await hashPassword('password123');
    const createdUsers: any[] = [];

    // Check and create Super Admin
    const existingSuperAdmin = await Users.getByPhone('+2348012345678');
    if (!existingSuperAdmin) {
      const superAdmin = await Users.create({
        firstName: 'Super',
        lastName: 'Admin',
        phone: '+2348012345678',
        email: 'superadmin@lorettosch.com.ng',
        passwordHash,
        role: 'super_admin',
        isActive: true,
      });
      createdUsers.push({ role: 'super_admin', phone: '+2348012345678', name: 'Super Admin' });
    }

    // Check and create Admin (Teacher)
    const existingTeacher = await Users.getByPhone('+2348011111111');
    if (!existingTeacher) {
      await Users.create({
        firstName: 'John',
        lastName: 'Teacher',
        phone: '+2348011111111',
        email: 'teacher@lorettosch.com.ng',
        passwordHash,
        role: 'admin',
        adminType: 'teacher',
        department: 'Mathematics',
        assignedClasses: ['jss_1', 'jss_2', 'jss_3'],
        isActive: true,
      } as any);
      createdUsers.push({ role: 'admin (teacher)', phone: '+2348011111111', name: 'John Teacher' });
    }

    // Check and create Admin (Accountant)
    const existingAccountant = await Users.getByPhone('+2348022222222');
    if (!existingAccountant) {
      await Users.create({
        firstName: 'Mary',
        lastName: 'Accountant',
        phone: '+2348022222222',
        email: 'accountant@lorettosch.com.ng',
        passwordHash,
        role: 'admin',
        adminType: 'accountant',
        department: 'Finance',
        isActive: true,
      } as any);
      createdUsers.push({ role: 'admin (accountant)', phone: '+2348022222222', name: 'Mary Accountant' });
    }

    // Check and create Student 1 (JSS1)
    const existingStudent1 = await Users.getByPhone('+2348033333333');
    let student1Id = existingStudent1?.id;
    if (!existingStudent1) {
      const student1 = await Users.create({
        firstName: 'David',
        lastName: 'Student',
        phone: '+2348033333333',
        email: 'david@student.lorettosch.com.ng',
        passwordHash,
        role: 'student',
        classLevel: 'jss_1',
        studentId: 'LOR-2024-001',
        dateOfBirth: '2012-05-15',
        enrollmentDate: new Date().toISOString(),
        parentIds: [],
        isActive: true,
      } as any);
      student1Id = student1.id;
      createdUsers.push({ role: 'student (JSS1)', phone: '+2348033333333', name: 'David Student', studentId: 'LOR-2024-001' });
    }

    // Check and create Student 2 (Grade 3)
    const existingStudent2 = await Users.getByPhone('+2348044444444');
    let student2Id = existingStudent2?.id;
    if (!existingStudent2) {
      const student2 = await Users.create({
        firstName: 'Sarah',
        lastName: 'Student',
        phone: '+2348044444444',
        email: 'sarah@student.lorettosch.com.ng',
        passwordHash,
        role: 'student',
        classLevel: 'grade_3',
        studentId: 'LOR-2024-002',
        dateOfBirth: '2015-08-20',
        enrollmentDate: new Date().toISOString(),
        parentIds: [],
        isActive: true,
      } as any);
      student2Id = student2.id;
      createdUsers.push({ role: 'student (Grade 3)', phone: '+2348044444444', name: 'Sarah Student', studentId: 'LOR-2024-002' });
    }

    // Check and create Parent (linked to both students)
    const existingParent = await Users.getByPhone('+2348055555555');
    if (!existingParent) {
      const childrenIds = [student1Id, student2Id].filter(Boolean) as string[];

      const parent = await Users.create({
        firstName: 'Peter',
        lastName: 'Parent',
        phone: '+2348055555555',
        email: 'parent@lorettosch.com.ng',
        passwordHash,
        role: 'parent',
        occupation: 'Business Owner',
        address: '25 Wali Street, Port Harcourt',
        childrenIds,
        isActive: true,
      } as any);

      // Update students to link to parent
      for (const childId of childrenIds) {
        const child = await Users.getById(childId);
        if (child) {
          await Users.update(childId, {
            parentIds: [...((child as any).parentIds || []), parent.id],
          });
        }
      }

      createdUsers.push({ role: 'parent', phone: '+2348055555555', name: 'Peter Parent', children: ['David', 'Sarah'] });
    }

    if (createdUsers.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All sample users already exist!',
        credentials: {
          password: 'password123',
          users: [
            { role: 'Super Admin', phone: '+2348012345678' },
            { role: 'Admin (Teacher)', phone: '+2348011111111' },
            { role: 'Admin (Accountant)', phone: '+2348022222222' },
            { role: 'Student (JSS1)', phone: '+2348033333333' },
            { role: 'Student (Grade 3)', phone: '+2348044444444' },
            { role: 'Parent', phone: '+2348055555555' },
          ],
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Created ${createdUsers.length} sample users!`,
      created: createdUsers,
      credentials: {
        password: 'password123 (same for all users)',
        note: 'Change passwords after testing!',
      },
    });
  } catch (error) {
    console.error('Seed demo error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred during seeding' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'POST to this endpoint to create sample users for all roles',
    willCreate: [
      { role: 'Super Admin', phone: '+2348012345678' },
      { role: 'Admin (Teacher)', phone: '+2348011111111' },
      { role: 'Admin (Accountant)', phone: '+2348022222222' },
      { role: 'Student (JSS1)', phone: '+2348033333333' },
      { role: 'Student (Grade 3)', phone: '+2348044444444' },
      { role: 'Parent (2 children)', phone: '+2348055555555' },
    ],
    password: 'password123',
  });
}
