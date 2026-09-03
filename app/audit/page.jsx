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
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
const [page, setPage] = useState(1);
const [total, setTotal] = useState(0);
const pageSize = 50;

useEffect(() => { fetchAudit(); }, [page]);

  useEffect(() => {
    fetch('/api/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user) {
          setUser(data.user);
          fetchAudit();
        } else {
          router.push('/');
        }
      })
      .catch(() => router.push('/'));
  }, []);

  function buildQuery() {
    const params = new URLSearchParams();
    params.set('page', page);
params.set('pageSize', pageSize);
    if (search) params.set('search', search);
    if (filterAction) params.set('action', filterAction);
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);
    return params.toString();
  }

  async function fetchAudit(targetPage = page) {
  setLoading(true);

  try {
    const params = new URLSearchParams();

    params.set('page', targetPage);
    params.set('pageSize', pageSize);

    if (search) params.set('search', search);
    if (filterAction) params.set('action', filterAction);
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);

    const res = await fetch(`/api/audit?${params.toString()}`, {
      cache: 'no-store'
    });

    const data = await res.json();

    if (data.success) {
      setLogs(data.data);
      setTotal(data.total);
    }
  } catch (e) {
    console.log(e);
  } finally {
    setLoading(false);
  }
}

  function handleClearFilters() {
    setSearch('');
    setFilterAction('');
    setDateFrom('');
    setDateTo('');
    setTimeout(fetchAudit, 0);
  }

  function handleExport() {
    const qs = buildQuery();
    window.open(`/api/audit/export${qs ? `?${qs}` : ''}`, '_blank');
  }

  const actionColors = {
    LOGIN: { bg: '#F0F7F4', color: '#2D6A4F' },
    LOGOUT: { bg: '#F5F3EF', color: '#666' },
    NDC_CREATED: { bg: '#FFF0E6', color: '#C4520A' },
    STATUS_CHANGED: { bg: '#FFFBEB', color: '#92400E' },
    CHANGE_REQUESTED: { bg: '#FEF2F2', color: '#991B1B' },
    CHANGE_REVIEWED: { bg: '#F0F4FF', color: '#3730A3' },
  };

  function parseMaybeJSON(str) {
    if (!str || str === '-') return null;
    try {
      return JSON.parse(str);
    } catch {
      return str;
    }
  }

  function formatAuditDiff(oldStr, newStr) {
    const oldVal = parseMaybeJSON(oldStr);
    const newVal = parseMaybeJSON(newStr);

    const isOldObj = oldVal !== null && typeof oldVal === 'object';
    const isNewObj = newVal !== null && typeof newVal === 'object';

    // Plain strings 
    if (!isOldObj && !isNewObj) {
      return {
        oldDisplay: oldVal === null ? '—' : String(oldVal),
        newDisplay: newVal === null ? '—' : String(newVal),
      };
    }

    // At least one side is an object
    const base = isNewObj ? newVal : oldVal;
    const changedKeys = Object.keys(base).filter((key) => {
      const o = isOldObj ? oldVal[key] : undefined;
      const n = isNewObj ? newVal[key] : undefined;
      return JSON.stringify(o) !== JSON.stringify(n);
    });

    if (changedKeys.length === 0) {
      return { oldDisplay: '—', newDisplay: '—' };
    }

    const oldDisplay = changedKeys
      .map((k) => `${k}: ${isOldObj && oldVal[k] !== undefined ? oldVal[k] : '—'}`)
      .join(', ');
    const newDisplay = changedKeys
      .map((k) => `${k}: ${isNewObj && newVal[k] !== undefined ? newVal[k] : '—'}`)
      .join(', ');

    return { oldDisplay, newDisplay };
  }

 
  const knownActions = [
    'LOGIN', 'LOGOUT', 'NDC_CREATED', 'NDC_ACTIVATED', 'NDC_DEACTIVATED',
    'PRODUCT_CREATED', 'PRODUCT_UPDATED', 'PRODUCT_STATUS_CHANGED',
    'PACKAGE_CREATED', 'PACKAGE_UPDATED', 'PACKAGES_AUTO_DEACTIVATED',
    'NDCS_AUTO_DEACTIVATED', 'USER_CREATED', 'USER_UPDATED', 'USER_DELETED',
    'SESSION_REVOKED', 'ALL_SESSIONS_REVOKED', 'SYSTEM_CONFIG_UPDATED',
  ];

  const activeFilterCount = [filterAction, dateFrom, dateTo].filter(Boolean).length;

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
          <div style={{ display: 'flex', gap: '10px' }}>
            <button style={s.exportBtn} onClick={handleExport}>
              ⇩ Export
            </button>
            <button style={s.refreshBtn} onClick={fetchAudit}>
              ↻ Refresh
            </button>
          </div>
        </div>

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
          {/* <div style={s.statCard}>
            <div style={{ ...s.statNum, color: '#92400E' }}>
              {logs.filter((l) => l.action === 'CHANGE_REQUESTED').length}
            </div>
            <div style={s.statLabel}>Change Requests</div>
          </div> */}
        </div>

        <div style={s.card}>
          <div style={s.cardHead}>
            <span style={s.cardTitle}>System Activity Log</span>
            <span style={s.countBadge}>{logs.length} entries</span>
          </div>

          <div style={s.filterRow}>
            <div style={s.searchWrap}>
              <input
                style={s.searchInput}
                placeholder="Search by user, action, record ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchAudit()}
              />
            </div>
            <button
              style={{ ...s.filterToggleBtn, ...(showFilters ? s.filterToggleBtnActive : {}) }}
              onClick={() => setShowFilters(!showFilters)}
            >
              ▤ Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
            </button>
           <button
  style={s.applyBtn}
  onClick={() => {
    setPage(1);
    fetchAudit(1);
  }}
