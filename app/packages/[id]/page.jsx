'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Layout from '../../components/layout.jsx';

export default function PackageDetailPage() {
  const params = useParams();
  const router = useRouter();

  const packageId = params.id;

  const [user, setUser] = useState(null);
  const [pkg, setPkg] = useState(null);
  const [product, setProduct] = useState(null);
  const [ndcs, setNdcs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

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

        const [packagesRes, productsRes, ndcRes] = await Promise.all([
          fetch('/api/packages', { cache: 'no-store' }),
          fetch('/api/products', { cache: 'no-store' }),
          fetch('/api/ndc', { cache: 'no-store' }),
        ]);

        const packagesData = await packagesRes.json();
        const productsData = await productsRes.json();
        const ndcData = await ndcRes.json();

        // Find package
        const foundPackage = (packagesData.data || []).find(
          (item) => String(item.id) === String(packageId)
        );

        if (!foundPackage) {
          setLoading(false);
          return;
        }

        setPkg(foundPackage);

        // Find associated product
        const foundProduct = (productsData.data || []).find(
          (item) => String(item.id) === String(foundPackage.product_id)
        );

        setProduct(foundProduct || null);

        // Find NDCs associated with this package
        if (foundProduct && ndcData.success) {
          const productCode = String(foundProduct.product_code);
          const packageCode = String(foundPackage.package_code);

          const matchingNDCs = (ndcData.data || []).filter((item) => {
            const parts = item.ndc_code?.split('-');

            return (
              String(parts?.[1]) === productCode &&
              String(parts?.[2]) === packageCode
            );
          });

          setNdcs(matchingNDCs);
        }
      } catch (error) {
        console.error('Error loading package:', error);
      }

      setLoading(false);
    }

    loadData();
  }, [packageId, router]);

  if (!user) return null;

  if (loading) {
    return (
      <Layout current="/packages">
        <div style={s.center}>
          Loading package...
        </div>
      </Layout>
    );
  }

  if (!pkg) {
    return (
      <Layout current="/packages">
        <div style={s.center}>
          <div style={s.notFoundIcon}>📦</div>

          <h2 style={s.notFoundTitle}>
            Package not found
          </h2>

          <button
            style={s.primaryBtn}
            onClick={() => router.push('/packages')}
          >
            ← Back to Packages
          </button>
        </div>
      </Layout>
    );
  }

  // First matching NDC for this package
  const ndc = ndcs[0] || null;

  const fullNdc = ndc?.ndc_code || null;
