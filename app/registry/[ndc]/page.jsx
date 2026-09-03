'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Layout from '../../components/layout.jsx';

export default function NDCDetailPage() {
  const params = useParams();
  const router = useRouter();

  const ndcCode = decodeURIComponent(params.ndc);

  const [user, setUser] = useState(null);
  const [ndc, setNdc] = useState(null);
  const [product, setProduct] = useState(null);
  const [pkg, setPkg] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const meRes = await fetch('/api/me');
        const meData = await meRes.json();

        if (!meData.success || !meData.user) {
          router.push('/');
          return;
        }

        setUser(meData.user);

        const [ndcRes, productsRes] = await Promise.all([
          fetch('/api/ndc', { cache: 'no-store' }),
          fetch('/api/products', { cache: 'no-store' }),
        ]);

        const ndcData = await ndcRes.json();
        const productsData = await productsRes.json();

        if (!ndcData.success) {
          setLoading(false);
          return;
        }

        const foundNdc = (ndcData.data || []).find(
          (item) => item.ndc_code === ndcCode
        );

        if (!foundNdc) {
          setLoading(false);
          return;
        }

        setNdc(foundNdc);

        const productCode = foundNdc.ndc_code?.split('-')[1];
        const packageCode = foundNdc.ndc_code?.split('-')[2];

        const foundProduct = (productsData.data || []).find(
          (item) => String(item.product_code) === String(productCode)
        );

        if (foundProduct) {
          setProduct(foundProduct);

          const packagesRes = await fetch(
            `/api/packages?product_id=${foundProduct.id}`,
            { cache: 'no-store' }
          );

          const packagesData = await packagesRes.json();

          if (packagesData.success) {
            const foundPackage = (packagesData.data || []).find(
              (item) =>
                String(item.package_code) === String(packageCode)
            );

            if (foundPackage) {
              setPkg(foundPackage);
            }
          }
        }
      } catch (error) {
        console.error('Error loading NDC:', error);
      }

      setLoading(false);
    }

    loadData();
  }, [ndcCode, router]);

  if (!user) return null;

  if (loading) {
    return (
      <Layout current="/registry">
        <div style={s.page}>
          <div style={s.empty}>
            <div style={s.emptyText}>Loading...</div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!ndc) {
    return (
      <Layout current="/registry">
        <div style={s.page}>
          <div style={s.empty}>
            <div style={s.emptyIcon}>🕮</div>
            <div style={s.emptyText}>NDC not found</div>
            <div style={s.emptySub}>No registry record exists for {ndcCode}.</div>
            <button style={s.primaryBtn} onClick={() => router.push('/registry')}>
              ← Back to Registry
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const statusBadgeStyle =
    ndc.status === 'Active' ? s.badgeActive
    : ndc.status === 'Superseded' ? s.badgeSuperseded
    : s.badgeInactive;

  return (
    <Layout current="/registry">
      <div style={s.page}>

        <button style={s.backLink} onClick={() => router.push('/registry')}>
          ← Back to Registry
        </button>

        <div style={s.pageHead}>
          <div>
            <h1 style={s.pageTitle}>NDC Details</h1>
            <p style={s.pageSub}>Full record for this National Drug Code — Sun Pharma Industries Ltd.</p>
          </div>
         <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
    <button className="no-print" style={s.editBtn} onClick={() => window.print()}>
      🖶 Print / Save as PDF
    </button>
    <span style={statusBadgeStyle}>{ndc.status || 'Unknown'}</span>
  </div>
        </div>

        {/* Overview */}
        <div style={s.card}>
          <div style={s.cardHead}>
            <span style={s.cardTitle}>Overview</span>
            <span style={s.ndcCode}>{ndc.ndc_code}</span>
          </div>
          <div style={s.cardBody}>
            <div style={s.detailsGrid}>
              <Detail label="Labeler Code" value={ndc.labeler_code || ndc.ndc_code?.split('-')[0]} />
              <Detail label="Product Code" value={ndc.ndc_code?.split('-')[1]} />
              <Detail label="Package Code" value={ndc.ndc_code?.split('-')[2]} />
              <Detail label="Created By" value={ndc.created_by} />
              <Detail
                label="Created At"
                value={ndc.created_at ? new Date(ndc.created_at).toLocaleString() : '—'}
              />
            </div>
          </div>
        </div>

        {/* Product */}
        <div style={s.card}>
          <div style={s.cardHead}>
            <span style={s.cardTitle}>Product</span>
            {product && (
              <button style={s.editBtn} onClick={() => router.push(`/products/${product.id}`)}>
                View Product →
              </button>
            )}
          </div>
          <div style={s.cardBody}>
            <div style={s.rowLeft}>
              <div style={s.rowIcon}>💊</div>
              <div style={s.productName}>{product?.product_name || ndc.product_name || '—'}</div>
            </div>
            <div style={s.detailsGrid}>
              <Detail label="Product Code" value={product?.product_code || ndc.ndc_code?.split('-')[1]} />
              <Detail label="Strength" value={product?.strength || ndc.strength} />
              <Detail label="Dosage Form" value={product?.dosage_form || ndc.dosage_form} />
              <Detail label="Rx / OTC" value={product?.rx_otc || ndc.rx_otc} />
              <Detail label="ANDA Number" value={product?.anda_number || ndc.anda_number} />
              <Detail label="Status" value={product?.status} />
            </div>
          </div>
        </div>

        {/* Package */}
        <div style={s.card}>
          <div style={s.cardHead}>
            <span style={s.cardTitle}>Package</span>
            {pkg && (
              <button style={s.editBtn} onClick={() => router.push(`/packages/${pkg.id}`)}>
                View Package →
              </button>
            )}
          </div>
          <div style={s.cardBody}>
            {pkg ? (
              <>
                <div style={s.rowLeft}>
                  <div style={s.rowIcon}>📦</div>
                  <div style={s.productName}>Code: <span style={s.ndcCode}>{pkg.package_code}</span></div>
                </div>
                <div style={s.detailsGrid}>
                  <Detail label="Package Size" value={pkg.package_size} />
                  <Detail label="Unit" value={pkg.unit} />
                  <Detail label="Description" value={pkg.description} />
                  <Detail label="Status" value={pkg.status} />
                </div>
              </>
            ) : (
              <div style={s.emptyInline}>Package details could not be found.</div>
            )}
          </div>
        </div>

      </div>
    </Layout>
  );
}

function Detail({ label, value }) {
  return (
    <div style={s.detail}>
      <div style={s.detailLabel}>{label}</div>
      <div style={s.detailValue}>{value || '—'}</div>
    </div>
  );
}

const s = {
  page: { padding: '32px' },

  backLink: {
    border: 'none',
    background: 'transparent',
    padding: 0,
    color: '#E8650A',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    marginBottom: '16px',
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
  pageSub: { fontSize: '13px', color: '#999' },

  card: {
    background: 'white',
    borderRadius: '12px',
    border: '1px solid #EDE8E0',
    overflow: 'hidden',
    marginBottom: '16px',
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
    fontWeight: '700',
    color: '#1A1A1A',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
  },
  cardBody: { padding: '20px' },

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

  badgeActive: { padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', background: '#F0F7F4', color: '#2D6A4F', whiteSpace: 'nowrap' },
  badgeInactive: { padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', background: '#FEF2F2', color: '#991B1B', whiteSpace: 'nowrap' },
  badgeSuperseded: { padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', background: '#F5F3EF', color: '#666', whiteSpace: 'nowrap' },

  rowLeft: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' },
  rowIcon: {
    width: '36px',
    height: '36px',
    background: '#FFF0E6',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    flexShrink: 0,
  },
  productName: { fontSize: '16px', fontWeight: '700', color: '#1A1A1A' },

  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '18px',
  },
  detail: { minWidth: 0 },
  detailLabel: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#AAA',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '4px',
  },
  detailValue: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#1A1A1A',
    wordBreak: 'break-word',
  },

  editBtn: {
    padding: '7px 12px',
    border: '1.5px solid #EDE8E0',
    borderRadius: '7px',
    fontSize: '12px',
    fontWeight: '600',
    background: '#fff',
    color: '#C4520A',
    cursor: 'pointer',
  },

  emptyInline: { fontSize: '13px', color: '#AAA' },

  primaryBtn: {
    marginTop: '16px',
    padding: '9px 18px',
    background: '#E8650A',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },

  empty: { padding: '60px 24px', textAlign: 'center' },
  emptyIcon: { fontSize: '32px', marginBottom: '12px' },
  emptyText: { fontSize: '14px', fontWeight: '600', color: '#1A1A1A', marginBottom: '6px' },
  emptySub: { fontSize: '13px', color: '#AAA' },
};