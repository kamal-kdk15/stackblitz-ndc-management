'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '../components/layout.jsx';

const adminSections = [
  {
    href: '/admin/users',
    icon: '♙',
    title: 'User Management',
    description: 'Create, edit, deactivate, and delete system accounts.',
  },
  {
    href: '/admin/sessions',
    icon: '⚿',
    title: 'Active Sessions',
    description: 'See who is signed in and force sign-out when needed.',
  },
  {
    href: '/admin/config',
    icon: '⚙',
    title: 'System Config',
    description: 'Labeler code and product code range for NDC generation.',
  },
];

export default function AdminHubPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    admins: 0,
    activeSessions: 0,
  });

  useEffect(() => {
    fetch('/api/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user) {
          if (data.user.role !== 'Admin') {
            router.push('/dashboard');
            return;
          }
          setUser(data.user);
          fetchStats();
        } else {
          router.push('/');
        }
      })
      .catch(() => router.push('/'));
  }, []);

  async function fetchStats() {
    try {
      const [usersRes, sessionsRes] = await Promise.all([
        fetch('/api/admin/users', { cache: 'no-store' }),
        fetch('/api/admin/sessions', { cache: 'no-store' }),
      ]);
      const usersData = await usersRes.json();
      const sessionsData = await sessionsRes.json();

      const users = usersData.success ? usersData.data : [];
      const sessions = sessionsData.success ? sessionsData.data : [];

      setStats({
        totalUsers: users.length,
        activeUsers: users.filter((u) => u.isActive).length,
        admins: users.filter((u) => u.role === 'Admin').length,
        activeSessions: sessions.length,
      });
    } catch (e) {
      console.error(e);
    }
  }

  if (!user) return null;

  return (
    <Layout current="/admin">
      <div style={s.page}>
        <div style={s.pageHead}>
          <div>
            <h1 style={s.pageTitle}>Admin</h1>
            <p style={s.pageSub}>Manage users, sessions, and system settings — Sun Pharma Industries Ltd.</p>
          </div>
        </div>

        <div style={s.statsRow}>
          <div style={s.statCard}>
            <div style={s.statNum}>{stats.totalUsers}</div>
            <div style={s.statLabel}>Total Users</div>
          </div>
          <div style={s.statCard}>
            <div style={{ ...s.statNum, color: '#2D6A4F' }}>{stats.activeUsers}</div>
            <div style={s.statLabel}>Active Users</div>
          </div>
          <div style={s.statCard}>
            <div style={{ ...s.statNum, color: '#C4520A' }}>{stats.admins}</div>
            <div style={s.statLabel}>Admins</div>
          </div>
          <div style={s.statCard}>
            <div style={s.statNum}>{stats.activeSessions}</div>
            <div style={s.statLabel}>Active Sessions</div>
          </div>
        </div>

        <div style={s.sectionLabel}>Manage</div>

        <div style={s.grid}>
          {adminSections.map((section) => (
            <div
              key={section.href}
              style={s.card}
              onClick={() => router.push(section.href)}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#E8650A')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#EDE8E0')}
            >
              <div style={s.cardIcon}>{section.icon}</div>
              <div style={s.cardTitle}>{section.title}</div>
              <div style={s.cardDesc}>{section.description}</div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}

const s = {
  page: { padding: '32px' },
  pageHead: { marginBottom: '24px' },
  pageTitle: { fontSize: '24px', fontWeight: '700', color: '#1A1A1A', marginBottom: '4px', letterSpacing: '-0.3px' },
  pageSub: { fontSize: '13px', color: '#999' },

  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '28px' },
  statCard: { background: 'white', borderRadius: '10px', padding: '18px', border: '1px solid #EDE8E0' },
  statNum: { fontSize: '26px', fontWeight: '800', color: '#1A1A1A', lineHeight: '1', marginBottom: '6px' },
  statLabel: { fontSize: '12px', fontWeight: '600', color: '#999' },

  sectionLabel: { fontSize: '11px', fontWeight: '700', color: '#AAA', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '12px' },

  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' },
  card: {
    background: 'white',
    border: '1px solid #EDE8E0',
    borderRadius: '12px',
    padding: '22px',
    cursor: 'pointer',
    transition: 'border-color 0.15s ease',
  },
  cardIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '9px',
    background: '#FFF0E6',
    color: '#C4520A',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    marginBottom: '14px',
  },
  cardTitle: { fontSize: '15px', fontWeight: '700', color: '#1A1A1A', marginBottom: '6px' },
  cardDesc: { fontSize: '12px', color: '#999', lineHeight: '1.5' },
};