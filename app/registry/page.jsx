'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '../components/layout.jsx';
import CreateNDCWizard from '../components/CreateNDCWizard.jsx';

export default function RegistryPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [registry, setRegistry] = useState([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading] = useState(true);
 const [showWizard, setShowWizard] = useState(false);

 useEffect(() => {
  fetch('/api/me')
    .then((res) => res.json())
    .then((data) => {
      if (data.success && data.user) {
        setUser(data.user);
        fetchRegistry();  
      } else {
        router.push('/');
      }
    })
    .catch(() => router.push('/'));
}, []);
 async function fetchRegistry() {
  try {
    const res = await fetch('/api/ndc', { cache: 'no-store' });  
    const data = await res.json();
    if (data.success) setRegistry(data.data);
  } catch (e) {
    console.log(e);
  }
  setLoading(false);
}

  const filtered = registry.filter((r) => {
    const matchSearch =
      r.ndc_code?.toLowerCase().includes(search.toLowerCase()) ||
      r.product_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.anda_number?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus ? r.status === filterStatus : true;
    return matchSearch && matchStatus;
  });
function handleCreateNDCSuccess(ndc) {
    setShowWizard(false);
    fetchRegistry(); 
}
  if (!user) return null;

  return (
    <Layout current="/registry">
      <div style={s.page}>
        <div style={s.pageHead}>
          <div>
            <h1 style={s.pageTitle}>NDC Registry</h1>
            <p style={s.pageSub}>
              All generated National Drug Codes — Sun Pharma Industries Ltd.
            </p>
          </div>
         {user?.role !== 'Viewer' && (
            <button style={s.primaryBtn} onClick={() => setShowWizard(true)}>
              + Create NDC
            </button>
          )}
        </div>

        <div style={s.card}>
          <div style={s.filterRow}>
            <div style={s.searchWrap}>
              <span style={s.searchIcon}>🔍︎</span>
              <input
                style={s.searchInput}
                placeholder="Search by NDC code, product name, ANDA number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              style={s.filterSelect}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="Active">Active</option>
              <option value="Superseded">Superseded</option>
              <option value="Inactive">Inactive</option>
            </select>
            {(search || filterStatus) && (
              <button
                style={s.clearBtn}
                onClick={() => {
                  setSearch('');
                  setFilterStatus('');
                }}
              >
                Clear
              </button>
            )}
            <div style={s.countBadge}>
              {filtered.length} record{filtered.length !== 1 ? 's' : ''}
            </div>
          </div>

          {loading ? (
            <div style={s.empty}>
              <div style={s.emptyText}>Loading...</div>
            </div>
          ) : filtered.length === 0 ? (
            <div style={s.empty}>
              <div style={s.emptyIcon}>🕮</div>
              <div style={s.emptyText}>No NDC records found</div>
              <div style={s.emptySub}>
                {search || filterStatus
                  ? 'Try adjusting your search or filter'
                  : 'Generate your first NDC to get started'}
              </div>
              {!search && !filterStatus && user.role !== 'Viewer' && (
                <button
                  style={s.primaryBtn}
                  onClick={() => router.push('/ndc')}
                >
                  + Create NDC
                </button>
              )}
            </div>
          ) : (
            <div style={s.tableWrap}>
              <table style={s.table}>
                <thead>
                  <tr style={s.thead}>
                    <th style={s.th}>#</th>
                    <th style={s.th}>NDC Code</th>
                    <th style={s.th}>Product</th>
                    <th style={s.th}>Strength</th>
                    <th style={s.th}>Dosage Form</th>
                    <th style={s.th}>Rx / OTC</th>
                    <th style={s.th}>ANDA No.</th>
                    <th style={s.th}>Status</th>
                    <th style={s.th}>Created By</th>
                    <th style={s.th}>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r, i) => (
                    <tr key={r.id} style={i % 2 === 0 ? s.trEven : s.trOdd}>
                      <td
                        style={{ ...s.td, color: '#94A3B8', fontSize: '12px' }}
                      >
                        {i + 1}
                      </td>
                      <td style={s.td}>
                        <span style={s.ndcCode}>{r.ndc_code}</span>
                      </td>
                      <td
                        style={{ ...s.td, fontWeight: '600', color: '#1C2B2B' }}
                      >
                        {r.product_name}
                      </td>
                      <td style={s.td}>{r.strength}</td>
                      <td style={s.td}>{r.dosage_form}</td>
                      <td style={s.td}>
                        <span
                          style={r.rx_otc === 'Rx' ? s.badgeRx : s.badgeOtc}
                        >
                          {r.rx_otc}
                        </span>
                      </td>
                      <td
                        style={{ ...s.td, fontSize: '12px', color: '#6B7C7A' }}
                      >
                        {r.anda_number}
                      </td>
                      <td style={s.td}>
                        <span
                          style={
                            r.status === 'Active'
                              ? s.badgeActive
                              : r.status === 'Superseded'
                              ? s.badgeSuperseded
                              : r.status === 'Pending'
                              ? s.badgePending
                              : s.badgeInactive
                          }
                        >
                          {r.status}
                        </span>
                      </td>
                      <td style={{ ...s.td, color: '#6B7C7A' }}>
                        {r.created_by}
                      </td>
                      <td
                        style={{ ...s.td, fontSize: '12px', color: '#6B7C7A' }}
                      >
                        {r.created_at}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
            {showWizard && (
        <CreateNDCWizard
          user={user}
          onClose={() => setShowWizard(false)}
          onSuccess={handleCreateNDCSuccess}
        />
      )}
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
  },
  pageTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: '4px',
    letterSpacing: '-0.3px',
  },
  pageSub: {
    fontSize: '13px',
    color: '#999',
  },
  primaryBtn: {
    padding: '9px 18px',
    background: '#E8650A',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    flexShrink: 0,
  },
  card: {
    background: 'white',
    borderRadius: '12px',
    border: '1px solid #EDE8E0',
    overflow: 'hidden',
  },
  filterRow: {
    padding: '14px 20px',
    borderBottom: '1px solid #EDE8E0',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
  },

  searchWrap: {
    flex: 1,
    minWidth: '200px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: '#FAF8F5',
    border: '1.5px solid #EDE8E0',
    borderRadius: '8px',
    padding: '0 12px',
  },
  searchIcon: {
    fontSize: '14px',
    flexShrink: 0,
  },
  searchInput: {
    flex: 1,
    padding: '9px 0',
    border: 'none',
    background: 'transparent',
    fontSize: '13px',
    outline: 'none',
    color: '#1A1A1A',
  },
  filterSelect: {
    padding: '9px 12px',
    border: '1.5px solid #EDE8E0',
    borderRadius: '8px',
    fontSize: '13px',
    background: '#FAF8F5',
    outline: 'none',
    color: '#1A1A1A',
    cursor: 'pointer',
  },
  clearBtn: {
    padding: '9px 14px',
    background: 'white',
    border: '1.5px solid #EDE8E0',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#999',
    cursor: 'pointer',
  },
  countBadge: {
    fontSize: '12px',
    color: '#AAA',
    whiteSpace: 'nowrap',
  },
  tableWrap: {
    overflowX: 'auto',
  },
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
    padding: '12px 16px',
    borderBottom: '1px solid #F5F2ED',
    color: '#1A1A1A',
    fontSize: '13px',
  },
  trEven: { background: 'white' },
  trOdd: { background: '#FDFCFA' },

  ndcCode: {
    fontFamily: 'Consolas, monospace',
    fontSize: '12px',
    fontWeight: '700',
    color: '#C4520A',
    background: '#FFF0E6',
    padding: '3px 8px',
    borderRadius: '4px',
    letterSpacing: '0.5px',
  },
  badgeActive: {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: '700',
    background: '#F0F7F4',
    color: '#2D6A4F',
  },
  badgePending: {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: '700',
    background: '#FFFBEB',
    color: '#92400E',
  },
  badgeInactive: {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: '700',
    background: '#FEF2F2',
    color: '#991B1B',
  },
  badgeRx: {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: '700',
    background: '#FFF0E6',
    color: '#C4520A',
  },
  badgeOtc: {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: '700',
    background: '#F5F3EF',
    color: '#666',
  },
  empty: {
    padding: '60px 24px',
    textAlign: 'center',
  },
  emptyIcon: {
    fontSize: '32px',
    marginBottom: '12px',
  },
  emptyText: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: '6px',
  },
  emptySub: {
    fontSize: '13px',
    color: '#AAA',
    marginBottom: '20px',
  },

  badgeSuperseded: {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: '700',
    background: '#F5F3EF',
    color: '#666',
  },
};
