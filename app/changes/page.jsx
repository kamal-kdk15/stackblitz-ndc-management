'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '../components/layout.jsx';

export default function ChangesPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [changes, setChanges] = useState([]);
  const [ndcList, setNdcList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    originalNdc: '',
    changeType: '',
    reason: '',
  });

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) router.push('/');
    else {
      setUser(JSON.parse(stored));
      fetchData();
    }
  }, []);

  async function fetchData() {
    try {
      const res = await fetch('/api/ndc');
      const data = await res.json();
      if (data.success) setNdcList(data.data);
    } catch (e) {
      console.log(e);
    }

    try {
      const res2 = await fetch('/api/changes');
      const data2 = await res2.json();
      if (data2.success) setChanges(data2.data);
    } catch (e) {
      console.log(e);
    }

    setLoading(false);
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);
    setError('');

    const res = await fetch('/api/changes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        requestedBy: user.name,
      }),
    });

    const data = await res.json();
    setSubmitting(false);

    if (!data.success) {
      setError(data.message);
      return;
    }

    setResult(data.data);
    setForm({ originalNdc: '', changeType: '', reason: '' });
    setShowForm(false);
    fetchData();
  }

  async function handleReview(id, status) {
    await fetch('/api/changes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        status,
        reviewedBy: user.name,
      }),
    });
    fetchData();
  }

  const impactInfo = {
    pack: {
      label: 'Packaging Change',
      impact: 'Package Code only',
      color: '#92400E',
      bg: '#FFFBEB',
    },
    strength: {
      label: 'Strength Change',
      impact: 'New Product Code required',
      color: '#991B1B',
      bg: '#FEF2F2',
    },
    name: {
      label: 'Name Change',
      impact: 'New Product Code + ANDA amendment',
      color: '#991B1B',
      bg: '#FEF2F2',
    },
  };

  if (!user) return null;

  return (
    <Layout current="/changes">
      <div style={s.page}>
        <div style={s.pageHead}>
          <div>
            <h1 style={s.pageTitle}>Change Requests</h1>
            <p style={s.pageSub}>
              Manage NDC change scenarios — strength, packaging, name changes.
            </p>
          </div>
          {user.role !== 'Viewer' && (
            <button style={s.primaryBtn} onClick={() => setShowForm(!showForm)}>
              {showForm ? '✕ Cancel' : '+ New Request'}
            </button>
          )}
        </div>

        {/* form... */}
        {showForm && (
          <div style={s.formCard}>
            <div style={s.formCardHead}>
              <div style={s.cardTitle}>Submit Change Request</div>
              <div style={s.cardSub}>
                Select the NDC and type of change required
              </div>
            </div>
            <form onSubmit={handleSubmit} style={s.formBody}>
              <div style={s.formGrid}>
                <div style={s.group}>
                  <label style={s.label}>
                    Select NDC <span style={s.req}>*</span>
                  </label>
                  <select
                    name="originalNdc"
                    value={form.originalNdc}
                    onChange={handleChange}
                    required
                    style={s.input}
                  >
                    <option value="">— Select NDC —</option>
                    {ndcList.map((n, i) => (
                      <option key={i} value={n.ndc_code}>
                        {n.ndc_code} — {n.product_name}
                      </option>
                    ))}
                  </select>
                  <span style={s.hint}>Choose the NDC to modify</span>
                </div>

                <div style={s.group}>
                  <label style={s.label}>
                    Change Type <span style={s.req}>*</span>
                  </label>
                  <select
                    name="changeType"
                    value={form.changeType}
                    onChange={handleChange}
                    required
                    style={s.input}
                  >
                    <option value="">— Select Type —</option>
                    <option value="strength">Strength Change</option>
                    <option value="pack">Packaging Change</option>
                    <option value="name">Name Change</option>
                  </select>
                  <span style={s.hint}>Type of modification required</span>
                </div>

                <div style={{ ...s.group, gridColumn: '1 / -1' }}>
                  <label style={s.label}>
                    Reason for Change <span style={s.req}>*</span>
                  </label>
                  <textarea
                    name="reason"
                    value={form.reason}
                    onChange={handleChange}
                    placeholder="Describe the reason for this change request..."
                    required
                    rows={3}
                    style={s.textarea}
                  />
                </div>
              </div>

              {/* impact... */}
              {form.changeType && (
                <div
                  style={{
                    ...s.impactBox,
                    background: impactInfo[form.changeType].bg,
                    borderColor: impactInfo[form.changeType].color + '40',
                  }}
                >
                  <div style={s.impactLabel}>Impact Assessment</div>
                  <div
                    style={{
                      ...s.impactText,
                      color: impactInfo[form.changeType].color,
                    }}
                  >
                    {impactInfo[form.changeType].label} →{' '}
                    {impactInfo[form.changeType].impact}
                  </div>
                </div>
              )}

              {error && <div style={s.errorBox}>⚠ {error}</div>}

              <div style={s.btnRow}>
                <button
                  type="submit"
                  disabled={submitting}
                  style={s.primaryBtn}
                >
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
                <button
                  type="button"
                  style={s.secondaryBtn}
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* success!! */}
        {result && (
          <div style={s.successBox}>
            ✓ Change request submitted successfully — Impact:{' '}
            <strong>{result.impact}</strong>
          </div>
        )}

        <div style={s.card}>
          <div style={s.cardHead}>
            <span style={s.cardTitle}>All Change Requests</span>
            <span style={s.countBadge}>{changes.length} request(s)</span>
          </div>

          {loading ? (
            <div style={s.empty}>
              <div style={s.emptyText}>Loading...</div>
            </div>
          ) : changes.length === 0 ? (
            <div style={s.empty}>
              <div style={s.emptyIcon}>⇄</div>
              <div style={s.emptyTitle}>No change requests yet</div>
              <div style={s.emptySub}>
                Submit a change request using the button above
              </div>
            </div>
          ) : (
            <div style={s.tableWrap}>
              <table style={s.table}>
                <thead>
                  <tr style={s.thead}>
                    <th style={s.th}>#</th>
                    <th style={s.th}>Original NDC</th>
                    <th style={s.th}>Change Type</th>
                    <th style={s.th}>Impact</th>
                    <th style={s.th}>Reason</th>
                    <th style={s.th}>Status</th>
                    <th style={s.th}>Requested By</th>
                    <th style={s.th}>Reviewed By</th>
                    <th style={s.th}>Date</th>
                    {user.role === 'Admin' && <th style={s.th}>Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {changes.map((c, i) => (
                    <tr key={c.id} style={i % 2 === 0 ? s.trEven : s.trOdd}>
                      <td style={{ ...s.td, color: '#AAA', fontSize: '12px' }}>
                        {i + 1}
                      </td>
                      <td style={s.td}>
                        <span style={s.ndcTag}>{c.originalNdc}</span>
                      </td>
                      <td style={s.td}>
                        <span style={s.changeTypeBadge}>
                          {c.changeType === 'pack'
                            ? 'Packaging'
                            : c.changeType === 'strength'
                            ? 'Strength'
                            : 'Name'}
                        </span>
                      </td>
                      <td style={{ ...s.td, fontSize: '12px', color: '#666' }}>
                        {c.impact}
                      </td>
                      <td
                        style={{
                          ...s.td,
                          fontSize: '12px',
                          color: '#666',
                          maxWidth: '200px',
                        }}
                      >
                        {c.reason}
                      </td>
                      <td style={s.td}>
                        <span
                          style={
                            c.status === 'Approved'
                              ? s.badgeApproved
                              : c.status === 'Rejected'
                              ? s.badgeRejected
                              : s.badgePending
                          }
                        >
                          {c.status}
                        </span>
                      </td>
                      <td style={{ ...s.td, color: '#666' }}>
                        {c.requestedBy}
                      </td>
                      <td style={{ ...s.td, color: '#AAA', fontSize: '12px' }}>
                        {c.reviewedBy || '—'}
                      </td>
                      <td style={{ ...s.td, color: '#AAA', fontSize: '12px' }}>
                        {c.created_at}
                      </td>
                      {user.role === 'Admin' && (
                        <td style={s.td}>
                          {c.status === 'Pending' ? (
                            <div style={s.actionRow}>
                              <button
                                style={s.approveBtn}
                                onClick={() => handleReview(c.id, 'Approved')}
                              >
                                Approve
                              </button>
                              <button
                                style={s.rejectBtn}
                                onClick={() => handleReview(c.id, 'Rejected')}
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span style={{ color: '#AAA', fontSize: '12px' }}>
                              Done
                            </span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
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
    paddingBottom: '20px',
    borderBottom: '1px solid #EDE8E0',
  },
  pageTitle: {
    fontSize: '25px',
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: '3px',
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
    borderRadius: '7px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  secondaryBtn: {
    padding: '9px 16px',
    background: 'white',
    color: '#777',
    border: '1.5px solid #EDE8E0',
    borderRadius: '7px',
    fontSize: '13px',
    cursor: 'pointer',
  },
  formCard: {
    background: 'white',
    borderRadius: '12px',
    border: '1px solid #EDE8E0',
    overflow: 'hidden',
    marginBottom: '20px',
  },
  formCardHead: {
    padding: '16px 20px',
    borderBottom: '1px solid #EDE8E0',
  },
  formBody: {
    padding: '20px',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    marginBottom: '16px',
  },
  group: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  },
  label: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#444',
    letterSpacing: '0.2px',
  },
  req: { color: '#DC2626' },
  input: {
    padding: '9px 12px',
    border: '1.5px solid #EDE8E0',
    borderRadius: '7px',
    fontSize: '13px',
    background: '#FAF8F5',
    outline: 'none',
    width: '100%',
    color: '#1A1A1A',
  },
  textarea: {
    padding: '9px 12px',
    border: '1.5px solid #EDE8E0',
    borderRadius: '7px',
    fontSize: '13px',
    background: '#FAF8F5',
    outline: 'none',
    width: '100%',
    color: '#1A1A1A',
    resize: 'vertical',
    fontFamily: 'Segoe UI, system-ui, sans-serif',
  },
  hint: {
    fontSize: '11px',
    color: '#AAA',
  },
  impactBox: {
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid',
    marginBottom: '16px',
  },
  impactLabel: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#AAA',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '4px',
  },
  impactText: {
    fontSize: '13px',
    fontWeight: '600',
  },
  errorBox: {
    padding: '11px 14px',
    background: '#FEF2F2',
    border: '1px solid #FECACA',
    borderRadius: '7px',
    color: '#991B1B',
    fontSize: '13px',
    marginBottom: '14px',
  },
  btnRow: {
    display: 'flex',
    gap: '10px',
    paddingTop: '16px',
    borderTop: '1px solid #EDE8E0',
  },
  successBox: {
    padding: '12px 16px',
    background: '#FFF0E6',
    border: '1px solid #F5C4A0',
    borderRadius: '8px',
    color: '#C4520A',
    fontSize: '13px',
    fontWeight: '500',
    marginBottom: '20px',
  },
  card: {
    background: 'white',
    borderRadius: '12px',
    border: '1px solid #EDE8E0',
    overflow: 'hidden',
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
    fontWeight: '600',
    color: '#1A1A1A',
  },
  cardSub: {
    fontSize: '12px',
    color: '#999',
    marginTop: '2px',
  },
  countBadge: {
    fontSize: '12px',
    color: '#AAA',
  },
  tableWrap: { overflowX: 'auto' },
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
  ndcTag: {
    fontFamily: 'Consolas, monospace',
    fontSize: '12px',
    fontWeight: '700',
    color: '#C4520A',
    background: '#FFF0E6',
    padding: '3px 8px',
    borderRadius: '4px',
  },
  changeTypeBadge: {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: '700',
    background: '#FAF8F5',
    color: '#666',
    border: '1px solid #EDE8E0',
  },
  badgeApproved: {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: '700',
    background: '#F0F7F4',
    color: '#2D6A4F',
  },
  badgeRejected: {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: '700',
    background: '#FEF2F2',
    color: '#991B1B',
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
  actionRow: {
    display: 'flex',
    gap: '6px',
  },
  approveBtn: {
    padding: '4px 10px',
    background: '#F0F7F4',
    color: '#2D6A4F',
    border: '1px solid #A3D9B1',
    borderRadius: '5px',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  rejectBtn: {
    padding: '4px 10px',
    background: '#FEF2F2',
    color: '#991B1B',
    border: '1px solid #FECACA',
    borderRadius: '5px',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  empty: {
    padding: '48px 24px',
    textAlign: 'center',
  },
  emptyIcon: {
    fontSize: '28px',
    marginBottom: '10px',
    color: '#DDD',
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
  },
};
