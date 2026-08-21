import crypto from 'crypto';
import { cookies } from 'next/headers';
import pkg from 'pg';

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const SESSION_COOKIE = 'ndc_session';
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 hours

export function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

export function hashSessionToken(token) {
  return crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
}



// Create a new session for a user
export async function createSession(userId, request) {
  const token = generateSessionToken();
  const tokenHash = hashSessionToken(token);

  const expiresAt = new Date(
    Date.now() + SESSION_DURATION_MS
  );

  const userAgent =
    request.headers.get('user-agent') || null;

  const forwardedFor =
    request.headers.get('x-forwarded-for');

  const ipAddress =
    forwardedFor?.split(',')[0]?.trim() || null;


  await pool.query(`
    INSERT INTO sessions
    (
      user_id,
      token_hash,
      created_at,
      last_activity,
      expires_at,
      user_agent,
      ip_address
    )
    VALUES ($1, $2, NOW(), NOW(), $3, $4, $5)
  `, [
    userId,
    tokenHash,
    expiresAt,
    userAgent,
    ipAddress
  ]);

  return {
    success: true,
    token,
    expiresAt
  };
}


// SET COOKIE
export function setSessionCookie(token, expiresAt) {

  cookies().set({
    name: SESSION_COOKIE,
    value: token,

    httpOnly: true,

    secure: process.env.NODE_ENV === 'production',

    sameSite: 'lax',

    path: '/',

    expires: expiresAt
  });

}


// GET COOKIE

export function getSessionToken() {

  return cookies().get(SESSION_COOKIE)?.value || null;

}



// GET CURRENT USER

export async function getCurrentUser() {

  const token = getSessionToken();

  if (!token) {
    return null;
  }

  const tokenHash = hashSessionToken(token);


  const result = await pool.query(`
    SELECT
      u.id,
      u.name,
      u.email,
      u.role,
      u.is_active,

      s.id AS session_id,
      s.expires_at

    FROM sessions s

    INNER JOIN users u
      ON u.id = s.user_id

    WHERE s.token_hash = $1

      AND s.revoked_at IS NULL

      AND s.expires_at > NOW()

      AND COALESCE(u.is_active, true) = true

    LIMIT 1

  `, [tokenHash]);


  if (result.rows.length === 0) {

    // Cookie exists but session is invalid/expired.
    // Remove stale cookie.

    cookies().delete(SESSION_COOKIE);

    return null;
  }


  const session = result.rows[0];


  // Update activity

  await pool.query(`
    UPDATE sessions
    SET last_activity = NOW()
    WHERE id = $1
  `, [
    session.session_id
  ]);


  return {

    id: session.id,

    name: session.name,

    email: session.email,

    role: session.role

  };

}



// DESTROY CURRENT SESSION

export async function destroyCurrentSession() {

  const token = getSessionToken();

  if (!token) {
    return;
  }

  const tokenHash = hashSessionToken(token);


  await pool.query(`
    UPDATE sessions
    SET revoked_at = NOW()
    WHERE token_hash = $1
      AND revoked_at IS NULL
  `, [
    tokenHash
  ]);


  cookies().delete(SESSION_COOKIE);

}


// ============================================
// DESTROY ALL USER SESSIONS
// ============================================
export async function destroyAllUserSessions(userId) {

  await pool.query(`
    UPDATE sessions
    SET revoked_at = NOW()
    WHERE user_id = $1
      AND revoked_at IS NULL
  `, [
    userId
  ]);

}