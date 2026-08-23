'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '../components/layout.jsx';
import CreateNDCWizard from '../components/CreateNDCWizard.jsx';
import IconActionButton from '../components/IconActionButton.jsx';

export default function ProductsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [showWizard, setShowWizard] = useState(false);

  useEffect(() => {
    fetch('/api/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user) {
          if (data.user.role === 'Viewer') {
            router.push('/dashboard');
            return;
          }
          setUser(data.user);
          fetchProducts();
        } else {
          router.push('/');
        }
      })
      .catch(() => router.push('/'));
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products', { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        setProducts(Array.isArray(data.data) ? data.data : []);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async (productId, currentStatus) => {
    const normalizedStatus = String(currentStatus || '').trim().toLowerCase();

    const newStatus =
      normalizedStatus === 'active'
        ? 'Inactive'
        : 'Active';

    try {
      const response = await fetch('/api/products', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: productId,
          status: newStatus,
          updated_by: user?.name || user?.username,
          role: user?.role
        })
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Product status update failed:', result);
        alert(result.message || 'Failed to update product status');
        return;
      }

      await fetchProducts();

    } catch (error) {
      console.error('Error updating product:', error);
      alert('Error updating product status');
    }
  };

  const handleEdit = (product) => {
    setEditingProduct({
      ...product
    });
  };

  const handleSaveEdit = async () => {
    if (!editingProduct) return;

    setSavingEdit(true);

    try {
      const response = await fetch('/api/products', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: editingProduct.id,
          product_name: editingProduct.product_name,
          strength: editingProduct.strength,
          dosage_form: editingProduct.dosage_form,
          rx_otc: editingProduct.rx_otc,
          anda_number: editingProduct.anda_number,
          status: editingProduct.status,
          updated_by: user?.name || user?.username,
          role: user?.role
        })
      });

      const result = await response.json();

      if (!response.ok) {
        alert(result.message || 'Failed to update product');
        return;
      }

      setEditingProduct(null);
      await fetchProducts();

    } catch (error) {
      console.error('Error updating product:', error);
      alert('Failed to update product');
    } finally {
      setSavingEdit(false);
    }
  };

  const filteredProducts = products.filter((product) => {
    if (!product || !product.product_name) return false;
    const matchesStatus = filter === 'all' || product.status === filter;
    const matchesSearch =
      (product.product_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.product_code || '').toString().includes(searchTerm) ||
      (product.anda_number || '').includes(searchTerm);
    return matchesStatus && matchesSearch;
  });

  function handleCreateNDCSuccess(ndc) {
    setShowWizard(false);
    fetchProducts();
  }

  if (!user) return null;

  if (loading) {
    return (
      <Layout current="/products">
        <div style={s.loadingContainer}>
          <div style={s.loadingSpinner} />
          <p style={s.loadingText}>Loading products...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout current="/products">
      <div style={s.page}>
        <div style={s.pageHead}>
          <div>
            <h1 style={s.pageTitle}>Products</h1>
            <p style={s.pageSub}>Manage product master data — Sun Pharma Industries Ltd.</p>
          </div>
          {user?.role !== 'Viewer' && (
            <button style={s.primaryBtn} onClick={() => setShowWizard(true)}>
              + Create NDC
            </button>
          )}
        </div>

        <div style={s.card}>
          <div style={s.filterRow}>
            <div style={s.searchWrap}>
              <span style={s.searchIcon}>🔍︎</span>
              <input
                style={s.searchInput}
                placeholder="Search by name, code, or ANDA..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              style={s.filterSelect}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All Products</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            {(searchTerm || filter !== 'all') && (
              <button
                style={s.clearBtn}
                onClick={() => {
                  setSearchTerm('');
                  setFilter('all');
                }}
              >
                Clear
              </button>
            )}
            <div style={s.countBadge}>
              {filteredProducts.length} record{filteredProducts.length !== 1 ? 's' : ''}
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div style={s.empty}>
              <div style={s.emptyIcon}>💊</div>
              <div style={s.emptyText}>
                {products.length === 0 ? 'No products yet' : 'No matches found'}
              </div>
              <div style={s.emptySub}>
                {products.length === 0
                  ? 'Create your first product in the NDC wizard on Dashboard'
                  : 'Try adjusting your search or filter'}
              </div>
            </div>
          ) : (
            <div>
              {filteredProducts.map((product, i) => (
                <div key={product.id} style={i % 2 === 0 ? s.rowEven : s.rowOdd}>
                  <div style={s.rowLeft}>
                    <div style={s.rowIcon}>💊</div>
                    <div>
                      <div style={s.rowName}>{product.product_name || 'Unknown'}</div>
                      <div style={s.rowMeta}>
                        {product.strength || '-'} · {product.dosage_form || '-'} · Code: <span style={s.codeTag}>{product.product_code}</span>
                      </div>
                      <div style={s.rowSubMeta}>
                        ANDA: {product.anda_number || '-'} · By {product.created_by}
                      </div>
                    </div>
                  </div>
                  <div style={s.rowRight}>
                    <span
                      style={
                        product.status === 'Active'
                          ? s.badgeActive
                          : s.badgeInactive
                      }
                    >
                      {product.status}
                    </span>

                    {user?.role !== 'Viewer' && (
                      <>
                        <button
                          onClick={() =>
                            handleStatusToggle(product.id, product.status)
                          }
                          style={{
                            ...s.toggleBtn,
                            color:
                              product.status === 'Active'
                                ? '#C4520A'
                                : '#2D6A4F',
                            borderColor:
                              product.status === 'Active'
                                ? '#F0997B'
                                : '#97C459'
                          }}
                        >
                          {product.status === 'Active'
                            ? 'Deactivate'
                            : 'Reactivate'}
                        </button>
                       <IconActionButton icon="✎" label="Edit" onClick={() => handleEdit(product)} />

                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {editingProduct && (
        <div style={s.modalOverlay}>
          <div style={s.modal}>
            <div style={s.modalHeader}>
              <div>
                <h2 style={s.modalTitle}>Edit Product</h2>
                <p style={s.modalSub}>
                  Update product master data
                </p>
              </div>

              <button
                onClick={() => setEditingProduct(null)}
                style={s.closeBtn}
              >
                ×
              </button>
            </div>

            <div style={s.formGrid}>
              <div style={s.field}>
                <label style={s.label}>Product Code</label>
                <input
                  value={editingProduct.product_code}
                  disabled
                  style={{
                    ...s.input,
                    background: '#f5f5f5',
                    color: '#777'
                  }}
                />
                <span style={s.helper}>
                  Product code cannot be changed.
                </span>
              </div>

              <div style={s.field}>
                <label style={s.label}>Product Name</label>
                <input
                  value={editingProduct.product_name || ''}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      product_name: e.target.value
                    })
                  }
                  style={s.input}
                />
              </div>

              <div style={s.field}>
                <label style={s.label}>Strength</label>
                <input
                  value={editingProduct.strength || ''}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      strength: e.target.value
                    })
                  }
                  style={s.input}
                />
              </div>

              <div style={s.field}>
                <label style={s.label}>Dosage Form</label>
                <input
                  value={editingProduct.dosage_form || ''}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      dosage_form: e.target.value
                    })
                  }
                  style={s.input}
                />
              </div>

              <div style={s.field}>
                <label style={s.label}>Rx / OTC</label>
                <select
                  value={editingProduct.rx_otc || ''}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      rx_otc: e.target.value
                    })
                  }
                  style={s.input}
                >
                  <option value="Rx">Rx</option>
                  <option value="OTC">OTC</option>
                </select>
              </div>

              <div style={s.field}>
                <label style={s.label}>ANDA Number</label>
                <input
                  value={editingProduct.anda_number || ''}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      anda_number: e.target.value
                    })
                  }
                  style={s.input}
                />
              </div>
            </div>

            <div style={s.modalFooter}>
              <button
                onClick={() => setEditingProduct(null)}
                style={s.cancelBtn}
                disabled={savingEdit}
              >
                Cancel
              </button>

              <button
                onClick={handleSaveEdit}
                style={s.saveBtn}
                disabled={savingEdit}
              >
                {savingEdit ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

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
  page: { padding: '32px' },
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
  primaryBtn: {
    padding: '9px 18px',
    background: '#E8650A',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    flexShrink: 0,
  },
  card: {
    background: 'white',
    borderRadius: '12px',
    border: '1px solid #EDE8E0',
    overflow: 'hidden',
  },
  filterRow: {
    padding: '14px 20px',
    borderBottom: '1px solid #EDE8E0',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
  },
  searchWrap: {
    flex: 1,
    minWidth: '200px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: '#FAF8F5',
    border: '1.5px solid #EDE8E0',
    borderRadius: '8px',
    padding: '0 12px',
  },
  searchIcon: { fontSize: '14px', flexShrink: 0 },
  searchInput: {
    flex: 1,
    padding: '9px 0',
    border: 'none',
    background: 'transparent',
    fontSize: '13px',
    outline: 'none',
    color: '#1A1A1A',
  },
  filterSelect: {
    padding: '9px 12px',
    border: '1.5px solid #EDE8E0',
    borderRadius: '8px',
    fontSize: '13px',
    background: '#FAF8F5',
    outline: 'none',
    color: '#1A1A1A',
    cursor: 'pointer',
  },
  clearBtn: {
    padding: '9px 14px',
    background: 'white',
    border: '1.5px solid #EDE8E0',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#999',
    cursor: 'pointer',
  },
  countBadge: { fontSize: '12px', color: '#AAA', whiteSpace: 'nowrap' },
  rowEven: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 20px',
    borderBottom: '1px solid #F5F2ED',
    background: 'white',
  },
  rowOdd: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 20px',
    borderBottom: '1px solid #F5F2ED',
    background: '#FDFCFA',
  },
  rowLeft: { display: 'flex', gap: '12px', flex: 1, alignItems: 'flex-start' },
  rowIcon: {
    width: '32px',
    height: '32px',
    background: '#FFF0E6',
    borderRadius: '7px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    flexShrink: 0,
  },
  rowName: { fontSize: '14px', fontWeight: '600', color: '#1A1A1A' },
  rowMeta: { fontSize: '12px', color: '#999', marginTop: '4px' },
  rowSubMeta: { fontSize: '11px', color: '#BBB', marginTop: '2px' },
  codeTag: {
    fontFamily: 'Consolas, monospace',
    fontWeight: '700',
    color: '#C4520A',
  },
  rowRight: { display: 'flex', gap: '10px', alignItems: 'center' },
  badgeActive: {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: '700',
    background: '#F0F7F4',
    color: '#2D6A4F',
  },
  badgeInactive: {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: '700',
    background: '#FEF2F2',
    color: '#991B1B',
  },
  editBtn: {
    padding: '7px 12px',
    border: '1.5px solid #EDE8E0',
    borderRadius: '7px',
    fontSize: '12px',
    fontWeight: '600',
    background: '#fff',
    color: '#444',
    cursor: 'pointer',
  },
  toggleBtn: {
    padding: '7px 12px',
    border: '1.5px solid',
    borderRadius: '7px',
    fontSize: '12px',
    fontWeight: '600',
    background: 'transparent',
    cursor: 'pointer',
  },
  empty: { padding: '60px 24px', textAlign: 'center' },
  emptyIcon: { fontSize: '32px', marginBottom: '12px' },
  emptyText: { fontSize: '14px', fontWeight: '600', color: '#1A1A1A', marginBottom: '6px' },
  emptySub: { fontSize: '13px', color: '#AAA' },
  loadingContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' },
  loadingSpinner: { width: '40px', height: '40px', border: '3px solid #EDE8E0', borderTop: '3px solid #E8650A', borderRadius: '50%', animation: 'spin 1s linear infinite' },
  loadingText: { marginTop: '16px', fontSize: '14px', color: '#999' },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.35)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px'
  },
  modal: {
    width: '100%',
    maxWidth: '650px',
    background: '#fff',
    borderRadius: '12px',
    boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
    overflow: 'hidden'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '22px 24px',
    borderBottom: '1px solid #EDE8E0'
  },
  modalTitle: { margin: 0, fontSize: '18px', fontWeight: '700', color: '#1A1A1A' },
  modalSub: { margin: '5px 0 0', fontSize: '12px', color: '#999' },
  closeBtn: { border: 'none', background: 'transparent', fontSize: '24px', color: '#777', cursor: 'pointer', lineHeight: 1 },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', padding: '24px' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '12px', fontWeight: '600', color: '#444' },
  input: { padding: '10px 14px', border: '1px solid #EDE8E0', borderRadius: '7px', fontSize: '13px', fontFamily: 'inherit', outline: 'none', color: '#1A1A1A' },
  helper: { fontSize: '10px', color: '#999' },
  modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '16px 24px', borderTop: '1px solid #EDE8E0' },
  cancelBtn: { padding: '9px 16px', border: '1px solid #D6D0C7', borderRadius: '8px', background: '#fff', color: '#444', fontSize: '13px', cursor: 'pointer' },
  saveBtn: { padding: '9px 18px', border: 'none', borderRadius: '8px', background: '#E8650A', color: '#fff', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
};