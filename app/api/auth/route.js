import { NextResponse } from 'next/server';
import { readData, writeData } from '../../lib/jsonDB';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body || {};

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }

    const users = await readData('users.json');
    const user = users.find(
      (u) => u.email === email && u.password === password
    );

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const isActive = user.isActive ?? user.is_active ?? true;
    if (!isActive) {
      return NextResponse.json(
        { success: false, message: 'Account is deactivated' },
        { status: 403 }
      );
    }

    const audit = await readData('audit.json');
    audit.unshift({
      id: audit.length + 1,
      action: 'LOGIN',
      performedBy: user.name,
      recordId: '-',
      oldValue: '-',
      newValue: '-',
      timestamp: new Date().toLocaleString(),
    });
    await writeData('audit.json', audit);

    return NextResponse.json({
      success: true,
      message: `Welcome ${user.name}!`,
      user: { id: user.id, name: user.name, role: user.role },
    });
  } catch (error) {
    console.error('Auth API error:', error);
    return NextResponse.json(
      { success: false, message: 'Unable to sign in. Please try again later.' },
      { status: 500 }
    );
  }
}