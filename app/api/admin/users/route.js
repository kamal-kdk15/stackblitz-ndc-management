import { NextResponse } from 'next/server';
import { readData, writeData } from '../../../lib/jsonDB';
import { logAudit } from '../../../lib/audit';
import { getCurrentUser } from '../../../lib/auth';
import { notifyUserCreated } from '../../../lib/notify';
import bcrypt from 'bcryptjs';


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
const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await writeData('users.json', {
      name,
      email,
       password: hashedPassword,
      role,
      is_active: true
    });

await logAudit('USER_CREATED', admin.name, email, '-', JSON.stringify({ name, email, role }));

await notifyUserCreated({ name, email, role, createdBy: admin.name });

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

    // Fetch the existing record so the audit log captures real before/after values
    const users = await readData('users.json');
    const existingUser = users.find((u) => String(u.id) === String(id));

    if (!existingUser) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
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
      JSON.stringify({
        name: existingUser.name,
        email: existingUser.email,
        role: existingUser.role,
        is_active: existingUser.isActive
      }),
      JSON.stringify({
        name: name ?? existingUser.name,
        email: email ?? existingUser.email,
        role: role ?? existingUser.role,
        is_active: is_active ?? existingUser.isActive
      })
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

    const users = await readData('users.json');
    const existingUser = users.find((u) => String(u.id) === String(id));

    if (!existingUser) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    await writeData('users.json', { _delete: true, id });

    await logAudit(
      'USER_DELETED',
      admin.name,
      String(id),
      JSON.stringify({
        name: existingUser.name,
        email: existingUser.email,
        role: existingUser.role
      }),
      'Deleted'
    );

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