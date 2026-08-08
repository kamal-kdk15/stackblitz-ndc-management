'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '../components/layout.jsx';

export default function NDCPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    product: '',
    strength: '',
    dosage: '',
    rxOtc: '',
    anda: '',
    distributor: '',
    packs: 1,
  });

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) router.push('/');
    else setUser(JSON.parse(stored));
  }, []);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError('');

    const res = await fetch('/api/ndc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        createdBy: user.name,
        role: user.role,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!data.success) {
      setError(data.message);
      return;
    }

    setResult(data.ndcCodes);
    setForm({
      product: '',
      strength: '',
      dosage: '',
      rxOtc: '',
      anda: '',
      distributor: '',
      packs: 1,
    });
  }

  if (!user) return null;

  return (
    <Layout current="/ndc">
      <div style={s.page}>
        <div style={s.pageHead}>
          <div>
            <h1 style={s.pageTitle}>Create NDC Request</h1>
            <p style={s.pageSub}>
              Generate a new National Drug Code — Sun Pharma Industries Ltd.
            </p>
          </div>
        </div>

        {user.role === 'Viewer' ? (
          <div style={s.accessDenied}>
            🛇 Access Denied — Viewers cannot create NDC requests. Contact your
            administrator.
          </div>
        ) : (
          <div style={s.grid}>
            <div style={s.card}>
              <div style={s.cardHead}>
                <div style={s.cardTitle}>Drug Product Information</div>
                <div style={s.cardSub}>All fields marked * are mandatory</div>
              </div>

              <form onSubmit={handleSubmit} style={s.cardBody}>
                <div style={s.ruleHint}>
                  <span style={s.ruleIcon}>ℹ</span>
                  <span>
                    <strong>Business Rule:</strong> Change in product name,
                    strength, or dosage form requires a new Product Code.
                    Packaging changes only require a new Package Code.
                  </span>
                </div>
                <div style={s.formGrid}>
                  <div style={s.group}>
                    <label style={s.label}>
                      Product Name <span style={s.req}>*</span>
                    </label>
                    <input
                      name="product"
                      value={form.product}
                      onChange={handleChange}
                      placeholder="e.g. Paracetamol"
                      required
                      style={s.input}
                    />
                    <span style={s.hint}>Generic or brand name</span>
                  </div>

                  <div style={s.group}>
                    <label style={s.label}>
                      Strength <span style={s.req}>*</span>
                    </label>
                    <input
                      name="strength"
                      value={form.strength}
                      onChange={handleChange}
                      placeholder="e.g. 500 mg"
                      required
                      style={s.input}
                    />
                    <span style={s.hint}>Include unit — mg, ml, %</span>
                  </div>

                  <div style={s.group}>
                    <label style={s.label}>
                      Dosage Form <span style={s.req}>*</span>
                    </label>
                    <select
                      name="dosage"
                      value={form.dosage}
                      onChange={handleChange}
                      required
                      style={s.input}
                    >
                      <option value="">— Select —</option>
                      <option value="Tablet">Tablet</option>
                      <option value="Capsule">Capsule</option>
                      <option value="Syrup">Syrup</option>
                      <option value="Injection">Injection</option>
                      <option value="Cream">Cream</option>
                      <option value="Ointment">Ointment</option>
                      <option value="Drops">Drops</option>
                      <option value="Patch">Patch</option>
                      <option value="Inhaler">Inhaler</option>
                      <option value="Suspension">Suspension</option>
                      <option value="Powder">Powder</option>
                      <option value="Gel">Gel</option>
                    </select>
                    <span style={s.hint}>Physical form of the product</span>
                  </div>

                  <div style={s.group}>
                    <label style={s.label}>
                      Rx / OTC <span style={s.req}>*</span>
                    </label>
                    <select
                      name="rxOtc"
                      value={form.rxOtc}
                      onChange={handleChange}
                      required
                      style={s.input}
                    >
                      <option value="">— Select —</option>
                      <option value="Rx">Rx</option>
                      <option value="OTC">OTC</option>
                    </select>
                    <span style={s.hint}>Prescription or Over-the-Counter</span>
                  </div>

                  <div style={s.group}>
                    <label style={s.label}>
                      ANDA Number <span style={s.req}>*</span>
                    </label>
                    <input
                      name="anda"
                      value={form.anda}
                      onChange={handleChange}
                      placeholder="e.g. ANDA12345"
                      required
                      style={s.input}
                    />
                    <span style={s.hint}>Abbreviated New Drug Application</span>
                  </div>

                  <div style={s.group}>
                    <label style={s.label}>Distributor</label>
                    <input
                      name="distributor"
                      value={form.distributor}
                      onChange={handleChange}
                      placeholder="Optional"
                      style={s.input}
                    />
                    <span style={s.hint}>Leave blank if self-distributed</span>
                  </div>

                  <div style={s.group}>
                    <label style={s.label}>
                      Package Variants <span style={s.req}>*</span>
                    </label>
                    <input
                      name="packs"
                      type="number"
                      min="1"
                      value={form.packs}
                      onChange={handleChange}
                      required
                      style={{ ...s.input, maxWidth: '100px' }}
                    />
                    <span style={s.hint}>Number of package sizes</span>
                  </div>
                </div>

                <div style={s.btnRow}>
                  <button type="submit" disabled={loading} style={s.btnPrimary}>
                    {loading ? 'Generating...' : 'Generate NDC'}
                  </button>
                  <button
                    type="button"
                    style={s.btnSecondary}
                    onClick={() =>
                      setForm({
                        product: '',
                        strength: '',
                        dosage: '',
                        rxOtc: '',
                        anda: '',
                        distributor: '',
                        packs: 1,
                      })
                    }
                  >
                    Clear
                  </button>
                </div>

                {error && <div style={s.errorBox}>⚠︎ {error}</div>}
              </form>
            </div>

            <div style={s.rightCol}>
              {/* ndc result...*/}
              <div style={s.card}>
                <div style={s.cardHead}>
                  <div style={s.cardTitle}>NDC Assignment</div>
                  <div style={s.cardSub}>Generated codes appear here</div>
                </div>
                <div style={s.cardBody}>
                  {!result ? (
                    <div style={s.resultEmpty}>
                      <div style={s.resultEmptyIcon}>◎</div>
                      <div style={s.resultEmptyText}>Awaiting submission</div>
                      <div style={s.resultEmptySub}>
                        Fill the form and click Generate NDC
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={s.successLabel}>✓ Generated Successfully</div>
                      {result.map((ndc, i) => (
                        <div key={i} style={s.ndcRow}>
                          <span style={s.ndcChip}>{ndc}</span>
                        </div>
                      ))}
                      <button
                        style={{
                          ...s.btnPrimary,
                          width: '100%',
                          marginTop: '16px',
                        }}
                        onClick={() => router.push('/registry')}
                      >
                        View in Registry →
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div style={s.infoCard}>
                <div style={s.infoTitle}>NDC Format</div>
                <div style={s.infoCode}>70095 — XXX — XX</div>
                <div style={s.infoRows}>
                  <div style={s.infoRow}>
                    <span style={s.infoKey}>Labeler</span>
                    <span style={s.infoVal}>70095 (Sun Pharma)</span>
                  </div>
                  <div style={s.infoRow}>
                    <span style={s.infoKey}>Product</span>
                    <span style={s.infoVal}>3-digit auto code</span>
                  </div>
                  <div style={s.infoRow}>
                    <span style={s.infoKey}>Package</span>
                    <span style={s.infoVal}>2-digit per variant</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

const s = {
  page: {
    padding: '32px',
  },
  pageHead: {
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
  accessDenied: {
    padding: '20px',
    background: '#FEF2F2',
    border: '1px solid #FECACA',
    borderRadius: '10px',
    color: '#991B1B',
    fontSize: '14px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 300px',
    gap: '20px',
    alignItems: 'start',
  },
  card: {
    background: 'white',
    borderRadius: '12px',
    border: '1px solid #E8E3D9',
    overflow: 'hidden',
  },
  cardHead: {
    padding: '16px 20px',
    borderBottom: '1px solid #E2E6E1',
  },
  cardTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: '2px',
  },
  cardSub: {
    fontSize: '12px',
    color: '#999',
  },
  cardBody: {
    padding: '20px',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
  },
  group: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  },
  label: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#374151',
    letterSpacing: '0.2px',
  },
  req: { color: '#DC2626' },
  input: {
    padding: '9px 12px',
    border: '1.5px solid #E8E3D9',
    borderRadius: '7px',
    fontSize: '13px',
    background: '#FAF8F5',
    outline: 'none',
    width: '100%',
    color: '#1A1A1A',
  },
  hint: {
    fontSize: '11px',
    color: '#94A3B8',
  },
  btnRow: {
    display: 'flex',
    gap: '10px',
    marginTop: '20px',
    paddingTop: '16px',
    borderTop: '1px solid #EDE8E0',
  },
  btnPrimary: {
    padding: '10px 20px',
    background: '#C4520A',
    color: 'white',
    border: 'none',
    borderRadius: '7px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  btnSecondary: {
    padding: '10px 16px',
    background: 'white',
    color: '#777',
    border: '1.5px solid #EDE8E0',
    borderRadius: '7px',
    fontSize: '13px',
    cursor: 'pointer',
  },
  errorBox: {
    marginTop: '14px',
    padding: '12px 14px',
    background: '#FEF2F2',
    border: '1px solid #FECACA',
    borderRadius: '7px',
    color: '#991B1B',
    fontSize: '13px',
  },
  rightCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  resultEmpty: {
    padding: '32px 16px',
    textAlign: 'center',
  },
  resultEmptyIcon: {
    fontSize: '28px',
    color: '#DDD',
    marginBottom: '10px',
  },
  resultEmptyText: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1C2B2B',
    marginBottom: '4px',
  },
  resultEmptySub: {
    fontSize: '12px',
    color: '#6B7C7A',
  },
  successLabel: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#C4520A',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '12px',
  },
  ndcRow: {
    marginBottom: '8px',
  },
  ndcChip: {
    display: 'inline-block',
    fontFamily: 'Consolas, monospace',
    fontSize: '14px',
    fontWeight: '700',
    color: '#C4520A',
    background: '#FFF0E6',
    border: '1.5px solid #F5C4A0',
    padding: '6px 14px',
    borderRadius: '6px',
    letterSpacing: '1px',
  },
  infoCard: {
    background: '#1A1A1A',
    borderRadius: '12px',
    padding: '20px',
  },
  infoTitle: {
    fontSize: '12px',
    fontWeight: '700',
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginBottom: '10px',
  },
  infoCode: {
    fontFamily: 'Consolas, monospace',
    fontSize: '18px',
    fontWeight: '700',
    color: 'white',
    marginBottom: '16px',
    letterSpacing: '2px',
  },
  infoRows: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
  },
  infoKey: {
    color: 'rgba(255,255,255,0.5)',
  },
  infoVal: {
    color: 'white',
    fontWeight: '500',
    fontSize: '12px',
  },
  ruleHint: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    padding: '12px 14px',
    background: '#FFF0E6',
    border: '1px solid #F5C4A0',
    borderRadius: '8px',
    fontSize: '12px',
    color: '#7B3A10',
    marginBottom: '20px',
    lineHeight: '1.6',
  },
  ruleIcon: {
    fontSize: '14px',
    flexShrink: 0,
    marginTop: '1px',
  },
};
