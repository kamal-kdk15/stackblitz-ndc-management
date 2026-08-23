import { NextResponse } from 'next/server';
import pkg from 'pg';
import { getCurrentUser } from '../../../lib/auth';
import { logAudit } from '../../../lib/audit';

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export const dynamic = 'force-dynamic';

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'Admin') return null;
  return user;
}

// GET all active sessions, with owning user's info
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json(
      { success: false, message: 'Admin access required' },
      { status: 403 }
    );
  }

  try {
    const result = await pool.query(`
      SELECT
        s.id,
        s.user_id,
        u.name,
        u.email,
        u.role,
        s.created_at,
        s.last_activity,
        s.expires_at,
        s.user_agent,
        s.ip_address
      FROM sessions s
      INNER JOIN users u ON u.id = s.user_id
      WHERE s.revoked_at IS NULL
        AND s.expires_at > NOW()
      ORDER BY s.last_activity DESC
    `);

    return NextResponse.json({ success: true, data: result.rows });

  } catch (error) {
    console.error('Admin Sessions GET Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}

// Revoke a single session, or every session belonging to a user
export async function DELETE(request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json(
      { success: false, message: 'Admin access required' },
      { status: 403 }
    );
  }

  try {
    const { session_id, user_id, all_sessions } = await request.json();

    if (all_sessions) {
      if (!user_id) {
        return NextResponse.json(
          { success: false, message: 'User ID is required' },
          { status: 400 }
        );
      }

      await pool.query(`
        UPDATE sessions
        SET revoked_at = NOW()
        WHERE user_id = $1
          AND revoked_at IS NULL
      `, [user_id]);

      await logAudit(
        'ALL_SESSIONS_REVOKED',
        admin.name,
        String(user_id),
        '-',
        'All sessions revoked by admin'
      );

      return NextResponse.json({
        success: true,
        message: 'All sessions for this user have been signed out'
      });
    }

    if (!session_id) {
      return NextResponse.json(
        { success: false, message: 'Session ID is required' },
        { status: 400 }
      );
    }

    await pool.query(`
      UPDATE sessions
      SET revoked_at = NOW()
      WHERE id = $1
        AND revoked_at IS NULL
    `, [session_id]);

    await logAudit(
      'SESSION_REVOKED',
      admin.name,
      String(session_id),
      '-',
      'Session revoked by admin'
    );

    return NextResponse.json({
      success: true,
      message: 'Session signed out successfully'
    });

  } catch (error) {
    console.error('Admin Sessions DELETE Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to revoke session' },
      { status: 500 }
    );
  }
}