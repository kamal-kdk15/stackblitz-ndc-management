import { NextResponse } from 'next/server';
import { readData } from '../../lib/jsonDB';
import { logAudit } from '../../lib/audit';
import {
  createSession,
  setSessionCookie
} from '../../lib/auth';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body || {};

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: 'Email and password are required'
        },
        { status: 400 }
      );
    }

    const users = await readData('users.json');

    const user = users.find(
      (u) =>
        u.email === email &&
        u.password === password
    );

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid email or password'
        },
        { status: 401 }
      );
    }

    const isActive =
      user.isActive ??
      user.is_active ??
      true;

    if (!isActive) {
      return NextResponse.json(
        {
          success: false,
          message: 'Account is deactivated'
        },
        { status: 403 }
      );
    }

    // Check/create database session
    const session = await createSession(
      user.id,
      request
    );

    // Another browser/device already has an active session
    // if (session.alreadyLoggedIn) {
    //   return NextResponse.json(
    //     {
    //       success: false,
    //       alreadyLoggedIn: true,
    //       message: 'This account is already logged in.'
    //     },
    //     { status: 409 }
    //   );
    // }

    if (!session.success) {
      throw new Error('Failed to create session');
    }

    // Store session token in HttpOnly cookie
    setSessionCookie(
      session.token,
      session.expiresAt
    );

    await logAudit(
      'LOGIN',
      user.name,
      '-',
      '-',
      '-'
    );

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
      {
        success: false,
        message: 'Unable to sign in. Please try again later.'
      },
      { status: 500 }
    );
  }
}