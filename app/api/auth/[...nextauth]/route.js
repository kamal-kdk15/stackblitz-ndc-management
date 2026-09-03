import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { headers } from 'next/headers';
import { readData } from '../../../lib/jsonDB';
import { createSession, setSessionCookie } from '../../../lib/auth';
import { logAudit } from '../../../lib/audit';

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],

  secret: process.env.NEXTAUTH_SECRET,

  callbacks: {
    async signIn({ user }) {
      const email = user.email;
      if (!email) return false;

      const users = await readData('users.json');
      const existingUser = users.find(
        (u) => u.email?.toLowerCase() === email.toLowerCase()
      );

      // Only pre-provisioned accounts (created in Admin > Users) can sign in
      if (!existingUser) {
        return '/?error=NoAccount';
      }

      const isActive = existingUser.isActive ?? true;
      if (!isActive) {
        return '/?error=Deactivated';
      }

      // Bridge into our own cookie-based session system —
      // everything downstream (getCurrentUser, admin panel) stays unchanged
      const hdrs = headers();
      const fakeRequest = { headers: hdrs };

      const session = await createSession(existingUser.id, fakeRequest);

      if (!session.success) {
        return '/?error=SessionFailed';
      }

      setSessionCookie(session.token, session.expiresAt);

      await logAudit('LOGIN', existingUser.name, '-', '-', 'Google SSO');

      return true;
    },
  },

  pages: {
    signIn: '/',
  },
});

export { handler as GET, handler as POST };