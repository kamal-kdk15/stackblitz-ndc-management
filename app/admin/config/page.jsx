'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '../../components/layout.jsx';

export default function AdminConfigPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [config, setConfig] = useState(null);
  const [labelerCode, setLabelerCode] = useState('');
  const [maxProductCode, setMaxProductCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetch('/api/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user) {
          if (data.user.role !== 'Admin') {
            router.push('/dashboard');
            return;
          }
          setCurrentUser(data.user);
          fetchConfig();
          fetchHistory();
        } else {
          router.push('/');
        }
      })
      .catch(() => router.push('/'));
  }, []);

  async function fetchConfig() {
    try {
      const res = await fetch('/api/admin/config', { cache: 'no-store' });
      const data = await res.json();
      if (data.success && data.data) {
        setConfig(data.data);
        setLabelerCode(data.data.labelerCode);
        setMaxProductCode(String(data.data.maxProductCode));
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  async function fetchHistory() {
    try {
      const res = await fetch('/api/audit', { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        const configChanges = (data.data || [])
          .filter((entry) => entry.action === 'SYSTEM_CONFIG_UPDATED')
          .slice(0, 5);
        setHistory(configChanges);
      }
    } catch (e) {
      console.error(e);
    }
  }

  function formatChange(newValueStr) {
    try {
      const parsed = JSON.parse(newValueStr);
      const parts = [];
      if (parsed.labeler_code) parts.push(`Labeler → ${parsed.labeler_code}`);
      if (parsed.max_product_code) parts.push(`Max code → ${parsed.max_product_code}`);
      return parts.join(' · ') || 'Configuration updated';
    } catch {
      return 'Configuration updated';
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          labeler_code: labelerCode,
          max_product_code: Number(maxProductCode)
        })
      });
      const result = await res.json();
      if (!res.ok) {
        setMessage({ type: 'error', text: result.message || 'Failed to save' });
        return;
      }
      setMessage({ type: 'success', text: 'Settings saved successfully' });
      await fetchConfig();
      await fetchHistory();
    } catch (e) {
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  }

  if (!currentUser || loading) return null;

  return (
    <Layout current="/admin/config">
      <div style={s.page}>
        <div style={s.pageHead}>
          <div>
            <h1 style={s.pageTitle}>System Configuration</h1>
            <p style={s.pageSub}>Labeler code and product code range — Sun Pharma Industries Ltd.</p>
          </div>
        </div>

        <div style={s.configLayout}>

          {/* Main Configuration */}
          <div style={s.card}>
            <div style={s.cardHeader}>
              <div>
                <h2 style={s.cardTitle}>NDC Generation Settings</h2>
                <p style={s.cardSub}>
                  Configure the identifier range used when generating new NDCs.
                </p>
              </div>
            </div>

            <form onSubmit={handleSave} style={s.formGrid}>

              <div style={s.fieldsRow}>

                <div style={s.field}>
                  <label style={s.label}>Labeler Code</label>

                  <input
                    value={labelerCode}
                    onChange={(e) => setLabelerCode(e.target.value)}
                    style={s.input}
                    placeholder="70095"
                  />

                  <span style={s.helper}>
                    4–6 digit FDA-assigned labeler code.
                    Changing this affects new NDC generation only.
                  </span>
                </div>

                <div style={s.field}>
                  <label style={s.label}>Max Product Code</label>

                  <input
                    type="number"
                    min="1"
                    max="999"
                    value={maxProductCode}
                    onChange={(e) => setMaxProductCode(e.target.value)}
                    style={s.input}
                    placeholder="999"
                  />

                  <span style={s.helper}>
                    Highest sequential product code allowed under
                    this labeler.
                  </span>
                </div>

              </div>

              {/* Preview */}
              <div style={s.previewBox}>
                <div>
                  <div style={s.previewLabel}>
                    Current NDC Range
                  </div>

                  <div style={s.previewValue}>
                    {labelerCode || '-----'}-001
                    <span style={s.previewArrow}>→</span>
                    {labelerCode || '-----'}-
                    {String(maxProductCode || '999').padStart(3, '0')}
                  </div>
                </div>

                <div style={s.previewHint}>
                  Product codes are generated sequentially
                  within this range.
                </div>
              </div>

              {/* Metadata */}
              {config?.updatedBy && (
                <div style={s.metaRow}>
                  <div>
                    <span style={s.metaLabel}>Last updated by</span>
                    <span>{config.updatedBy}</span>
                  </div>

                  <div>
                    <span style={s.metaLabel}>Updated</span>
                    <span>
                      {new Date(config.updatedAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {message && (
                <div
                  style={
                    message.type === 'error'
                      ? s.errorBox
                      : s.successBox
                  }
                >
                  {message.text}
                </div>
              )}

              <div style={s.footer}>
                <button
                  type="submit"
                  style={s.saveBtn}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>

            </form>
          </div>


          {/* Side information */}
          <div style={s.infoCard}>

            <div style={s.infoIcon}>⚙</div>

            <h3 style={s.infoTitle}>
              Configuration Scope
            </h3>

            <p style={s.infoText}>
              These settings control how new NDC numbers are
              generated in the system.
            </p>

            <div style={s.infoItem}>
              <span>Labeler</span>
              <strong>{labelerCode || '—'}</strong>
            </div>

            <div style={s.infoItem}>
              <span>Product codes</span>
              <strong>
                001 – {String(maxProductCode || '999').padStart(3, '0')}
              </strong>
            </div>

            <div style={s.infoWarning}>
              Changes do not modify existing NDC records.
            </div>

            <div style={s.quickLinksHead}>Quick Links</div>

            <button style={s.quickLinkBtn} onClick={() => router.push('/admin/users')}>
              <span style={s.quickLinkIcon}>⚙</span>
              <span>User Management</span>
              <span style={s.quickLinkArrow}>→</span>
            </button>

            {/* <button style={s.quickLinkBtn} onClick={() => router.push('/admin/sessions')}>
              <span style={s.quickLinkIcon}>⚿</span>
              <span>Active Sessions</span>
              <span style={s.quickLinkArrow}>→</span>
            </button> */}

            <button style={s.quickLinkBtn} onClick={() => router.push('/audit')}>
              <span style={s.quickLinkIcon}>◎</span>
              <span>Full Audit Trail</span>
              <span style={s.quickLinkArrow}>→</span>
            </button>

          </div>

        </div>

        {/* Recent Changes */}
        <div style={s.historyCard}>
          <div style={s.historyHead}>
            <h3 style={s.historyTitle}>Recent Changes</h3>
            <span style={s.historySub}>Last 5 updates to system configuration</span>
          </div>

          {history.length === 0 ? (
            <div style={s.historyEmpty}>
              <div style={s.historyEmptyIcon}>◎</div>
              <div style={s.historyEmptyText}>No configuration changes yet</div>
              <div style={s.historyEmptySub}>Any future updates to the labeler code or product code range will show up here.</div>
            </div>
          ) : (
            <div>
              {history.map((h, i) => (
                <div key={h.id} style={i % 2 === 0 ? s.historyRowEven : s.historyRowOdd}>
                  <div style={s.historyLeft}>
                    <div style={s.historyAvatar}>{h.performedBy?.charAt(0) || 'U'}</div>
                    <div>
                      <div style={s.historyBy}>{h.performedBy}</div>
                      <div style={s.historyChange}>{formatChange(h.newValue)}</div>
                    </div>
                  </div>
                  <div style={s.historyTime}>
                    {new Date(h.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
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
    marginBottom: '28px'
  },

  pageTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: '5px',
    letterSpacing: '-0.3px'
  },

  pageSub: {
    fontSize: '13px',
    color: '#999'
  },

  configLayout: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) 280px',
    gap: '20px',
    alignItems: 'stretch',
    marginBottom: '20px'
  },

  card: {
    background: 'white',
    borderRadius: '12px',
    border: '1px solid #EDE8E0',
    overflow: 'hidden'
  },

  cardHeader: {
    padding: '22px 24px',
    borderBottom: '1px solid #F0EBE2',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },

  cardTitle: {
    margin: 0,
    fontSize: '15px',
    fontWeight: '700',
    color: '#1A1A1A'
  },

  cardSub: {
    margin: '5px 0 0',
    fontSize: '12px',
    color: '#999'
  },

  formGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    padding: '24px'
  },

  fieldsRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '18px'
  },

  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '7px'
  },

  label: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#1A1A1A'
  },

  input: {
    padding: '11px 13px',
    border: '1px solid #E2DCD2',
    borderRadius: '7px',
    fontSize: '13px',
    fontFamily: 'inherit',
    outline: 'none',
    color: '#1A1A1A',
    background: '#fff'
  },

  helper: {
    fontSize: '11px',
    color: '#999',
    lineHeight: '1.5'
  },

  previewBox: {
    background: '#FAF8F4',
    border: '1px solid #EEE7DC',
    borderRadius: '9px',
    padding: '15px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '20px'
  },

  previewLabel: {
    fontSize: '10px',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: '0.6px',
    marginBottom: '5px'
  },

  previewValue: {
    fontSize: '17px',
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: '0.3px'
  },

  previewArrow: {
    margin: '0 10px',
    color: '#C5BDB2',
    fontWeight: '400'
  },

  previewHint: {
    maxWidth: '230px',
    fontSize: '11px',
    color: '#999',
    lineHeight: '1.5',
    textAlign: 'right'
  },

  metaRow: {
    display: 'flex',
    gap: '32px',
    borderTop: '1px solid #F0EBE2',
    paddingTop: '16px',
    fontSize: '11px',
    color: '#888'
  },

  metaLabel: {
    color: '#AAA',
    marginRight: '7px'
  },

  footer: {
    display: 'flex',
    justifyContent: 'flex-start'
  },

  saveBtn: {
    padding: '10px 20px',
    border: 'none',
    borderRadius: '7px',
    background: '#E8650A',
    color: '#fff',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer'
  },

  infoCard: {
    background: 'white',
    border: '1px solid #EDE8E0',
    borderRadius: '12px',
    padding: '20px'
  },

  infoIcon: {
    width: '34px',
    height: '34px',
    borderRadius: '8px',
    background: '#FFF1E7',
    color: '#E8650A',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '15px',
    marginBottom: '14px'
  },

  infoTitle: {
    margin: '0 0 7px',
    fontSize: '14px',
    fontWeight: '700',
    color: '#1A1A1A'
  },

  infoText: {
    margin: '0 0 18px',
    fontSize: '11px',
    lineHeight: '1.6',
    color: '#999'
  },

  infoItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '11px 0',
    borderTop: '1px solid #F0EBE2',
    fontSize: '11px',
    color: '#999'
  },

  infoWarning: {
    marginTop: '15px',
    padding: '10px',
    borderRadius: '7px',
    background: '#FAF8F4',
    color: '#888',
    fontSize: '10px',
    lineHeight: '1.5'
  },

  quickLinksHead: {
    fontSize: '10px',
    fontWeight: '700',
    color: '#CCCCCC',
    letterSpacing: '0.8px',
    textTransform: 'uppercase',
    marginTop: '20px',
    marginBottom: '10px',
    borderTop: '1px solid #F0EBE2',
    paddingTop: '18px'
  },

  quickLinkBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 10px',
    background: '#FAF8F5',
    border: '1px solid #F0EBE2',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#1A1A1A',
    cursor: 'pointer',
    marginBottom: '8px',
    textAlign: 'left'
  },

  quickLinkIcon: {
    width: '22px',
    height: '22px',
    borderRadius: '6px',
    background: '#FFF0E6',
    color: '#C4520A',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    flexShrink: 0
  },

  quickLinkArrow: {
    marginLeft: 'auto',
    color: '#CCC',
    fontSize: '12px'
  },

  errorBox: {
    padding: '10px 14px',
    background: '#FEF2F2',
    border: '1px solid #FECACA',
    borderRadius: '7px',
    color: '#991B1B',
    fontSize: '13px'
  },

  successBox: {
    padding: '10px 14px',
    background: '#F0F7F4',
    border: '1px solid #B7E0C8',
    borderRadius: '7px',
    color: '#2D6A4F',
    fontSize: '13px'
  },

  historyCard: {
    background: 'white',
    border: '1px solid #EDE8E0',
    borderRadius: '12px',
    overflow: 'hidden'
  },

  historyHead: {
    padding: '18px 24px',
    borderBottom: '1px solid #F0EBE2'
  },

  historyTitle: {
    margin: 0,
    fontSize: '14px',
    fontWeight: '700',
    color: '#1A1A1A'
  },

  historySub: {
    fontSize: '11px',
    color: '#999',
    display: 'block',
    marginTop: '3px'
  },

  historyRowEven: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '13px 24px',
    borderBottom: '1px solid #F5F2ED',
    background: 'white'
  },

  historyRowOdd: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '13px 24px',
    borderBottom: '1px solid #F5F2ED',
    background: '#FDFCFA'
  },

  historyLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },

  historyAvatar: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    background: '#E8650A',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: '700',
    flexShrink: 0
  },

  historyBy: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#1A1A1A'
  },

  historyChange: {
    fontSize: '11px',
    color: '#999',
    marginTop: '1px'
  },

  historyTime: {
    fontSize: '11px',
    color: '#AAA',
    whiteSpace: 'nowrap'
  },

  historyEmpty: {
    padding: '40px 24px',
    textAlign: 'center'
  },

  historyEmptyIcon: {
    fontSize: '24px',
    color: '#CCC',
    marginBottom: '10px'
  },

  historyEmptyText: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: '4px'
  },

  historyEmptySub: {
    fontSize: '11px',
    color: '#AAA',
    maxWidth: '340px',
    margin: '0 auto',
    lineHeight: '1.5'
  }
};