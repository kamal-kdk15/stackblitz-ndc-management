'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '../components/layout.jsx';

export default function AuditPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) router.push('/');
    else {
      setUser(JSON.parse(stored));
      fetchAudit();
    }
  }, []);

  async function fetchAudit() {
    try {
      const res = await fetch('/api/audit', { cache: 'no-store' });
      const data = await res.json();
      if (data.success) setLogs(data.data);
    } catch (e) {
      console.log(e);
    }
    setLoading(false);
  }

  const filtered = logs.filter((l) => {
    const matchSearch =
      l.performedBy?.toLowerCase().includes(search.toLowerCase()) ||
      l.recordId?.toLowerCase().includes(search.toLowerCase()) ||
      l.action?.toLowerCase().includes(search.toLowerCase());
    const matchAction = filterAction ? l.action === filterAction : true;
    return matchSearch && matchAction;
  });

  const actionColors = {
    LOGIN: { bg: '#F0F7F4', color: '#2D6A4F' },
    LOGOUT: { bg: '#F5F3EF', color: '#666' },
    NDC_CREATED: { bg: '#FFF0E6', color: '#C4520A' },
    STATUS_CHANGED: { bg: '#FFFBEB', color: '#92400E' },
    CHANGE_REQUESTED: { bg: '#FEF2F2', color: '#991B1B' },
    CHANGE_REVIEWED: { bg: '#F0F4FF', color: '#3730A3' },
  };

  const uniqueActions = [...new Set(logs.map((l) => l.action))];

  if (!user) return null;

  return (
    <Layout current="/audit">
      <div style={s.page}>
        <div style={s.pageHead}>
          <div>
            <h1 style={s.pageTitle}>Audit Trail</h1>
            <p style={s.pageSub}>
              Complete log of all system actions — 21 CFR Part 11 compliant.
            </p>
          </div>
          <button style={s.refreshBtn} onClick={fetchAudit}>
            ↻ Refresh
          </button>
        </div>

        {/* stats... */}
        <div style={s.statsRow}>
          <div style={s.statCard}>
            <div style={s.statNum}>{logs.length}</div>
            <div style={s.statLabel}>Total Actions</div>
          </div>
          <div style={s.statCard}>
            <div style={{ ...s.statNum, color: '#C4520A' }}>
              {logs.filter((l) => l.action === 'NDC_CREATED').length}
            </div>
            <div style={s.statLabel}>NDCs Created</div>
          </div>
          <div style={s.statCard}>
            <div style={{ ...s.statNum, color: '#2D6A4F' }}>
              {logs.filter((l) => l.action === 'LOGIN').length}
            </div>
            <div style={s.statLabel}>Logins</div>
          </div>
          <div style={s.statCard}>
            <div style={{ ...s.statNum, color: '#92400E' }}>
              {logs.filter((l) => l.action === 'CHANGE_REQUESTED').length}
            </div>
            <div style={s.statLabel}>Change Requests</div>
          </div>
        </div>

        <div style={s.card}>
          <div style={s.cardHead}>
            <span style={s.cardTitle}>System Activity Log</span>
            <span style={s.countBadge}>{filtered.length} entries</span>
          </div>

          {/* filters.. */}
          <div style={s.filterRow}>
            <div style={s.searchWrap}>
              <input
                style={s.searchInput}
                placeholder="Search by user, action, record ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              style={s.filterSelect}
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
            >
              <option value="">All Actions</option>
              {uniqueActions.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
            {(search || filterAction) && (
              <button
                style={s.clearBtn}
                onClick={() => {
                  setSearch('');
                  setFilterAction('');
                }}
              >
                Clear
              </button>
            )}
          </div>

          {loading ? (
            <div style={s.empty}>
              <div style={s.emptyText}>Loading...</div>
            </div>
          ) : filtered.length === 0 ? (
            <div style={s.empty}>
              <div style={s.emptyIcon}>◎</div>
              <div style={s.emptyTitle}>No audit logs yet</div>
              <div style={s.emptySub}>
                Actions will appear here as users interact with the system
              </div>
            </div>
          ) : (
            <div style={s.tableWrap}>
              <table style={s.table}>
                <thead>
                  <tr style={s.thead}>
                    <th style={s.th}>#</th>
                    <th style={s.th}>Action</th>
                    <th style={s.th}>Performed By</th>
                    <th style={s.th}>Record</th>
                    <th style={s.th}>Old Value</th>
                    <th style={s.th}>New Value</th>
                    <th style={s.th}>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((l, i) => {
                    const color = actionColors[l.action] || {
                      bg: '#F5F3EF',
                      color: '#666',
                    };
                    return (
                      <tr key={i} style={i % 2 === 0 ? s.trEven : s.trOdd}>
                        <td
                          style={{ ...s.td, color: '#AAA', fontSize: '12px' }}
                        >
                          {i + 1}
                        </td>
                        <td style={s.td}>
                          <span
                            style={{
                              ...s.actionBadge,
                              background: color.bg,
                              color: color.color,
                            }}
                          >
                            {l.action}
                          </span>
                        </td>
                        <td style={{ ...s.td, fontWeight: '600' }}>
                          {l.performedBy}
                        </td>
                        <td style={s.td}>
                          {l.recordId && l.recordId !== '-' ? (
                            <span style={s.recordTag}>{l.recordId}</span>
                          ) : (
                            <span style={{ color: '#CCC' }}>—</span>
                          )}
                        </td>
                        <td
                          style={{ ...s.td, color: '#AAA', fontSize: '12px' }}
                        >
                          {l.oldValue && l.oldValue !== '-' ? l.oldValue : '—'}
                        </td>
                        <td
                          style={{ ...s.td, color: '#666', fontSize: '12px' }}
                        >
                          {l.newValue && l.newValue !== '-' ? l.newValue : '—'}
                        </td>
                        <td
                          style={{
                            ...s.td,
                            color: '#AAA',
                            fontSize: '12px',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {l.timestamp}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

const s = {
  page: {
    padding: '32px',
  },
  pageHead: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: '24px',
    paddingBottom: '20px',
    borderBottom: '1px solid #EDE8E0',
  },
  pageTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: '3px',
  },
  pageSub: {
    fontSize: '13px',
    color: '#999',
  },
  refreshBtn: {
    padding: '9px 16px',
    background: 'white',
    color: '#666',
    border: '1.5px solid #EDE8E0',
    borderRadius: '7px',
    fontSize: '13px',
    cursor: 'pointer',
    fontWeight: '500',
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '12px',
    marginBottom: '20px',
  },
  statCard: {
    background: 'white',
    borderRadius: '10px',
    padding: '16px 18px',
    border: '1px solid #EDE8E0',
  },
  statNum: {
    fontSize: '24px',
    fontWeight: '800',
    color: '#1A1A1A',
    lineHeight: '1',
    marginBottom: '5px',
  },
  statLabel: {
    fontSize: '12px',
    color: '#AAA',
    fontWeight: '500',
  },
  card: {
    background: 'white',
    borderRadius: '12px',
    border: '1px solid #EDE8E0',
    overflow: 'hidden',
  },
  cardHead: {
    padding: '14px 20px',
    borderBottom: '1px solid #EDE8E0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#1A1A1A',
  },
  countBadge: {
    fontSize: '12px',
    color: '#AAA',
  },
  filterRow: {
    padding: '12px 20px',
    borderBottom: '1px solid #EDE8E0',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  searchWrap: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: '#FAF8F5',
    border: '1.5px solid #EDE8E0',
    borderRadius: '8px',
    padding: '0 12px',
  },
  searchInput: {
    flex: 1,
    padding: '8px 0',
    border: 'none',
    background: 'transparent',
    fontSize: '13px',
    outline: 'none',
    color: '#1A1A1A',
  },
  filterSelect: {
    padding: '8px 12px',
    border: '1.5px solid #EDE8E0',
    borderRadius: '7px',
    fontSize: '13px',
    background: '#FAF8F5',
    outline: 'none',
    color: '#1A1A1A',
    cursor: 'pointer',
  },
  clearBtn: {
    padding: '8px 14px',
    background: 'white',
    border: '1.5px solid #EDE8E0',
    borderRadius: '7px',
    fontSize: '13px',
    color: '#999',
    cursor: 'pointer',
  },
  tableWrap: { overflowX: 'auto' },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px',
  },
  thead: {
    background: '#FAF8F5',
    borderBottom: '1px solid #EDE8E0',
  },
  th: {
    padding: '11px 16px',
    textAlign: 'left',
    fontSize: '11px',
    fontWeight: '700',
    color: '#AAA',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
  },
  td: {
    padding: '11px 16px',
    borderBottom: '1px solid #F5F2ED',
    color: '#1A1A1A',
    fontSize: '13px',
  },
  trEven: { background: 'white' },
  trOdd: { background: '#FDFCFA' },
  actionBadge: {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: '700',
    whiteSpace: 'nowrap',
  },
  recordTag: {
    fontFamily: 'Consolas, monospace',
    fontSize: '12px',
    fontWeight: '600',
    color: '#C4520A',
    background: '#FFF0E6',
    padding: '2px 8px',
    borderRadius: '4px',
  },
  empty: {
    padding: '48px 24px',
    textAlign: 'center',
  },
  emptyIcon: {
    fontSize: '28px',
    marginBottom: '10px',
    color: '#DDD',
  },
  emptyTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: '5px',
  },
  emptySub: {
    fontSize: '12px',
    color: '#AAA',
  },
};
