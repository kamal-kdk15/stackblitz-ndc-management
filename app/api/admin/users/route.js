import { NextResponse } from 'next/server';
import { readData, writeData } from '../../../lib/jsonDB';
import { logAudit } from '../../../lib/audit';
import { getCurrentUser } from '../../../lib/auth';

export const dynamic = 'force-dynamic';

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'Admin') return null;
  return user;
}

// GET all users
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json(
      { success: false, message: 'Admin access required' },
      { status: 403 }
    );
  }

  try {
    const users = await readData('users.json');
    // Never send password hashes/plaintext to the client
    const safeUsers = users.map(({ password, ...rest }) => rest);

    return NextResponse.json({ success: true, data: safeUsers });
  } catch (error) {
    console.error('Admin Users GET Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// CREATE user
export async function POST(request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json(
      { success: false, message: 'Admin access required' },
      { status: 403 }
    );
  }

  try {
    const { name, email, password, role } = await request.json();

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { success: false, message: 'Name, email, password and role are all required' },
        { status: 400 }
      );
    }

    if (!['Admin', 'SPOC', 'Viewer'].includes(role)) {
      return NextResponse.json(
        { success: false, message: 'Invalid role' },
        { status: 400 }
      );
    }

    const users = await readData('users.json');
    if (users.some((u) => u.email === email)) {
      return NextResponse.json(
        { success: false, message: `A user with email ${email} already exists` },
        { status: 409 }
      );
    }

    const newUser = await writeData('users.json', {
      name,
      email,
      password,
      role,
      is_active: true
    });

    await logAudit('USER_CREATED', admin.name, email, '-', role);

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: newUser
    });

  } catch (error) {
    console.error('Admin Users POST Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create user' },
      { status: 500 }
    );
  }
}

// UPDATE user (name, email, role, active status)
export async function PATCH(request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json(
      { success: false, message: 'Admin access required' },
      { status: 403 }
    );
  }

  try {
    const { id, name, email, role, is_active } = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      );
    }

    if (role && !['Admin', 'SPOC', 'Viewer'].includes(role)) {
      return NextResponse.json(
        { success: false, message: 'Invalid role' },
        { status: 400 }
      );
    }

    // Prevent an admin from locking themselves out
    if (String(id) === String(admin.id) && is_active === false) {
      return NextResponse.json(
        { success: false, message: 'You cannot deactivate your own account' },
        { status: 400 }
      );
    }

    if (String(id) === String(admin.id) && role && role !== 'Admin') {
      return NextResponse.json(
        { success: false, message: 'You cannot change your own role' },
        { status: 400 }
      );
    }

    const updated = await writeData('users.json', {
      _update: true,
      id,
      name,
      email,
      role,
      is_active
    });

    await logAudit(
      'USER_UPDATED',
      admin.name,
      String(id),
      '-',
      JSON.stringify({ name, email, role, is_active })
    );

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      user: updated
    });

  } catch (error) {
    console.error('Admin Users PATCH Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// DELETE user
export async function DELETE(request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json(
      { success: false, message: 'Admin access required' },
      { status: 403 }
    );
  }

  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      );
    }

    if (String(id) === String(admin.id)) {
      return NextResponse.json(
        { success: false, message: 'You cannot delete your own account' },
        { status: 400 }
      );
    }

    await writeData('users.json', { _delete: true, id });

    await logAudit('USER_DELETED', admin.name, String(id), '-', '-');

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Admin Users DELETE Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete user' },
      { status: 500 }
    );
  }
}