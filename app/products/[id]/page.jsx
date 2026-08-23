'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Layout from '../../components/layout.jsx';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id;

  const [user, setUser] = useState(null);
  const [product, setProduct] = useState(null);
  const [packages, setPackages] = useState([]);
  const [ndcs, setNdcs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const meRes = await fetch('/api/me');
        const meData = await meRes.json();
        if (!meData.success || !meData.user) { router.push('/'); return; }
        setUser(meData.user);

        const [productsRes, packagesRes, ndcRes] = await Promise.all([
          fetch('/api/products', { cache: 'no-store' }),
          fetch(`/api/packages?product_id=${productId}`, { cache: 'no-store' }),
          fetch('/api/ndc', { cache: 'no-store' }),
        ]);
        const productsData = await productsRes.json();
        const packagesData = await packagesRes.json();
        const ndcData = await ndcRes.json();

        const foundProduct = (productsData.data || []).find((item) => String(item.id) === String(productId));
        setProduct(foundProduct || null);
        setPackages(packagesData.success ? packagesData.data || [] : []);

        if (foundProduct && ndcData.success) {
          const productNDCs = (ndcData.data || []).filter((item) => {
            const code = item.ndc_code?.split('-')[1];
            return String(code) === String(foundProduct.product_code);
          });
          setNdcs(productNDCs);
        }
      } catch (error) {
        console.error('Error loading product:', error);
      }
      setLoading(false);
    }
    loadData();
  }, [productId, router]);

  if (!user) return null;

  if (loading) {
    return (
      <Layout current="/products">
        <div style={s.center}>Loading product...</div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout current="/products">
        <div style={s.center}>
          <h2 style={s.notFoundTitle}>Product not found</h2>
          <button style={s.button} onClick={() => router.push('/products')}>← Back to Products</button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout current="/products">
      <div style={s.page}>

        <button style={s.breadcrumb} onClick={() => router.push('/products')}>← Products</button>

        {/* Product header */}
        <div style={s.productCard}>
          <div style={s.productIcon}>💊</div>

          <div style={s.productHeaderInfo}>
           <div style={s.titleRow}>
  <h1 style={s.title}>{product.product_name}</h1>

  {product.anda_number && (
    <span style={s.anda}>
     {product.anda_number}
    </span>
  )}
</div>
            <div style={s.generic}>{product.generic_name || product.product_name}</div>
            <div style={s.productCode}>NDC Product Code: <strong>{product.product_code}</strong></div>
          </div>

          <div style={{ ...s.status, ...(product.status === 'Active' ? s.active : s.inactive) }}>
            {product.status || 'Unknown'}
          </div>
        </div>

        {/* Product details */}
        <div style={s.card}>
          <h2 style={s.sectionTitle}>Product Details</h2>
          <div style={s.detailsGrid}>
            <Detail label="Product Code" value={product.product_code} />
            <Detail label="Strength" value={product.strength} />
            <Detail label="Dosage Form" value={product.dosage_form} />
            <Detail label="Rx / OTC" value={product.rx_otc} />
            <Detail label="ANDA Number" value={product.anda_number} />
            <Detail label="Created By" value={product.created_by} />
          </div>
        </div>

        {/* Packages */}
        <div style={s.card}>
          <div style={s.sectionHeader}>
            <div>
              <h2 style={s.sectionTitle}>Packages ({packages.length})</h2>
              <p style={s.sub}>Packages associated with this product</p>
            </div>
          </div>

          {packages.length === 0 ? (
            <div style={s.empty}>No packages have been created for this product yet.</div>
          ) : (
            <div>
              {packages.map((pkg) => (
                <div key={pkg.id} style={s.packageRow} onClick={() => router.push(`/packages/${pkg.id}`)}>
                  <div style={s.packageIcon}>▣</div>
                  <div style={s.packageInfo}>
                    <div style={s.packageName}>
                      {pkg.description || `${pkg.package_size || ''} ${pkg.unit || ''}`}
                    </div>
                    <div style={s.packageMeta}>{pkg.unit || 'Package'} · Code: {pkg.package_code}</div>
                  </div>
                  <div style={s.packageCodeRight}>{product.product_code}-{pkg.package_code}</div>
                  <div style={s.arrow}>→</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* NDCs */}
        <div style={s.card}>
          <h2 style={s.sectionTitle}>NDCs ({ndcs.length})</h2>
          <p style={s.sub}>NDC records generated for this product</p>

          {ndcs.length === 0 ? (
            <div style={s.empty}>No NDC records found.</div>
          ) : (
            ndcs.map((item) => (
              <div key={item.id} style={s.ndcRow} onClick={() => router.push(`/registry/${encodeURIComponent(item.ndc_code)}`)}>
                <div>
                  <div style={s.ndcName}>{item.ndc_code}</div>
                  <div style={s.ndcMeta}>{item.status || 'Unknown'}</div>
                </div>
                <span style={s.arrow}>→</span>
              </div>
            ))
          )}
        </div>

      </div>
    </Layout>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <div style={s.label}>{label}</div>
      <div style={s.value}>{value || '—'}</div>
    </div>
  );
}

const s = {
  page: { maxWidth: '1180px', margin: '0 auto', padding: '32px 36px 60px' },
  breadcrumb: { border: 'none', background: 'transparent', padding: 0, color: '#999', fontSize: '13px', cursor: 'pointer', marginBottom: '20px' },

  productCard: { background: '#FFFFFF', border: '1px solid #EDE8E0', borderRadius: '12px', padding: '28px 30px', display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' },
  productIcon: { width: '64px', height: '64px', borderRadius: '14px', background: '#FFF0E6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', flexShrink: 0 },
  productHeaderInfo: { flex: 1, minWidth: 0 },
  titleRow: { display: 'flex', alignItems: 'center', gap: '12px' },
  title: { margin: 0, fontSize: '26px', fontWeight: '800', color: '#1A1A1A' },
  anda: { background: '#FFF0E6', color: '#C4520A', borderRadius: '999px', padding: '5px 10px', fontSize: '12px', fontWeight: '700' },
  generic: { marginTop: '6px', color: '#999', fontSize: '14px' },
  productCode: { marginTop: '12px', color: '#999', fontSize: '13px' },

  status: { padding: '7px 14px', borderRadius: '999px', fontSize: '13px', fontWeight: '700', whiteSpace: 'nowrap' },
  active: { background: '#F0F7F4', color: '#2D6A4F' },
  inactive: { background: '#FEF2F2', color: '#991B1B' },

  card: { background: '#FFFFFF', border: '1px solid #EDE8E0', borderRadius: '12px', padding: '26px', marginBottom: '20px' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '18px' },
  sectionTitle: { margin: '0 0 18px', color: '#1A1A1A', fontSize: '19px', fontWeight: '700' },
  sub: { color: '#999', fontSize: '13px', marginTop: '4px', marginBottom: '16px' },

  detailsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '22px' },
  label: { fontSize: '11px', color: '#999', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '5px' },
  value: { fontSize: '15px', color: '#1A1A1A', fontWeight: '600' },

  packageRow: { display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 6px', borderTop: '1px solid #F0EBE2', cursor: 'pointer' },
  packageIcon: { width: '40px', height: '40px', borderRadius: '9px', background: '#FFF0E6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C4520A', fontSize: '16px', flexShrink: 0 },
  packageInfo: { flex: 1 },
  packageName: { fontSize: '14px', fontWeight: '600', color: '#1A1A1A' },
  packageMeta: { marginTop: '3px', color: '#999', fontSize: '12px' },
  packageCodeRight: { color: '#666', fontWeight: '600', fontSize: '13px', fontFamily: 'Consolas, monospace' },

  ndcRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #F0EBE2', padding: '15px 6px', cursor: 'pointer' },
  ndcName: { fontSize: '14px', fontWeight: '700', color: '#1A1A1A', fontFamily: 'Consolas, monospace' },
  ndcMeta: { color: '#999', fontSize: '12px', marginTop: '3px' },
  arrow: { color: '#CCC', fontSize: '16px' },

  empty: { color: '#999', fontSize: '13px', padding: '10px 0' },

  center: { minHeight: '60vh', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: '10px', color: '#999' },
  notFoundTitle: { fontSize: '20px', color: '#1A1A1A', margin: 0 },
  button: { border: '1.5px solid #EDE8E0', background: '#FFFFFF', borderRadius: '8px', padding: '9px 16px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#444' },
};