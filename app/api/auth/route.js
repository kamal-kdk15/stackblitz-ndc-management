import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { readData } from '../../lib/jsonDB';
import { logAudit } from '../../lib/audit';
import {
  createSession,
  setSessionCookie,
  countRecentLoginFailures
} from '../../lib/auth';

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

    // Rate limit: block after 5 failed attempts for this email in the last 15 minutes
    const recentFailures = await countRecentLoginFailures(email, 15);
    if (recentFailures >= 5) {
      return NextResponse.json(
        { success: false, message: 'Too many failed attempts. Please try again in 15 minutes.' },
        { status: 429 }
      );
    }

    const users = await readData('users.json');
    const user = users.find((u) => u.email === email);

    // Generic message either way — don't reveal whether the email exists
    if (!user) {
      await logAudit('LOGIN_FAILED', email, email, '-', 'Unknown email');
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
await logAudit('LOGIN_FAILED', user.name || email, email, '-', 'Incorrect password');
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

    const session = await createSession(user.id, request);

    if (!session.success) {
      throw new Error('Failed to create session');
    }

    setSessionCookie(session.token, session.expiresAt);

    await logAudit('LOGIN', user.name, '-', '-', '-');

    return NextResponse.json({
      success: true,
      message: `Welcome ${user.name}!`,
      user: {
        id: user.id,
        name: user.name,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Auth API error:', error);
    return NextResponse.json(
      { success: false, message: 'Unable to sign in. Please try again later.' },
      { status: 500 }
    );
  }
}