>
  Search
</button>
            {(search || activeFilterCount > 0) && (
              <button style={s.clearBtn} onClick={handleClearFilters}>
                Clear
              </button>
            )}
          </div>

          {showFilters && (
            <div style={s.advancedFilterRow}>
              <div style={s.filterField}>
                <label style={s.filterLabel}>Action</label>
                <select style={s.filterInput} value={filterAction} onChange={(e) => setFilterAction(e.target.value)}>
                  <option value="">All Actions</option>
                  {knownActions.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
              <div style={s.filterField}>
                <label style={s.filterLabel}>From Date</label>
                <input type="date" style={s.filterInput} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              </div>
              <div style={s.filterField}>
                <label style={s.filterLabel}>To Date</label>
                <input type="date" style={s.filterInput} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </div>
              <button style={s.applyBtn} onClick={fetchAudit}>
                Apply
              </button>
            </div>
          )}

          {loading ? (
            <div style={s.empty}>
              <div style={s.emptyText}>Loading...</div>
            </div>
          ) : logs.length === 0 ? (
            <div style={s.empty}>
              <div style={s.emptyIcon}>◎</div>
              <div style={s.emptyTitle}>No audit logs found</div>
              <div style={s.emptySub}>
                {search || activeFilterCount > 0
                  ? 'Try adjusting your search or filters'
                  : 'Actions will appear here as users interact with the system'}
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
                  {logs.map((l, i) => {
                    const color = actionColors[l.action] || { bg: '#F5F3EF', color: '#666' };
                    const { oldDisplay, newDisplay } = formatAuditDiff(l.oldValue, l.newValue);
                    return (
                      <tr key={i} style={i % 2 === 0 ? s.trEven : s.trOdd}>
                        <td style={{ ...s.td, color: '#AAA', fontSize: '12px' }}>{i + 1}</td>
                        <td style={s.td}>
                          <span style={{ ...s.actionBadge, background: color.bg, color: color.color }}>
                            {l.action}
                          </span>
                        </td>
                        <td style={{ ...s.td, fontWeight: '600' }}>{l.performedBy}</td>
                        <td style={s.td}>
                          {l.recordId && l.recordId !== '-' ? (
                            <span style={s.recordTag}>{l.recordId}</span>
                          ) : (
                            <span style={{ color: '#CCC' }}>—</span>
                          )}
                        </td>
                        <td style={s.tdTruncate} title={oldDisplay}>
                          {oldDisplay}
                        </td>
                        <td style={{ ...s.tdTruncate, color: '#666' }} title={newDisplay}>
                          {newDisplay}
                        </td>
                        <td style={{ ...s.td, color: '#AAA', fontSize: '12px', whiteSpace: 'nowrap' }}>
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
        <div style={s.paginationRow}>
  <button
    style={s.pageBtn}
    disabled={page === 1}
    onClick={() => setPage(p => p - 1)}
  >
    ← Previous
  </button>
  <span style={s.pageInfo}>
    Page {page} of {Math.max(1, Math.ceil(total / pageSize))} · {total} total records
  </span>
  <button
    style={s.pageBtn}
    disabled={page >= Math.ceil(total / pageSize)}
    onClick={() => setPage(p => p + 1)}
  >
    Next →
  </button>
</div>
      </div>
    </Layout>
  );
}

const s = {
  page: { padding: '32px' },
  pageHead: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid #EDE8E0' },
  pageTitle: { fontSize: '20px', fontWeight: '700', color: '#1A1A1A', marginBottom: '3px' },
  pageSub: { fontSize: '13px', color: '#999' },
  refreshBtn: { padding: '9px 16px', background: 'white', color: '#666', border: '1.5px solid #EDE8E0', borderRadius: '7px', fontSize: '13px', cursor: 'pointer', fontWeight: '500' },
  exportBtn: { padding: '9px 16px', background: 'white', color: '#444', border: '1.5px solid #EDE8E0', borderRadius: '7px', fontSize: '13px', cursor: 'pointer', fontWeight: '600' },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' },
  statCard: { background: 'white', borderRadius: '10px', padding: '16px 18px', border: '1px solid #EDE8E0' },
  statNum: { fontSize: '24px', fontWeight: '800', color: '#1A1A1A', lineHeight: '1', marginBottom: '5px' },
  statLabel: { fontSize: '12px', color: '#AAA', fontWeight: '500' },
  card: { background: 'white', borderRadius: '12px', border: '1px solid #EDE8E0', overflow: 'hidden' },
  cardHead: { padding: '14px 20px', borderBottom: '1px solid #EDE8E0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { fontSize: '13px', fontWeight: '600', color: '#1A1A1A' },
  countBadge: { fontSize: '12px', color: '#AAA' },
  paginationRow: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '16px 20px', borderTop: '1px solid #EDE8E0' },
pageBtn: { padding: '8px 16px', border: '1.5px solid #EDE8E0', borderRadius: '7px', background: 'white', color: '#444', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
pageInfo: { fontSize: '13px', color: '#999' },
  filterRow: { padding: '12px 20px', borderBottom: '1px solid #EDE8E0', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' },
  searchWrap: { flex: 1, minWidth: '200px', display: 'flex', alignItems: 'center', gap: '8px', background: '#FAF8F5', border: '1.5px solid #EDE8E0', borderRadius: '8px', padding: '0 12px' },
  searchInput: { flex: 1, padding: '8px 0', border: 'none', background: 'transparent', fontSize: '13px', outline: 'none', color: '#1A1A1A' },
  filterToggleBtn: { padding: '8px 14px', background: 'white', border: '1.5px solid #EDE8E0', borderRadius: '7px', fontSize: '13px', color: '#666', cursor: 'pointer', fontWeight: '600', whiteSpace: 'nowrap' },
  filterToggleBtnActive: { background: '#FFF0E6', borderColor: '#F0997B', color: '#C4520A' },
  applyBtn: { padding: '8px 16px', background: '#1A1A1A', color: 'white', border: 'none', borderRadius: '7px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' },
  clearBtn: { padding: '8px 14px', background: 'white', border: '1.5px solid #EDE8E0', borderRadius: '7px', fontSize: '13px', color: '#999', cursor: 'pointer' },
  advancedFilterRow: { padding: '12px 20px', borderBottom: '1px solid #EDE8E0', display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'flex-end', background: '#FDFCFA' },
  filterField: { display: 'flex', flexDirection: 'column', gap: '5px', minWidth: '150px' },
  filterLabel: { fontSize: '11px', fontWeight: '600', color: '#999' },
  filterInput: { padding: '8px 10px', border: '1.5px solid #EDE8E0', borderRadius: '7px', fontSize: '13px', outline: 'none', color: '#1A1A1A', background: 'white' },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' },
  thead: { background: '#FAF8F5', borderBottom: '1px solid #EDE8E0' },
  th: { padding: '11px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#AAA', letterSpacing: '0.5px', textTransform: 'uppercase', whiteSpace: 'nowrap' },
  td: { padding: '11px 16px', borderBottom: '1px solid #F5F2ED', color: '#1A1A1A', fontSize: '13px' },
  tdTruncate: {
    padding: '11px 16px',
    borderBottom: '1px solid #F5F2ED',
    color: '#AAA',
    fontSize: '12px',
    maxWidth: '220px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    cursor: 'default',
  },
  trEven: { background: 'white' },
  trOdd: { background: '#FDFCFA' },
  actionBadge: { display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', whiteSpace: 'nowrap' },
  recordTag: { fontFamily: 'Consolas, monospace', fontSize: '12px', fontWeight: '600', color: '#C4520A', background: '#FFF0E6', padding: '2px 8px', borderRadius: '4px' },
  empty: { padding: '48px 24px', textAlign: 'center' },
  emptyIcon: { fontSize: '28px', marginBottom: '10px', color: '#DDD' },
  emptyTitle: { fontSize: '14px', fontWeight: '600', color: '#1A1A1A', marginBottom: '5px' },
  emptySub: { fontSize: '12px', color: '#AAA' },
};