const primaryNdc = ndcs[0] || null;
  const ndcParts = fullNdc
    ? fullNdc.split('-')
    : [];

  const labelerCode = ndcParts[0] || '—';
  const productCode = ndcParts[1] || product?.product_code || '—';
  const packageCode = ndcParts[2] || pkg.package_code || '—';

  async function handleCopy() {
    if (!fullNdc) return;

    try {
      await navigator.clipboard.writeText(fullNdc);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch (error) {
      console.error('Failed to copy NDC:', error);
    }
  }

  return (
    <Layout current="/packages">

      <div style={s.page}>

        {/* =========================
            BREADCRUMB
        ========================== */}

        <button
          style={s.breadcrumb}
          onClick={() => router.push('/packages')}
        >
          ← Packages
        </button>


        
<div style={s.packageHero}>
  <div style={s.heroTop}>
    <div style={s.heroInfo}>
      <div style={s.heroEyebrow}>PACKAGE</div>

      <h1 style={s.heroTitle}>
        Package {pkg.package_code}
      </h1>

      <div style={s.heroDescription}>
        {pkg.description ||
          `${pkg.package_size || ''} ${pkg.unit || ''}`}
      </div>
    </div>

    <div
      style={{
        ...s.status,
        ...(pkg.status === 'Active' ? s.active : s.inactive),
      }}
    >
      {pkg.status || 'Unknown'}
    </div>
  </div>

  <div style={s.heroDivider} />

  <div style={s.ndcHero}>
    <div>
      <div style={s.heroEyebrow}>NATIONAL DRUG CODE</div>

      <div style={s.ndcCode}>
        {primaryNdc?.ndc_code || fullNdc || '—'}
      </div>

      <div style={s.ndcMeta}>
        Labeler <strong>{primaryNdc?.ndc_code?.split('-')[0] || '70095'}</strong>
        <span> · </span>
        Product Code <strong>
          {primaryNdc?.ndc_code?.split('-')[1] || product?.product_code || '—'}
        </strong>
        <span> · </span>
        Package Code <strong>{pkg.package_code}</strong>
      </div>
    </div>

    <button
      style={s.copyButton}
      onClick={() => {
        const code = primaryNdc?.ndc_code || fullNdc;
        if (code) {
          navigator.clipboard.writeText(code);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }
      }}
    >
      {copied ? 'Copied' : 'Copy NDC'}
    </button>
  </div>
</div>


        {/* =========================
            PACKAGE OVERVIEW
        ========================== */}

        <div style={s.card}>

          <div style={s.cardHeader}>

            <div>
              <h2 style={s.cardTitle}>
                Package Overview
              </h2>

              <p style={s.cardSub}>
                Package information associated with this NDC
              </p>
            </div>

          </div>


          <div style={s.cardBody}>

            <div style={s.overviewGrid}>

              <OverviewItem
                icon="📦"
                label="PACKAGE"
                value={
                  pkg.description ||
                  `${pkg.package_size || ''} ${pkg.unit || ''}`
                }
              />

              <OverviewItem
                icon="#"
                label="PACKAGE CODE"
                value={pkg.package_code}
              />

              <OverviewItem
                icon="▣"
                label="SIZE"
                value={pkg.package_size || '—'}
              />

              <OverviewItem
                icon="◌"
                label="UNIT"
                value={pkg.unit || '—'}
              />

            </div>

          </div>

        </div>


        {/* =========================
            TWO COLUMN AREA
        ========================== */}

        <div style={s.twoColumn}>


          {/* =========================
              PACKAGE DETAILS
          ========================== */}

          <div style={s.card}>

            <div style={s.cardHeader}>

              <div>
                <h2 style={s.cardTitle}>
                  Package Details
                </h2>

                <p style={s.cardSub}>
                  Detailed package master information
                </p>
              </div>

            </div>


            <div style={s.cardBody}>

              <div style={s.detailsGrid}>

                <Detail
                  label="Description"
                  value={pkg.description}
                />

                <Detail
                  label="Package Code"
                  value={pkg.package_code}
                />

                <Detail
                  label="Size"
                  value={pkg.package_size}
                />

                <Detail
                  label="Unit"
                  value={pkg.unit}
                />

                <Detail
                  label="Status"
                  value={pkg.status}
                />

                <Detail
                  label="Created By"
                  value={pkg.created_by}
                />

              </div>

            </div>

          </div>


          {/* =========================
              PRODUCT
          ========================== */}

          <div style={s.card}>

            <div style={s.cardHeader}>

              <div>
                <h2 style={s.cardTitle}>
                  Product
                </h2>

                <p style={s.cardSub}>
                  Product associated with this package
                </p>
              </div>

              {product && (
                <button
                  style={s.outlineBtn}
                  onClick={() =>
                    router.push(`/products/${product.id}`)
                  }
                >
                  View Product →
                </button>
              )}

            </div>


            <div style={s.cardBody}>

              {product ? (
                <>

                  <div style={s.productHeader}>

                    <div style={s.productIcon}>
                      💊
                    </div>

                    <div style={s.productHeaderInfo}>

                      <div style={s.productName}>
                        {product.product_name}
                      </div>

                      <div style={s.productGeneric}>
                        {product.generic_name ||
                          product.product_name}
                      </div>

                    </div>

                  </div>


                  <div style={s.detailsGrid}>

                    <Detail
                      label="Product Code"
                      value={product.product_code}
                    />

                    <Detail
                      label="Strength"
                      value={product.strength}
                    />

                    <Detail
                      label="Dosage Form"
                      value={product.dosage_form}
                    />

                    <Detail
                      label="Rx / OTC"
                      value={product.rx_otc}
                    />

                    <Detail
                      label="ANDA Number"
                      value={product.anda_number}
                    />

                    <Detail
                      label="Status"
                      value={product.status}
                    />

                  </div>

                </>
              ) : (

                <div style={s.emptyInline}>
                  Associated product could not be found.
                </div>

              )}

            </div>

          </div>

        </div>


        {/* =========================
            NDC RECORDS
        ========================== */}

        <div style={s.card}>

          <div style={s.cardHeader}>

            <div>
              <h2 style={s.cardTitle}>
                NDC Records ({ndcs.length})
              </h2>

              <p style={s.cardSub}>
                NDC records generated for this package
              </p>
            </div>

          </div>


          <div style={s.cardBody}>

            {ndcs.length === 0 ? (

              <div style={s.emptyInline}>
                No NDC records found for this package.
              </div>

            ) : (

              ndcs.map((item, index) => (

                <div
                  key={item.id}
                  style={{
                    ...s.ndcRow,
                    borderTop:
                      index === 0
                        ? 'none'
                        : '1px solid #F0EBE2',
                  }}
                  onClick={() =>
                    router.push(
                      `/registry/${encodeURIComponent(
                        item.ndc_code
                      )}`
                    )
                  }
                >

                  <div style={s.ndcRowLeft}>

                    <div style={s.ndcIcon}>
                      #
                    </div>

                    <div>

                      <div style={s.ndcRowCode}>
                        {item.ndc_code}
                      </div>

                      <div style={s.ndcRowMeta}>
                        {item.status || 'Unknown'}
                      </div>

                    </div>

                  </div>

                  <span style={s.arrow}>
                    →
                  </span>

                </div>

              ))

            )}

          </div>

        </div>

      </div>

    </Layout>
  );
}


