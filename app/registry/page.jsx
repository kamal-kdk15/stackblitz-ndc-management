'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Layout from '../components/layout.jsx';
import CreateNDCWizard from '../components/CreateNDCWizard.jsx';


export default function RegistryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState(null);
  const [registry, setRegistry] = useState([]);
  const [search, setSearch] = useState('');
  const [ndcCode, setNdcCode] = useState('');
  const [productName, setProductName] = useState('');
  const [strength, setStrength] = useState('');
  const [status, setStatus] = useState('');
  const [rxOtc, setRxOtc] = useState('');
  const [dosageForm, setDosageForm] = useState('');
  const [andaNumber, setAndaNumber] = useState('');
  const [createdBy, setCreatedBy] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
const [page, setPage] = useState(1);
const [total, setTotal] = useState(0);
const pageSize = 50;

useEffect(() => { fetchRegistry(); }, [page]);

 useEffect(() => {
  const urlStatus = searchParams.get('status');

  if (urlStatus) {
    setStatus(
      urlStatus.toLowerCase() === 'active'
        ? 'Active'
        : urlStatus
    );
  }

  fetch('/api/me')
    .then((res) => res.json())
    .then((data) => {
      if (data.success && data.user) {
        setUser(data.user);
      } else {
        router.push('/');
      }
    })
    .catch(() => router.push('/'));
}, [searchParams, router]);
useEffect(() => {
  if (user) {
    fetchRegistry();
  }
}, [user, status]);

  function buildQuery(targetPage = page, overrides = {}) {
    const params = new URLSearchParams();
    params.set('page', targetPage);
params.set('pageSize', pageSize);
    const filters = { search, ndc_code: ndcCode, product_name: productName, strength, status, rx_otc: rxOtc, dosage_form: dosageForm, anda_number: andaNumber, created_by: createdBy, dateFrom, dateTo, ...overrides };
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    return params.toString();
  }

  async function fetchRegistry(targetPage = page, overrides = {}) {
    setLoading(true);
    try {
      const qs = buildQuery(targetPage, overrides);
      const res = await fetch(`/api/ndc${qs ? `?${qs}` : ''}`, { cache: 'no-store' });
      const data = await res.json();
   if (data.success) {
  setRegistry(data.data);
  setTotal(data.total);
}
    } catch (e) {
      console.log(e);
    }
    setLoading(false);
  }

  function handleApplyFilters() {
    setPage(1);
    setTimeout(() => fetchRegistry(1), 0);
  }

  function applyColumnFilter(key, setter, value) {
    setter(value);
    setPage(1);
    setTimeout(() => fetchRegistry(1, { [key]: value }), 0);
  }

  function handleClearFilters() {
    setSearch('');
    setNdcCode('');
    setProductName('');
    setStrength('');
    setStatus('');
    setRxOtc('');
    setDosageForm('');
    setAndaNumber('');
    setCreatedBy('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
    setTimeout(() => fetchRegistry(1, {
      search: '', ndc_code: '', product_name: '', strength: '', status: '', rx_otc: '',
      dosage_form: '', anda_number: '', created_by: '', dateFrom: '', dateTo: ''
    }), 0);
  }

  function handleExport() {
    const qs = buildQuery();
    window.open(`/api/ndc/export${qs ? `?${qs}` : ''}`, '_blank');
  }

  function handleCreateNDCSuccess(ndc) {
    setShowWizard(false);
    fetchRegistry();
  }

  const activeFilterCount = [ndcCode, productName, strength, status, rxOtc, dosageForm, andaNumber, createdBy, dateFrom, dateTo].filter(Boolean).length;
  const filterOptions = (key) => [...new Set(registry.map((record) => record[key]).filter(Boolean))].slice(0, 25);

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
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
   

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
                      <th style={s.th}><ColumnFilter label="NDC Code" value={ndcCode} options={filterOptions('ndc_code')} onApplied={(value) => applyColumnFilter('ndc_code', setNdcCode, value)} /></th>
                      <th style={s.th}><ColumnFilter label="Product" value={productName} options={filterOptions('product_name')} onApplied={(value) => applyColumnFilter('product_name', setProductName, value)} /></th>
                      <th style={s.th}><ColumnFilter label="Strength" value={strength} options={filterOptions('strength')} onApplied={(value) => applyColumnFilter('strength', setStrength, value)} /></th>
                      <th style={s.th}><ColumnFilter label="Dosage Form" value={dosageForm} options={filterOptions('dosage_form')} onApplied={(value) => applyColumnFilter('dosage_form', setDosageForm, value)} /></th>
                      <th style={s.th}><ColumnFilter label="Rx / OTC" value={rxOtc} options={['Rx', 'OTC']} onApplied={(value) => applyColumnFilter('rx_otc', setRxOtc, value)} /></th>
                      <th style={s.th}><ColumnFilter label="ANDA No." value={andaNumber} options={filterOptions('anda_number')} onApplied={(value) => applyColumnFilter('anda_number', setAndaNumber, value)} /></th>
                      <th style={s.th}><ColumnFilter label="Status" value={status} options={['Active', 'Inactive']} onApplied={(value) => applyColumnFilter('status', setStatus, value)} /></th>
                      <th style={s.th}><ColumnFilter label="Created By" value={createdBy} options={filterOptions('created_by')} onApplied={(value) => applyColumnFilter('created_by', setCreatedBy, value)} /></th>
                      <th style={s.th}>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registry.map((r, i) => (
  <tr
    key={r.id}
    className="data-table-row"
    style={{ ...(i % 2 === 0 ? s.trEven : s.trOdd), cursor: 'pointer' }}
    onClick={() => router.push(`/registry/${r.ndc_code}`)}  
  >
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
           <div style={s.paginationRow}>
  <button
    style={{ ...s.pageBtn, ...(page === 1 ? s.pageBtnDisabled : {}) }}
    disabled={page === 1}
    onClick={() => setPage(p => p - 1)}
  >
    ← Previous
  </button>
  <span style={s.pageInfo}>
    Page {page} of {Math.max(1, Math.ceil(total / pageSize))} · {total} total records
  </span>
  <button
    style={{ ...s.pageBtn, ...(page >= Math.ceil(total / pageSize) ? s.pageBtnDisabled : {}) }}
    disabled={page >= Math.ceil(total / pageSize)}
    onClick={() => setPage(p => p + 1)}
  >
    Next →
  </button>
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

function ColumnFilter({ label, value, options = [], onApplied }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value || '');
  const visibleOptions = options.filter((option) => option.toLowerCase().includes(draft.toLowerCase()));

  useEffect(() => {
    if (open) setDraft(value || '');
  }, [open, value]);

  function apply() {
    onApplied(draft);
    setOpen(false);
  }

  function clear() {
    onApplied('');
    setOpen(false);
  }

  return (
    <div style={s.columnFilter}>
      <button
        type="button"
        style={{ ...s.columnFilterButton, ...(value ? s.columnFilterButtonActive : {}) }}
        onClick={() => setOpen((isOpen) => !isOpen)}
        aria-expanded={open}
      >
        {label}<span style={s.columnFilterArrow} aria-hidden="true">▾</span>
      </button>
      {open && (
        <div style={s.columnFilterMenu}>
          <input
            autoFocus
            style={s.columnFilterInput}
            placeholder={`Search ${label.toLowerCase()}`}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && apply()}
          />
          {visibleOptions.length > 0 && (
            <div style={s.columnFilterOptions}>
              {visibleOptions.map((option) => (
                <button key={option} type="button" style={s.columnFilterOption} onClick={() => setDraft(option)}>
                  {option}
                </button>
              ))}
            </div>
          )}
          <div style={s.columnFilterActions}>
            <button type="button" style={s.columnFilterClear} onClick={clear}>Clear</button>
            <button type="button" style={s.columnFilterApply} onClick={apply}>Apply</button>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  page: { padding: '32px' },
  pageHead: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' },
  pageTitle: { fontSize: '24px', fontWeight: '700', color: '#1A1A1A', marginBottom: '4px', letterSpacing: '-0.3px' },
  pageSub: { fontSize: '13px', color: '#999' },
  primaryBtn: { padding: '9px 18px', background: '#E8650A', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', flexShrink: 0 },
  exportBtn: { padding: '9px 16px', background: 'white', color: '#444', border: '1.5px solid #EDE8E0', borderRadius: '7px', fontSize: '13px', cursor: 'pointer', fontWeight: '600' },
paginationRow: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '16px 20px', borderTop: '1px solid #EDE8E0' },
pageBtn: { padding: '8px 16px', border: '1.5px solid #EDE8E0', borderRadius: '7px', background: 'white', color: '#444', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
pageBtnDisabled: { background: '#F7F5F2', borderColor: '#EEEAE4', color: '#C5C0B8', cursor: 'default', opacity: 0.72 },
pageInfo: { fontSize: '13px', color: '#999' },
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
  columnFilter: { position: 'relative', display: 'inline-block' },
  columnFilterButton: { display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '0', border: 'none', background: 'transparent', color: '#AAA', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase', cursor: 'pointer', whiteSpace: 'nowrap' },
  columnFilterButtonActive: { color: '#C4520A' },
  columnFilterArrow: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '16px', height: '16px', borderRadius: '4px', background: '#E8EDF0', color: '#3F5158', fontSize: '12px', fontWeight: '900', lineHeight: '1' },
  columnFilterMenu: { position: 'absolute', top: 'calc(100% + 8px)', left: 0, zIndex: 10, minWidth: '190px', padding: '10px', background: 'white', border: '1px solid #EDE8E0', borderRadius: '8px', boxShadow: '0 8px 24px rgba(26, 26, 26, 0.12)', textTransform: 'none', letterSpacing: 'normal' },
  columnFilterInput: { width: '100%', padding: '8px 9px', border: '1.5px solid #EDE8E0', borderRadius: '6px', fontSize: '12px', outline: 'none', color: '#1A1A1A', background: 'white' },
  columnFilterOptions: { display: 'flex', flexDirection: 'column', gap: '2px', maxHeight: '150px', overflowY: 'auto', marginTop: '7px', paddingTop: '6px', borderTop: '1px solid #F0ECE7' },
  columnFilterOption: { padding: '6px 7px', border: 'none', borderRadius: '4px', background: 'transparent', color: '#4B5A5D', fontSize: '12px', textAlign: 'left', cursor: 'pointer' },
  columnFilterActions: { display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '9px' },
  columnFilterClear: { padding: '6px 9px', border: '1px solid #EDE8E0', borderRadius: '5px', background: 'white', color: '#777', fontSize: '11px', cursor: 'pointer' },
  columnFilterApply: { padding: '6px 10px', border: 'none', borderRadius: '5px', background: '#1A1A1A', color: 'white', fontSize: '11px', fontWeight: '600', cursor: 'pointer' },
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