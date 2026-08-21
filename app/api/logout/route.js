import { NextResponse } from 'next/server';
import { destroyCurrentSession } from '../../lib/auth';
import { logAudit } from '../../lib/audit';

export async function POST(request) {
  try {
    const { name } = await request.json().catch(() => ({}));

    await destroyCurrentSession();   // revokes session row + clears cookie

    await logAudit(
      'LOGOUT',
      name || '-',
      '-',
      '-',
      '-'
    );

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to logout'
      },
      { status: 500 }
    );
  }
}