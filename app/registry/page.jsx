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
  const [status, setStatus] = useState('');
  const [rxOtc, setRxOtc] = useState('');
  const [dosageForm, setDosageForm] = useState('');
  const [createdBy, setCreatedBy] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
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

  function buildQuery() {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (status) params.set('status', status);
    if (rxOtc) params.set('rx_otc', rxOtc);
    if (dosageForm) params.set('dosage_form', dosageForm);
    if (createdBy) params.set('created_by', createdBy);
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);
    return params.toString();
  }

  async function fetchRegistry() {
    setLoading(true);
    try {
      const qs = buildQuery();
      const res = await fetch(`/api/ndc${qs ? `?${qs}` : ''}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success) setRegistry(data.data);
    } catch (e) {
      console.log(e);
    }
    setLoading(false);
  }

  function handleApplyFilters() {
    fetchRegistry();
  }

  function handleClearFilters() {
    setSearch('');
    setStatus('');
    setRxOtc('');
    setDosageForm('');
    setCreatedBy('');
    setDateFrom('');
    setDateTo('');
    setTimeout(fetchRegistry, 0);
  }

  function handleExport() {
    const qs = buildQuery();
    window.open(`/api/ndc/export${qs ? `?${qs}` : ''}`, '_blank');
  }

  function handleCreateNDCSuccess(ndc) {
    setShowWizard(false);
    fetchRegistry();
  }

  const activeFilterCount = [status, rxOtc, dosageForm, createdBy, dateFrom, dateTo].filter(Boolean).length;

  if (!user) return null;

  return (
    <>
      <Layout current="/registry">
        <div style={s.page}>
          <div style={s.pageHead}>
            <div>
              <h1 style={s.pageTitle}>NDC Registry</h1>
              <p style={s.pageSub}>
                All generated National Drug Codes — Sun Pharma Industries Ltd.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
             <button style={s.exportBtn} onClick={handleExport}>
              ⇩ Export
            </button>
              {user?.role !== 'Viewer' && (
                <button style={s.primaryBtn} onClick={() => setShowWizard(true)}>
                  + Create NDC
                </button>
              )}
            </div>
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
                  onKeyDown={(e) => e.key === 'Enter' && fetchRegistry()}
                />
              </div>
              <button
                style={{ ...s.filterToggleBtn, ...(showFilters ? s.filterToggleBtnActive : {}) }}
                onClick={() => setShowFilters(!showFilters)}
              >
                ▤ Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
              </button>
              <button style={s.applyBtn} onClick={fetchRegistry}>
                Search
              </button>
              {(search || activeFilterCount > 0) && (
                <button style={s.clearBtn} onClick={handleClearFilters}>
                  Clear
                </button>
              )}
              <div style={s.countBadge}>
                {registry.length} record{registry.length !== 1 ? 's' : ''}
              </div>
            </div>

            {showFilters && (
              <div style={s.advancedFilterRow}>
                <div style={s.filterField}>
                  <label style={s.filterLabel}>Status</label>
                  <select style={s.filterInput} value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="">All</option>
                    <option value="Active">Active</option>
                    <option value="Superseded">Superseded</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div style={s.filterField}>
                  <label style={s.filterLabel}>Rx / OTC</label>
                  <select style={s.filterInput} value={rxOtc} onChange={(e) => setRxOtc(e.target.value)}>
                    <option value="">All</option>
                    <option value="Rx">Rx</option>
                    <option value="OTC">OTC</option>
                  </select>
                </div>
                <div style={s.filterField}>
                  <label style={s.filterLabel}>Dosage Form</label>
                  <input
                    style={s.filterInput}
                    placeholder="e.g. Tablet"
                    value={dosageForm}
                    onChange={(e) => setDosageForm(e.target.value)}
                  />
                </div>
                <div style={s.filterField}>
                  <label style={s.filterLabel}>Created By</label>
                  <input
                    style={s.filterInput}
                    placeholder="e.g. Kamal"
                    value={createdBy}
                    onChange={(e) => setCreatedBy(e.target.value)}
                  />
                </div>
                <div style={s.filterField}>
                  <label style={s.filterLabel}>From Date</label>
                  <input
                    type="date"
                    style={s.filterInput}
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>
                <div style={s.filterField}>
                  <label style={s.filterLabel}>To Date</label>
                  <input
                    type="date"
                    style={s.filterInput}
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>
                <button style={s.applyBtn} onClick={handleApplyFilters}>
                  Apply
                </button>
              </div>
            )}

            {loading ? (
              <div style={s.empty}>
                <div style={s.emptyText}>Loading...</div>
              </div>
            ) : registry.length === 0 ? (
              <div style={s.empty}>
                <div style={s.emptyIcon}>🕮</div>
                <div style={s.emptyText}>No NDC records found</div>
                <div style={s.emptySub}>
                  {search || activeFilterCount > 0
                    ? 'Try adjusting your search or filters'
                    : 'Generate your first NDC to get started'}
                </div>
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
                    {registry.map((r, i) => (
                      <tr key={r.id} style={i % 2 === 0 ? s.trEven : s.trOdd}>
                        <td style={{ ...s.td, color: '#94A3B8', fontSize: '12px' }}>{i + 1}</td>
                        <td style={s.td}>
                          <span style={s.ndcCode}>{r.ndc_code}</span>
                        </td>
                        <td style={{ ...s.td, fontWeight: '600', color: '#1C2B2B' }}>{r.product_name}</td>
                        <td style={s.td}>{r.strength}</td>
                        <td style={s.td}>{r.dosage_form}</td>
                        <td style={s.td}>
                          <span style={r.rx_otc === 'Rx' ? s.badgeRx : s.badgeOtc}>{r.rx_otc}</span>
                        </td>
                        <td style={{ ...s.td, fontSize: '12px', color: '#6B7C7A' }}>{r.anda_number}</td>
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
                        <td style={{ ...s.td, color: '#6B7C7A' }}>{r.created_by}</td>
                        <td style={{ ...s.td, fontSize: '12px', color: '#6B7C7A' }}>{r.created_at}</td>
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
    </>
  );
}

const s = {
  page: { padding: '32px' },
  pageHead: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' },
  pageTitle: { fontSize: '24px', fontWeight: '700', color: '#1A1A1A', marginBottom: '4px', letterSpacing: '-0.3px' },
  pageSub: { fontSize: '13px', color: '#999' },
  primaryBtn: { padding: '9px 18px', background: '#E8650A', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', flexShrink: 0 },
  exportBtn: { padding: '9px 16px', background: 'white', color: '#444', border: '1.5px solid #EDE8E0', borderRadius: '7px', fontSize: '13px', cursor: 'pointer', fontWeight: '600' },

  card: { background: 'white', borderRadius: '12px', border: '1px solid #EDE8E0', overflow: 'hidden' },
  filterRow: { padding: '14px 20px', borderBottom: '1px solid #EDE8E0', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' },
  searchWrap: { flex: 1, minWidth: '200px', display: 'flex', alignItems: 'center', gap: '8px', background: '#FAF8F5', border: '1.5px solid #EDE8E0', borderRadius: '8px', padding: '0 12px' },
  searchIcon: { fontSize: '14px', flexShrink: 0 },
  searchInput: { flex: 1, padding: '9px 0', border: 'none', background: 'transparent', fontSize: '13px', outline: 'none', color: '#1A1A1A' },
  filterToggleBtn: { padding: '9px 14px', background: 'white', border: '1.5px solid #EDE8E0', borderRadius: '8px', fontSize: '13px', color: '#666', cursor: 'pointer', fontWeight: '600', whiteSpace: 'nowrap' },
  filterToggleBtnActive: { background: '#FFF0E6', borderColor: '#F0997B', color: '#C4520A' },
  applyBtn: { padding: '9px 16px', background: '#1A1A1A', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' },
  clearBtn: { padding: '9px 14px', background: 'white', border: '1.5px solid #EDE8E0', borderRadius: '8px', fontSize: '13px', color: '#999', cursor: 'pointer' },
  countBadge: { fontSize: '12px', color: '#AAA', whiteSpace: 'nowrap' },
  advancedFilterRow: { padding: '14px 20px', borderBottom: '1px solid #EDE8E0', display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'flex-end', background: '#FDFCFA' },
  filterField: { display: 'flex', flexDirection: 'column', gap: '5px', minWidth: '130px' },
  filterLabel: { fontSize: '11px', fontWeight: '600', color: '#999' },
  filterInput: { padding: '8px 10px', border: '1.5px solid #EDE8E0', borderRadius: '7px', fontSize: '13px', outline: 'none', color: '#1A1A1A', background: 'white' },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' },
  thead: { background: '#FAF8F5', borderBottom: '1px solid #EDE8E0' },
  th: { padding: '11px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#AAA', letterSpacing: '0.5px', textTransform: 'uppercase', whiteSpace: 'nowrap' },
  td: { padding: '12px 16px', borderBottom: '1px solid #F5F2ED', color: '#1A1A1A', fontSize: '13px' },
  trEven: { background: 'white' },
  trOdd: { background: '#FDFCFA' },
  ndcCode: { fontFamily: 'Consolas, monospace', fontSize: '12px', fontWeight: '700', color: '#C4520A', background: '#FFF0E6', padding: '3px 8px', borderRadius: '4px', letterSpacing: '0.5px' },
  badgeActive: { display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', background: '#F0F7F4', color: '#2D6A4F' },
  badgePending: { display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', background: '#FFFBEB', color: '#92400E' },
  badgeInactive: { display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', background: '#FEF2F2', color: '#991B1B' },
  badgeRx: { display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', background: '#FFF0E6', color: '#C4520A' },
  badgeOtc: { display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', background: '#F5F3EF', color: '#666' },
  badgeSuperseded: { display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', background: '#F5F3EF', color: '#666' },
  empty: { padding: '60px 24px', textAlign: 'center' },
  emptyIcon: { fontSize: '32px', marginBottom: '12px' },
  emptyText: { fontSize: '14px', fontWeight: '600', color: '#1A1A1A', marginBottom: '6px' },
  emptySub: { fontSize: '13px', color: '#AAA', marginBottom: '20px' },
};