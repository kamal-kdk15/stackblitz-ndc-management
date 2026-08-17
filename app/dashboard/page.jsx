'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '../components/layout.jsx';

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalNDC: 0,
    activeNDC: 0,
    pendingNDC: 0,
    uniqueProducts: 0,
    pendingChanges: 0,
  });
  const [recent, setRecent] = useState([]);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [allData, setAllData] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const res = await fetch('/api/ndc');
      const data = await res.json();
      if (data.success) {
        const registry = data.data;
        setAllData(registry);
        setStats({
          totalNDC: registry.length,
          activeNDC: registry.filter((r) => r.status === 'Active').length,
          pendingNDC: registry.filter((r) => r.status === 'Pending').length,
          uniqueProducts: [...new Set(registry.map((r) => r.product_name))]
            .length,
          pendingChanges: 0,
        });
        setRecent(registry.slice(0, 5));
      }
    } catch (e) {
      console.log(e);
    }
    try {
      const res2 = await fetch('/api/changes');
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

  return (
    <Layout current="/dashboard">
      <div style={s.page}>
        <div style={s.header}>
          <div>
            <h1 style={s.title}>Dashboard</h1>
            <p style={s.sub}>Sun Pharma Industries Ltd. — NDC Registry</p>
          </div>
          <button style={s.btn} onClick={() => router.push('/ndc')}>
            + Create NDC
          </button>
        </div>

        <div style={s.statsRow}>
          {[
            { label: 'Labeler Code', value: '70095', sub: 'Sun Pharma' },
            {
              label: 'Product Codes Used',
              value: `${stats.totalNDC} / 999`,
              sub: 'Sequential codes assigned',
            },
            { label: 'Total NDCs', value: stats.totalNDC, sub: 'Generated' },

            {
              label: 'Active',
              value: stats.activeNDC,
              sub: 'Currently active',
              color: '#2D6A4F',
            },

            {
              label: 'Products',
              value: stats.uniqueProducts,
              sub: 'Unique drugs',
            },
            // {
            //   label: 'Pending',
            //   value: stats.pendingChanges,
            //   sub: 'Change requests',
            //   color: stats.pendingChanges > 0 ? '#C4520A' : '#1A1A1A',
            // },
          ].map((c, i) => (
            <div key={i} style={s.statCard}>
              <div style={{ ...s.statNum, color: c.color || '#1A1A1A' }}>
                {c.value}
              </div>
              <div style={s.statLabel}>{c.label}</div>
              <div style={s.statSub}>{c.sub}</div>
            </div>
          ))}
        </div>
        {/* exhausion.. */}
        {stats.totalNDC >= 900 && (
          <div style={s.warning}>
            ⚠️ <strong>Warning:</strong> Product codes nearing limit —
            {999 - stats.totalNDC} codes remaining under labeler 70095. Contact
            FDA for new labeler code.
          </div>
        )}

        <div style={s.grid}>
          <div style={s.card}>
            <div style={s.cardHead}>
              <span style={s.cardTitle}>Recently added NDCs</span>
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
                <button style={s.btn} onClick={() => router.push('/ndc')}>
                  + Create NDC
                </button>
              </div>
            ) : (
              recent.map((r, i) => (
                <div key={i} style={s.row}>
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

          {/* search... */}
          <div style={s.searchBox}>
            <div style={s.searchTop}>
              <div style={s.searchTitle}>Search by NDC</div>
              <div style={s.searchSub}>
                Look up any drug by NDC code or product name across the
                registry.
              </div>
            </div>
            <div style={s.searchBottom}>
              <input
                style={s.searchInput}
                placeholder="NDC code or product name..."
                value={search}
                onChange={handleSearch}
              />
              {search && searchResults.length === 0 && (
                <div style={s.noResult}>No results found</div>
              )}
              {searchResults.length > 0 && (
                <div style={s.resultList}>
                  {searchResults.map((r, i) => (
                    <div key={i} style={s.resultRow}>
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
                Open NDC Registry
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

const s = {
  page: {
    padding: '32px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '24px',
    paddingBottom: '20px',
    borderBottom: '1px solid #EDE8E0',
  },
  title: {
    fontSize: '25px',
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: '3px',
  },
  sub: {
    fontSize: '13px',
    color: '#999',
  },
  btn: {
    padding: '9px 16px',
    background: '#E8650A',
    color: 'white',
    border: 'none',
    borderRadius: '7px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '12px',
    marginBottom: '24px',
  },
  statCard: {
    background: 'white',
    borderRadius: '10px',
    padding: '18px',
    border: '1px solid #EDE8E0',
  },
  statNum: {
    fontSize: '28px',
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
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 280px',
    gap: '16px',
    alignItems: 'strech',
  },
  card: {
    background: 'white',
    borderRadius: '10px',
    border: '1px solid #EDE8E0',
    overflow: 'hidden',
  },
  cardHead: {
    padding: '14px 18px',
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
    borderRadius: '10px',
    border: '1px solid #EDE8E0',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  searchTop: {
    background: '#1A1A1A',
    padding: '24px 18px',
  },
  searchTitle: {
    fontSize: '16px',
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
    padding: '16px',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  searchInput: {
    width: '100%',
    padding: '9px 12px',
    border: '1.5px solid #EDE8E0',
    borderRadius: '7px',
    fontSize: '13px',
    outline: 'none',
    background: '#FAF8F5',
    marginBottom: '10px',
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
    borderRadius: '7px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
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