/* =====================================================
   SMALL REUSABLE COMPONENTS
===================================================== */

function Detail({ label, value }) {
  return (
    <div style={s.detail}>

      <div style={s.detailLabel}>
        {label}
      </div>

      <div style={s.detailValue}>
        {value || '—'}
      </div>

    </div>
  );
}


function OverviewItem({ icon, label, value }) {
  return (
    <div style={s.overviewItem}>

      <div style={s.overviewIcon}>
        {icon}
      </div>

      <div style={s.overviewText}>

        <div style={s.detailLabel}>
          {label}
        </div>

        <div style={s.detailValue}>
          {value}
        </div>

      </div>

    </div>
  );
}


/* =====================================================
   STYLES
===================================================== */

const s = {

  page: {
    maxWidth: '1220px',
    margin: '0 auto',
    padding: '32px 36px 60px',
  },


  /* =========================
     BREADCRUMB
  ========================== */

  breadcrumb: {
    border: 'none',
    background: 'transparent',
    padding: 0,
    color: '#C4520A',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    marginBottom: '20px',
  },


  /* =========================
     HERO
  ========================== */

 packageHero: {
  background: '#FFFFFF',
  border: '1px solid #EDE8E0',
  borderRadius: '14px',
  padding: '30px 34px',
  marginBottom: '22px',
},

heroTop: {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: '24px',
},

heroInfo: {
  minWidth: 0,
  flex: 1,
},

heroEyebrow: {
  fontSize: '12px',
  fontWeight: '800',
  letterSpacing: '1.4px',
  color: '#718096',
  marginBottom: '8px',
},

heroTitle: {
  margin: 0,
  fontSize: '26px',
  lineHeight: '1.25',
  fontWeight: '800',
  color: '#1A1A1A',
},

  heroCode: {
    marginTop: '7px',
    fontSize: '13px',
    color: '#718096',
  },

heroDescription: {
  marginTop: '7px',
  fontSize: '14px',
  lineHeight: '1.5',
  color: '#999',
  maxWidth: '650px',
  overflowWrap: 'anywhere',
},

heroDivider: {
  height: '1px',
  background: '#F0EBE2',
  margin: '24px 0',
},

  /* =========================
     STATUS
  ========================== */

  status: {
    padding: '8px 15px',
    borderRadius: '999px',
    fontSize: '13px',
    fontWeight: '700',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },

  active: {
    background: '#F0F7F4',
    color: '#2D6A4F',
  },

  inactive: {
    background: '#FEF2F2',
    color: '#991B1B',
  },


  /* =========================
     NDC HERO
  ========================== */

 ndcHero: {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '24px',
},

ndcCode: {
  fontSize: '30px',
  fontWeight: '800',
  letterSpacing: '1px',
  color: '#151515',
  fontFamily: 'Consolas, monospace',
},

ndcMeta: {
  marginTop: '9px',
  color: '#718096',
  fontSize: '13px',
},

copyButton: {
  border: '1px solid #E6D6CB',
  background: '#FFFFFF',
  color: '#C4520A',
  borderRadius: '9px',
  padding: '10px 17px',
  fontSize: '13px',
  fontWeight: '700',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
},
  copyButtonCopied: {
    background: '#FFF0E6',
    color: '#C4520A',
  },


  /* =========================
     CARDS
  ========================== */

  card: {
    background: '#FFFFFF',
    border: '1px solid #EDE8E0',
    borderRadius: '14px',
    overflow: 'hidden',
    marginBottom: '22px',
  },

  cardHeader: {
    padding: '22px 28px',
    borderBottom: '1px solid #F0EBE2',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '20px',
  },

  cardTitle: {
    margin: 0,
    color: '#1A1A1A',
    fontSize: '19px',
    fontWeight: '700',
  },

  cardSub: {
    margin: '5px 0 0',
    color: '#999',
    fontSize: '13px',
  },

  cardBody: {
    padding: '26px 28px',
  },


  /* =========================
     OVERVIEW
  ========================== */

  overviewGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: '24px',
  },

  overviewItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '13px',
    minWidth: 0,
  },

  overviewText: {
    minWidth: 0,
  },

  overviewIcon: {
    width: '42px',
    height: '42px',
    borderRadius: '10px',
    background: '#FFF0E6',
    color: '#C4520A',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    fontWeight: '700',
    flexShrink: 0,
  },


  /* =========================
     TWO COLUMN
  ========================== */

  twoColumn: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '22px',
    alignItems: 'stretch',
  },


  /* =========================
     DETAILS
  ========================== */

  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '26px 24px',
  },

  detail: {
    minWidth: 0,
  },

  detailLabel: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '6px',
  },

  detailValue: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#1A1A1A',
    wordBreak: 'break-word',
    overflowWrap: 'anywhere',
  },


  /* =========================
     PRODUCT
  ========================== */

  productHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    marginBottom: '25px',
    paddingBottom: '20px',
    borderBottom: '1px solid #F0EBE2',
  },

  productHeaderInfo: {
    minWidth: 0,
  },

  productIcon: {
    width: '52px',
    height: '52px',
    borderRadius: '12px',
    background: '#FFF0E6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '23px',
    flexShrink: 0,
  },

  productName: {
    fontSize: '19px',
    fontWeight: '700',
    color: '#1A1A1A',
  },

  productGeneric: {
    marginTop: '4px',
    fontSize: '13px',
    color: '#999',
  },

  outlineBtn: {
    padding: '9px 14px',
    border: '1px solid #E0D9D0',
    borderRadius: '8px',
    background: '#FFFFFF',
    color: '#C4520A',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },


  /* =========================
     NDC RECORDS
  ========================== */

  ndcRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '17px 5px',
    cursor: 'pointer',
    transition: 'background 0.15s ease',
  },

  ndcRowLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '13px',
  },

  ndcIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '9px',
    background: '#FFF0E6',
    color: '#C4520A',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: '800',
    flexShrink: 0,
  },

  ndcRowCode: {
    fontFamily: 'Consolas, monospace',
    fontSize: '14px',
    fontWeight: '700',
    color: '#1A1A1A',
  },

  ndcRowMeta: {
    color: '#999',
    fontSize: '12px',
    marginTop: '4px',
  },

  arrow: {
    color: '#B8B8B8',
    fontSize: '18px',
  },


  /* =========================
     EMPTY / ERROR
  ========================== */

  emptyInline: {
    fontSize: '13px',
    color: '#999',
    padding: '10px 0',
  },

  center: {
    minHeight: '60vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
    gap: '10px',
    color: '#999',
  },

  notFoundIcon: {
    fontSize: '35px',
  },

  notFoundTitle: {
    fontSize: '20px',
    color: '#1A1A1A',
    margin: 0,
  },

  primaryBtn: {
    marginTop: '8px',
    padding: '10px 18px',
    background: '#E8650A',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
};