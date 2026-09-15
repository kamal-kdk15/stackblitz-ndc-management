'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '../components/layout.jsx';
import CreateNDCWizard from '../components/CreateNDCWizard.jsx';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [showWizard, setShowWizard] = useState(false);
  const [systemConfig, setSystemConfig] = useState(null);
  const [stats, setStats] = useState({
  totalNDC: 0,
  activeNDC: 0,
  pendingNDC: 0,
  uniqueProducts: 0,
  productCodesUsed: 0,
  pendingChanges: 0,
});
  const [recent, setRecent] = useState([]);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [allData, setAllData] = useState([]);
const [productCodesUsed, setProductCodesUsed] = useState(0);

useEffect(() => {
  fetch('/api/me')
    .then((res) => res.json())
    .then((data) => {
      if (data.success && data.user) {
        setUser(data.user);
        fetchData();  
        fetchSystemConfig();
      } else {
        router.push('/');
      }
    })
    .catch(() => router.push('/'));
}, []);

async function fetchSystemConfig() {
  try {
    const res = await fetch('/api/admin/config', {
      cache: 'no-store'
    });

    const data = await res.json();

    if (data.success && data.data) {
      setSystemConfig(data.data);
    }
  } catch (error) {
    console.error('Failed to fetch system config:', error);
  }
}

  async function fetchData() {
    try {
      const res = await fetch('/api/ndc', { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        const registry = data.data;
        setAllData(registry);
      

setStats({
  totalNDC: registry.length,

  activeNDC: registry.filter(
    (r) => r.status === 'Active'
  ).length,

  pendingNDC: registry.filter(
    (r) => r.status === 'Pending'
  ).length,

  uniqueProducts: [
    ...new Set(
      registry
        .map((r) => r.product_name)
        .filter(Boolean)
    )
  ].length,


  pendingChanges: 0,
});
        setRecent(registry.slice(0, 5));
      }
    } catch (e) {
      console.log(e);
    }
    try {
  const productsRes = await fetch('/api/products', {
    cache: 'no-store'
  });

  const productsData = await productsRes.json();

  if (productsData.success && Array.isArray(productsData.data)) {
    setProductCodesUsed(productsData.data.length);
  } else {
    setProductCodesUsed(0);
  }
} catch (error) {
  console.error('Failed to fetch products:', error);
  setProductCodesUsed(0);
}
    try {
      const res2 = await fetch('/api/changes', { cache: 'no-store' });
      if (res2.ok) {
        const data2 = await res2.json();
        const changeItems = Array.isArray(data2?.data) ? data2.data : [];
        if (data2.success) {
          setStats((prev) => ({
            ...prev,
            pendingChanges: changeItems.filter((r) => r.status === 'Pending')
              .length,
          }));
        }
      }
    } catch (e) {
      console.log(e);
    }
  }

  function handleSearch(e) {
    const val = e.target.value;
    setSearch(val);
    if (!val.trim()) {
      setSearchResults([]);
      return;
    }
    const filtered = allData.filter(
      (r) =>
        r.ndc_code?.toLowerCase().includes(val.toLowerCase()) ||
        r.product_name?.toLowerCase().includes(val.toLowerCase())
    );
    setSearchResults(filtered);
  }

  function handleCreateNDCSuccess(ndc) {
    setShowWizard(false);
    fetchData();
  }

  const activityData = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));
    const nextDate = new Date(date);
    nextDate.setDate(date.getDate() + 1);
    const count = allData.filter((record) => {
      const createdAt = new Date(record.created_at);
      return createdAt >= date && createdAt < nextDate;
    }).length;

    return {
      label: date.toLocaleDateString('en-US', { weekday: 'short' }),
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      count,
    };
  });

  const activityMax = Math.max(...activityData.map((item) => item.count), 1);
  const activeRate = stats.totalNDC
    ? Math.round((stats.activeNDC / stats.totalNDC) * 100)
    : 0;
  const codeCapacity = systemConfig?.maxProductCode
    ? Math.min(Math.round((productCodesUsed / systemConfig.maxProductCode) * 100), 100)
    : 0;
  const currentHour = new Date().getHours();
  const timeGreeting = currentHour < 12
    ? 'Good morning'
    : currentHour < 18
      ? 'Good afternoon'
      : currentHour < 22
        ? 'Good evening'
        : 'Good night';

  if (!user) return null;

  return (
    <Layout current="/dashboard">
      <div style={s.page} className="dashboard-page">
        <style jsx>{`
          .dashboard-page :global(.data-list-row) { transition: background 0.18s ease, transform 0.18s ease; }
          .dashboard-page :global(.data-list-row:hover) { transform: translateX(3px); }
          .dashboard-page :global(button:focus-visible), .dashboard-page :global(input:focus-visible) { outline: 3px solid rgba(232, 101, 10, 0.22); outline-offset: 2px; }
          @media (max-width: 1100px) {
            .dashboard-page { padding: 24px !important; }
            .dashboard-page :global(.stats-grid) { grid-template-columns: repeat(3, 1fr); }
          }
          @media (max-width: 760px) {
            .dashboard-page { padding: 18px !important; }
            .dashboard-page :global(.dashboard-hero) { flex-direction: column; align-items: flex-start; gap: 18px; }
            .dashboard-page :global(.hero-actions) { width: 100%; justify-content: space-between; }
            .dashboard-page :global(.stats-grid), .dashboard-page :global(.dashboard-grid) { grid-template-columns: 1fr; }
            .dashboard-page :global(.stat-card) { min-height: 116px; }
          }
        `}</style>
        <div style={s.hero} className="dashboard-hero">
          <div>
            <div style={s.eyebrow}>NDC Dashboard</div>
            <h1 style={s.title}>{timeGreeting}, {user.name?.split(' ')[0] || 'there'}.</h1>
            <p style={s.sub}>A live view of your NDC catalog, product capacity, and recent activity.</p>
          </div>
          <div style={s.heroActions} className="hero-actions">
            <span style={s.liveStatus}><span style={s.liveDot} /> System live</span>
            {user?.role !== 'Viewer' && (
              <button style={s.btn} onClick={() => setShowWizard(true)}>
                <span style={s.btnIcon}>+</span> Create NDC
              </button>
            )}
          </div>
        </div>

        <div style={s.statsRow} className="stats-grid">
          {[
          {
  label: 'Labeler Code',
  value: systemConfig?.labelerCode || '—',
  sub: 'Sun Pharma',
  href: null
},
{
  label: 'Product Codes Used',
 value: `${productCodesUsed} / ${systemConfig?.maxProductCode || '—'}`,
  sub: 'Sequential codes assigned',
  href: null
},
            { label: 'Total NDCs', value: stats.totalNDC, sub: 'Generated', href: '/registry' },

            {
  label: 'Active',
  value: stats.activeNDC,
  sub: 'Currently active',
  color: '#2D6A4F',
  href: '/registry?status=active',
},

            {
              label: 'Products',
              value: stats.uniqueProducts,
              sub: 'Unique drugs',
              href: '/products',
            },
            // {
            //   label: 'Pending',
            //   value: stats.pendingChanges,
            //   sub: 'Change requests',
            //   color: stats.pendingChanges > 0 ? '#C4520A' : '#1A1A1A',
            // },
          ].map((c, i) => (
            <div
              key={i}
              style={{
                ...s.statCard,
                cursor: c.href ? 'pointer' : 'default',
              }}
              onMouseEnter={(e) => {
                if (c.href) e.currentTarget.style.borderColor = '#E8650A';
              }}
              onMouseLeave={(e) => {
                if (c.href) e.currentTarget.style.borderColor = '#EDE8E0';
              }}
              onClick={() => c.href && router.push(c.href)}
            >
              <div style={{ ...s.statNum, color: c.color || '#1A1A1A' }}>
                {c.value}
              </div>
              <div style={s.statLabel}>{c.label}</div>
              <div style={s.statSub}>{c.sub}</div>
            </div>
          ))}
        </div>
        {/* exhausion.. */}
       {systemConfig?.maxProductCode &&
  productCodesUsed >=
    systemConfig.maxProductCode * 0.9 && (
    <div style={s.warning}>
      ⚠️ <strong>Warning:</strong> Product codes nearing limit —
      {systemConfig.maxProductCode - productCodesUsed} codes
      remaining under labeler {systemConfig.labelerCode}.
    </div>
  )}

        <div style={s.dashboardGrid}>
          <div style={{ ...s.card, ...s.activityCard }}>
            <div style={s.cardHead}>
              <div>
                <div style={s.cardKicker}>ACTIVITY</div>
                <span style={s.cardTitle}>NDCs added this week</span>
              </div>
              <span style={s.metricPill}>{stats.totalNDC} total</span>
            </div>
            <div style={s.chartWrap}>
              <div style={s.chartYAxis}><span>{activityMax}</span><span>{Math.ceil(activityMax / 2)}</span><span>0</span></div>
              <div style={s.chart}>
                <div style={s.chartGridLine} />
                <div style={{ ...s.chartGridLine, top: '50%' }} />
                <div style={{ ...s.chartGridLine, top: '100%' }} />
                <div style={s.bars}>
                  {activityData.map((item) => (
                    <button key={item.date} style={s.barGroup} title={`${item.date}: ${item.count} NDC${item.count === 1 ? '' : 's'}`} onClick={() => router.push('/registry')}>
                      <span style={{ ...s.bar, height: `${Math.max((item.count / activityMax) * 100, item.count ? 8 : 3)}%` }} />
                      <span style={s.barLabel}>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div style={s.chartFoot}><span><strong>{Math.max(...activityData.map((item) => item.count))}</strong> peak day</span><span>Last 7 days</span></div>
          </div>

          <div style={{ ...s.card, ...s.healthCard }}>
            <div style={s.cardHead}>
              <div>
                <div style={s.cardKicker}>CATALOG HEALTH</div>
                <span style={s.cardTitle}>Registry status</span>
              </div>
              <span style={s.healthBadge}>Healthy</span>
            </div>
            <div style={s.healthBody}>
              <div style={{ ...s.ring, background: `conic-gradient(#2D6A4F ${activeRate}%, #EDE8E0 0)` }}>
                <div style={s.ringInner}><strong>{activeRate}%</strong><span>active</span></div>
              </div>
              <div style={s.healthLegend}>
                <div><span style={{ ...s.legendDot, background: '#2D6A4F' }} />Active <strong>{stats.activeNDC}</strong></div>
                <div><span style={{ ...s.legendDot, background: '#E8650A' }} />Pending <strong>{stats.pendingNDC}</strong></div>
                <div><span style={{ ...s.legendDot, background: '#D6D0C7' }} />Other <strong>{Math.max(stats.totalNDC - stats.activeNDC - stats.pendingNDC, 0)}</strong></div>
              </div>
            </div>
            <div style={s.capacityRow}><span>Product code capacity</span><strong>{codeCapacity}%</strong></div>
            <div style={s.capacityTrack}><span style={{ width: `${codeCapacity}%` }} /></div>
          </div>

          <div style={{ ...s.card, ...s.recentCard }}>
            <div style={s.cardHead}>
              <div>
                <div style={s.cardKicker}>LATEST RECORDS</div>
                <span style={s.cardTitle}>Recently added NDCs</span>
              </div>
              <button
                style={s.linkBtn}
                onClick={() => router.push('/registry')}
              >
                View all →
              </button>
            </div>

            {recent.length === 0 ? (
              <div style={s.empty}>
                <div style={s.emptyTitle}>No NDCs generated yet</div>
                <div style={s.emptySub}>
                  Create your first NDC to get started
                </div>
                <button style={s.btn} onClick={() => setShowWizard(true)}>
                  + Create NDC
                </button>
              </div>
            ) : (
             recent.map((r, i) => (
  <div
    key={i}
    className="data-list-row"
    style={{ ...s.row, cursor: 'pointer' }}
    onClick={() => router.push(`/registry/${r.ndc_code}`)} 
  >
    <div style={s.rowLeft}>
      <div style={s.rowIcon}>💊</div>
      <div>
        <div style={s.rowName}>{r.product_name}</div>
        <div style={s.rowMeta}>
          {r.strength} · {r.dosage_form} · {r.rx_otc}
        </div>
      </div>
    </div>
    <span style={s.ndcTag}>{r.ndc_code}</span>
  </div>
))
            )}
          </div>

          <div style={{ ...s.searchBox, ...s.searchCard }}>
            <div style={s.searchTop}>
              <div style={s.searchEyebrow}>QUICK LOOKUP</div>
              <div style={s.searchTitle}>Find a record</div>
              <div style={s.searchSub}>
                Look up any drug by NDC code or product name across the
                registry.
              </div>
            </div>
            <div style={s.searchBottom}>
              <div style={s.inputWrap}>
                <span style={s.inputIcon}>⌕</span>
                <input
                  style={s.searchInput}
                  placeholder="NDC code or product name..."
                  value={search}
                  onChange={handleSearch}
                />
              </div>
              {search && searchResults.length === 0 && (
                <div style={s.noResult}>No results found</div>
              )}
              {searchResults.length > 0 && (
                <div style={s.resultList}>
                  {searchResults.map((r, i) => (
                    <div
                      key={i}
                      className="data-list-row"
                      style={s.resultRow}
                      role="button"
                      tabIndex={0}
                      onClick={() => router.push(`/registry/${r.ndc_code}`)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          router.push(`/registry/${r.ndc_code}`);
                        }
                      }}
                    >
                      <span style={s.resultName}>{r.product_name}</span>
                      <span style={s.resultNdc}>{r.ndc_code}</span>
                    </div>
                  ))}
                </div>
              )}
              <button
                style={s.searchBtn}
                onClick={() => router.push('/registry')}
              >
                Browse full registry <span>→</span>
              </button>
            </div>
          </div>
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
    padding: '34px 38px 48px',
    maxWidth: '1480px',
    margin: '0 auto',
  },
  hero: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: '28px',
    padding: '4px 0 26px',
    borderBottom: '1px solid #E5DED3',
  },
  eyebrow: {
    color: '#C4520A',
    fontSize: '10px',
    fontWeight: '800',
    letterSpacing: '1.5px',
    textTransform: 'uppercase',
    marginBottom: '9px',
  },
  title: {
    fontSize: '30px',
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: '-0.6px',
    marginBottom: '5px',
  },
  sub: {
    fontSize: '13px',
    color: '#77716A',
  },
  heroActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '18px',
  },
  liveStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
    color: '#557064',
    fontSize: '12px',
    fontWeight: '600',
  },
  liveDot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    background: '#3B9B6D',
    boxShadow: '0 0 0 4px #DDF1E6',
  },
  btn: {
    padding: '11px 16px',
    background: '#E8650A',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 5px 12px rgba(196, 82, 10, 0.16)',
  },
  btnIcon: {
    fontSize: '16px',
    lineHeight: 0,
    marginRight: '4px',
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '12px',
    marginBottom: '18px',
  },
  statCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '17px 18px',
    border: '1px solid #E5DED3',
    minHeight: '108px',
    transition: 'border-color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease',
  },
  statNum: {
    fontSize: '25px',
    fontWeight: '800',
    color: '#1A1A1A',
    lineHeight: '1',
    marginBottom: '6px',
  },
  statLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: '2px',
  },
  statSub: {
    fontSize: '11px',
    color: '#BBB',
  },
  dashboardGrid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1.6fr) minmax(300px, 0.9fr)',
    gap: '16px',
    alignItems: 'stretch',
  },
  card: {
    background: 'white',
    borderRadius: '12px',
    border: '1px solid #E5DED3',
    overflow: 'hidden',
  },
  activityCard: { minHeight: '300px' },
  healthCard: { minHeight: '300px' },
  recentCard: { minHeight: '280px' },
  cardHead: {
    padding: '17px 19px 15px',
    borderBottom: '1px solid #F0EBE2',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#1A1A1A',
  },
  cardKicker: {
    fontSize: '9px',
    letterSpacing: '1.2px',
    fontWeight: '800',
    color: '#B0A99F',
    marginBottom: '4px',
  },
  metricPill: {
    padding: '5px 9px',
    background: '#F7F3EE',
    borderRadius: '20px',
    fontSize: '11px',
    color: '#77716A',
    fontWeight: '600',
  },
  chartWrap: {
    display: 'flex',
    gap: '10px',
    height: '166px',
    padding: '17px 19px 0',
  },
  chartYAxis: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    width: '18px',
    paddingBottom: '21px',
    color: '#B7B0A7',
    fontSize: '10px',
  },
  chart: { flex: 1, position: 'relative', minWidth: 0 },
  chartGridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    borderTop: '1px dashed #E9E3DB',
  },
  bars: {
    position: 'absolute',
    inset: '0 0 0 8px',
    display: 'flex',
    alignItems: 'stretch',
    justifyContent: 'space-around',
    gap: '8px',
  },
  barGroup: {
    flex: 1,
    border: 'none',
    background: 'transparent',
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
  },
  bar: {
    display: 'block',
    width: 'min(28px, 65%)',
    minHeight: '3px',
    borderRadius: '5px 5px 2px 2px',
    background: 'linear-gradient(180deg, #F08A40 0%, #E8650A 100%)',
    transition: 'height 0.3s ease, filter 0.15s ease',
  },
  barLabel: { color: '#A9A198', fontSize: '10px' },
  chartFoot: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 19px 14px',
    color: '#A19A91',
    borderTop: '1px solid #F1ECE6',
    fontSize: '11px',
  },
  healthBadge: {
    color: '#2D6A4F',
    background: '#EAF5EF',
    padding: '5px 9px',
    borderRadius: '20px',
    fontSize: '10px',
    fontWeight: '700',
  },
  healthBody: {
    display: 'flex',
    alignItems: 'center',
    gap: '22px',
    padding: '20px 20px 17px',
  },
  ring: {
    width: '104px',
    height: '104px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  ringInner: {
    width: '78px',
    height: '78px',
    borderRadius: '50%',
    background: '#FFFFFF',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  healthLegend: { display: 'flex', flexDirection: 'column', gap: '9px', flex: 1, fontSize: '11px', color: '#77716A' },
  healthLegendItem: {},
  legendDot: { width: '7px', height: '7px', borderRadius: '50%', display: 'inline-block', marginRight: '7px' },
  capacityRow: { display: 'flex', justifyContent: 'space-between', padding: '14px 20px 8px', borderTop: '1px solid #F1ECE6', color: '#77716A', fontSize: '11px' },
  capacityTrack: { height: '6px', background: '#F0ECE6', borderRadius: '6px', margin: '0 20px 18px', overflow: 'hidden' },
  capacityTrackFill: {},
  linkBtn: {
    background: 'transparent',
    border: 'none',
    fontSize: '12px',
    color: '#E8650A',
    cursor: 'pointer',
    fontWeight: '600',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '13px 18px',
    borderBottom: '1px solid #F7F4F0',
  },
  rowLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  rowIcon: {
    width: '32px',
    height: '32px',
    background: '#FFF0E6',
    borderRadius: '7px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
  },
  rowName: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: '1px',
  },
  rowMeta: {
    fontSize: '11px',
    color: '#AAA',
  },
  ndcTag: {
    fontFamily: 'Consolas, monospace',
    fontSize: '11px',
    color: '#AAA',
    letterSpacing: '0.3px',
  },
  empty: {
    padding: '40px 20px',
    textAlign: 'center',
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
    marginBottom: '16px',
  },
  searchBox: {
    background: 'white',
    borderRadius: '12px',
    border: '1px solid #E5DED3',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  searchCard: { minHeight: '280px' },
  searchTop: {
    background: '#242321',
    padding: '21px 19px 20px',
    position: 'relative',
    overflow: 'hidden',
  },
  searchEyebrow: {
    color: '#EFA06C',
    fontSize: '9px',
    letterSpacing: '1.4px',
    fontWeight: '800',
    marginBottom: '8px',
  },
  searchTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: 'white',
    marginBottom: '5px',
  },
  searchSub: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.45)',
    lineHeight: '1.6',
    marginTop: '6px',
  },
  searchBottom: {
    padding: '17px 16px 16px',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  inputWrap: { position: 'relative', marginBottom: '10px' },
  inputIcon: { position: 'absolute', left: '12px', top: '6px', color: '#A59D94', fontSize: '20px', zIndex: 1 },
  searchInput: {
    width: '100%',
    padding: '10px 12px 10px 34px',
    border: '1.5px solid #EDE8E0',
    borderRadius: '7px',
    fontSize: '13px',
    outline: 'none',
    background: '#FAF8F5',
    marginBottom: 0,
    color: '#1A1A1A',
  },
  noResult: {
    fontSize: '12px',
    color: '#BBB',
    textAlign: 'center',
    padding: '6px',
    marginBottom: '8px',
  },
  resultList: {
    border: '1px solid #EDE8E0',
    borderRadius: '7px',
    marginBottom: '10px',
    overflow: 'hidden',
  },
  resultRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '9px 12px',
    borderBottom: '1px solid #F5F2ED',
    cursor: 'pointer',
  },
  resultName: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#1A1A1A',
  },
  resultNdc: {
    fontFamily: 'Consolas, monospace',
    fontSize: '11px',
    color: '#AAA',
  },
  searchBtn: {
    width: '100%',
    padding: '10px',
    background: '#E8650A',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  warning: {
    padding: '12px 16px',
    background: '#FEF2F2',
    border: '1px solid #FECACA',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#991B1B',
    marginBottom: '20px',
    fontWeight: '500',
  },
};