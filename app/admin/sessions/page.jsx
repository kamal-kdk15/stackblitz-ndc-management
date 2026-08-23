'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '../../components/layout.jsx';
import IconActionButton from '../../components/IconActionButton.jsx';

export default function AdminSessionsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetch('/api/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user) {
          if (data.user.role !== 'Admin') {
            router.push('/dashboard');
            return;
          }
          setCurrentUser(data.user);
          fetchSessions();
        } else {
          router.push('/');
        }
      })
      .catch(() => router.push('/'));
  }, []);

  async function fetchSessions() {
    try {
      const res = await fetch('/api/admin/sessions', { cache: 'no-store' });
      const data = await res.json();
      if (data.success) setSessions(data.data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  async function handleRevokeSession(sessionId) {
    if (!confirm('Sign this session out?')) return;
    try {
      const res = await fetch('/api/admin/sessions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId })
      });
      const result = await res.json();
      if (!res.ok) {
        alert(result.message || 'Failed to revoke session');
        return;
      }
      await fetchSessions();
    } catch (e) {
      alert('Failed to revoke session');
    }
  }

  async function handleRevokeAll(userId, userName) {
    if (!confirm(`Sign "${userName}" out of every device/browser?`)) return;
    try {
      const res = await fetch('/api/admin/sessions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, all_sessions: true })
      });
      const result = await res.json();
      if (!res.ok) {
        alert(result.message || 'Failed to revoke sessions');
        return;
      }
      await fetchSessions();
    } catch (e) {
      alert('Failed to revoke sessions');
    }
  }

  function timeAgo(dateStr) {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  function deviceLabel(userAgent) {
    if (!userAgent) return 'Unknown device';
    if (/Mobile|Android|iPhone/i.test(userAgent)) return 'Mobile browser';
    if (/Chrome/i.test(userAgent)) return 'Chrome';
    if (/Firefox/i.test(userAgent)) return 'Firefox';
    if (/Safari/i.test(userAgent)) return 'Safari';
    if (/Edg/i.test(userAgent)) return 'Edge';
    return 'Browser';
  }

  const filtered = sessions.filter(
    (s) =>
      s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group sessions by user for the "sign out everywhere" action
  const userGroups = {};
  filtered.forEach((s) => {
    if (!userGroups[s.user_id]) userGroups[s.user_id] = [];
    userGroups[s.user_id].push(s);
  });

  if (!currentUser) return null;

  return (
    <Layout current="/admin/sessions">
      <div style={s.page}>
        <div style={s.pageHead}>
          <div>
            <h1 style={s.pageTitle}>Active Sessions</h1>
            <p style={s.pageSub}>See who's signed in and force sign-out when needed — Sun Pharma Industries Ltd.</p>
          </div>
        </div>

        <div style={s.card}>
          <div style={s.filterRow}>
            <div style={s.searchWrap}>
              <span style={s.searchIcon}>🔍︎</span>
              <input
                style={s.searchInput}
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div style={s.countBadge}>
              {filtered.length} active session{filtered.length !== 1 ? 's' : ''}
            </div>
          </div>

          {loading ? (
            <div style={s.empty}>
              <div style={s.emptyText}>Loading...</div>
            </div>
          ) : filtered.length === 0 ? (
            <div style={s.empty}>
              <div style={s.emptyIcon}>⚿</div>
              <div style={s.emptyText}>No active sessions</div>
            </div>
          ) : (
            <div>
              {Object.entries(userGroups).map(([userId, userSessions]) => (
                <div key={userId}>
                  <div style={s.groupHead}>
                    <div style={s.avatar}>{userSessions[0].name?.charAt(0) || 'U'}</div>
                    <div style={{ flex: 1 }}>
                      <div style={s.groupName}>{userSessions[0].name}</div>
                      <div style={s.groupMeta}>{userSessions[0].email} · {userSessions[0].role}</div>
                    </div>
                    {userSessions.length > 1 && (
                      <button
                        style={s.signOutAllBtn}
                        onClick={() => handleRevokeAll(userId, userSessions[0].name)}
                      >
                        Sign out everywhere ({userSessions.length})
                      </button>
                    )}
                  </div>

                  {userSessions.map((sess, i) => (
                    <div key={sess.id} style={i % 2 === 0 ? s.rowEven : s.rowOdd}>
                      <div style={s.rowLeft}>
                        <div style={s.sessionIcon}>▭</div>
                        <div>
                          <div style={s.rowName}>{deviceLabel(sess.user_agent)}</div>
                          <div style={s.rowMeta}>
                            {sess.ip_address || 'Unknown IP'} · Last active {timeAgo(sess.last_activity)}
                          </div>
                        </div>
                      </div>
                      <div style={s.rowRight}>
                        <IconActionButton
                          icon="⏻"
                          label="Sign out"
                          color="#991B1B"
                          onClick={() => handleRevokeSession(sess.id)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

const s = {
  page: { padding: '32px' },
  pageHead: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' },
  pageTitle: { fontSize: '24px', fontWeight: '700', color: '#1A1A1A', marginBottom: '4px', letterSpacing: '-0.3px' },
  pageSub: { fontSize: '13px', color: '#999' },
  card: { background: 'white', borderRadius: '12px', border: '1px solid #EDE8E0', overflow: 'hidden' },
  filterRow: { padding: '14px 20px', borderBottom: '1px solid #EDE8E0', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' },
  searchWrap: { flex: 1, minWidth: '200px', display: 'flex', alignItems: 'center', gap: '8px', background: '#FAF8F5', border: '1.5px solid #EDE8E0', borderRadius: '8px', padding: '0 12px' },
  searchIcon: { fontSize: '14px', flexShrink: 0 },
  searchInput: { flex: 1, padding: '9px 0', border: 'none', background: 'transparent', fontSize: '13px', outline: 'none', color: '#1A1A1A' },
  countBadge: { fontSize: '12px', color: '#AAA', whiteSpace: 'nowrap' },
  groupHead: { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 20px', background: '#FAF8F5', borderBottom: '1px solid #EDE8E0', borderTop: '1px solid #EDE8E0' },
  avatar: { width: '32px', height: '32px', borderRadius: '50%', background: '#E8650A', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700', flexShrink: 0 },
  groupName: { fontSize: '13px', fontWeight: '700', color: '#1A1A1A' },
  groupMeta: { fontSize: '11px', color: '#999', marginTop: '1px' },
  signOutAllBtn: { padding: '7px 12px', border: '1.5px solid #F0997B', borderRadius: '7px', fontSize: '12px', fontWeight: '600', background: 'transparent', color: '#C4520A', cursor: 'pointer', whiteSpace: 'nowrap' },
  rowEven: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px 12px 52px', borderBottom: '1px solid #F5F2ED', background: 'white' },
  rowOdd: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px 12px 52px', borderBottom: '1px solid #F5F2ED', background: '#FDFCFA' },
  rowLeft: { display: 'flex', gap: '10px', alignItems: 'center' },
  sessionIcon: { width: '28px', height: '28px', background: '#F5F3EF', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', flexShrink: 0 },
  rowName: { fontSize: '13px', fontWeight: '600', color: '#1A1A1A' },
  rowMeta: { fontSize: '11px', color: '#999', marginTop: '2px' },
  rowRight: { display: 'flex', gap: '8px', alignItems: 'center' },
  empty: { padding: '60px 24px', textAlign: 'center' },
  emptyIcon: { fontSize: '32px', marginBottom: '12px' },
  emptyText: { fontSize: '14px', fontWeight: '600', color: '#1A1A1A' },
};