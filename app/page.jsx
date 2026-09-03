'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const ssoError = searchParams.get('error');
    if (ssoError === 'NoAccount') {
      setError('No account found for this Google email. Contact your administrator.');
    } else if (ssoError === 'Deactivated') {
      setError('This account has been deactivated.');
    } else if (ssoError) {
      setError('Unable to sign in with Google. Please try again.');
    }
  }, [searchParams]);

  useEffect(() => {
    fetch('/api/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user) {
          router.push('/dashboard');
        } else {
          setCheckingSession(false);
        }
      })
      .catch(() => setCheckingSession(false));
  }, []);

  if (checkingSession) return null;

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const contentType = res.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json');
      const data = isJson ? await res.json() : { success: false, message: 'Unable to sign in. Please try again.' };

      if (!res.ok || !data.success) {
        setError(data.message || 'Unable to sign in. Please try again.');
        return;
      }

      window.location.href = '/dashboard';
    } catch (err) {
      setError(err.message || 'Unable to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={s.page}>
      {/* left... */}
      <div style={s.left}>
        <div style={s.leftInner}>
          <div style={s.logo}>
            <img
              src="/sunpharma.png"
              alt="Sun Pharma"
              style={{
                height: '60px',
                objectFit: 'contain',
              }}
            />
          </div>
          <h1 style={s.heading}>NDC Management System</h1>
          <p style={s.desc}>
            Internal tool for National Drug Code generation, registry
            management, and change scenario tracking.
          </p>
          <div style={s.divider} />
          <div style={s.tagRow}>
            <span style={s.tag}>Sun Pharma Industries Ltd.</span>
            <span style={s.dot}>·</span>
            <span style={s.tag}>Pharma IT</span>
          </div>
          {/* <div style={s.badges}>
            <div style={s.badge}>GxP Compliant</div>
            <div style={s.badge}>21 CFR Part 11</div>
            <div style={s.badge}>UAT v1.0</div>
          </div> */}
        </div>
      </div>

      {/* right.. */}
      <div style={s.right}>
        <div style={s.formBox}>
          <div style={s.formTop}>
            <h2 style={s.formTitle}>Sign in</h2>
            <p style={s.formSub}>Enter your credentials to access the system</p>
          </div>

          <form onSubmit={handleLogin} style={s.form}>
            <div style={s.group}>
              <label style={s.label}>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@sunpharma.com"
                required
                style={s.input}
              />
            </div>

            <div style={s.group}>
              <label style={s.label}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                style={s.input}
              />
            </div>

            {error && <div style={s.errorBox}>{error}</div>}

            <button type="submit" disabled={loading} style={s.btn}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div style={s.divider2}>
            <span style={s.dividerLine} />
            <span style={s.dividerText}>OR</span>
            <span style={s.dividerLine} />
          </div>

          <button
            type="button"
            style={s.googleBtn}
            onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
          >
            Sign in with Google
          </button>

          <p style={s.hint}>Contact your administrator if you need access.</p>
        </div>
      </div>
    </div>
  );
}

const s = {
  page: {
    display: 'flex',
    minHeight: '100vh',
    fontFamily: 'Segoe UI, system-ui, sans-serif',
    background: '#F7F5F1',
  },
  left: {
    width: '50%',
    background: '#1A1A1A',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 48px',
  },
  leftInner: {
    maxWidth: '380px',
  },
  logo: {
    width: '65px',
    height: '65px',
    background: '#E8650A',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '32px',
  },
  logoText: {
    color: 'white',
    fontWeight: '800',
    fontSize: '16px',
    letterSpacing: '0.5px',
  },
  heading: {
    fontSize: '28px',
    fontWeight: '700',
    color: 'white',
    lineHeight: '1.25',
    marginBottom: '14px',
    letterSpacing: '-0.3px',
  },
  desc: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.45)',
    lineHeight: '1.75',
    marginBottom: '32px',
  },
  divider: {
    width: '40px',
    height: '2px',
    background: '#E8650A',
    marginBottom: '28px',
    borderRadius: '2px',
  },
  tagRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '20px',
  },
  tag: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.4)',
  },
  dot: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: '12px',
  },
  badges: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  badge: {
    padding: '5px 12px',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '4px',
    fontSize: '11px',
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '500',
  },
  right: {
    width: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 40px',
    background: 'linear-gradient(135deg, #F7F5F1 0%, #FFF0E6 100%)',
  },
  formBox: {
    width: '100%',
    maxWidth: '400px',
    background: 'rgba(255,255,255,0.6)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRadius: '16px',
    padding: '40px',
    border: '1.5px solid rgba(232,101,10,0.25)',
    boxShadow: '0 8px 32px rgba(232,101,10,0.08)',
  },
  formTop: {
    marginBottom: '32px',
  },
  formTitle: {
    fontSize: '26px',
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: '8px',
    letterSpacing: '-0.2px',
  },
  formSub: {
    fontSize: '13px',
    color: '#888',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  group: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#444',
    letterSpacing: '0.2px',
  },
  input: {
    padding: '13px 14px',
    border: '1.5px solid #E2DDD6',
    borderRadius: '8px',
    fontSize: '14px',
    background: 'white',
    outline: 'none',
    color: '#1A1A1A',
    width: '100%',
  },
  errorBox: {
    padding: '11px 14px',
    background: '#FEF2F2',
    border: '1px solid #FECACA',
    borderRadius: '7px',
    color: '#991B1B',
    fontSize: '13px',
  },
  btn: {
    padding: '14px',
    background: '#E8650A',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '4px',
  },

  hint: {
    textAlign: 'center',
    fontSize: '12px',
    color: '#AAA',
    marginTop: '24px',
  },
  divider2: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    margin: '20px 0',
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    background: '#E2DCD2',
  },
  dividerText: {
    fontSize: '11px',
    color: '#AAA',
    fontWeight: '600',
  },
  googleBtn: {
    width: '100%',
    padding: '13px',
    background: 'white',
    color: '#444',
    border: '1.5px solid #E2DCD2',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
};