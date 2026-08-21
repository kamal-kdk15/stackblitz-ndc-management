'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '../components/layout.jsx';
import CreateNDCWizard from '../components/CreateNDCWizard.jsx';

export default function PackagesPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [packages, setPackages] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingPackage, setEditingPackage] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [productQuery, setProductQuery] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);

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
          fetchProductsData();
        } else {
          router.push('/');
        }
      })
      .catch(() => router.push('/'));
  }, []);

  const fetchProductsData = async () => {
    try {
      const response = await fetch('/api/products');
      if (response.ok) {
        const data = await response.json();
        setProducts(data.data || []);
        if (data.data && data.data.length > 0) {
          setSelectedProductId(data.data[0].id);
          setProductQuery(data.data[0].product_name);
          fetchPackagesByProduct(data.data[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProductSelect = (product) => {
    setSelectedProductId(product.id);
    setProductQuery(product.product_name);
    setShowProductDropdown(false);
    fetchPackagesByProduct(product.id);
  };

  const matchingProducts = products.filter((p) =>
    p.product_name?.toLowerCase().includes(productQuery.toLowerCase()) ||
    p.product_code?.toLowerCase().includes(productQuery.toLowerCase())
  );

  const fetchPackagesByProduct = async (productId) => {
    try {
      const response = await fetch(`/api/packages?product_id=${productId}`);
      if (response.ok) {
        const data = await response.json();
        setPackages(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch packages:', error);
    }
  };

  const handleEdit = (pkg) => {
    setEditingPackage({
      ...pkg
    });
  };

  const handleStatusToggle = async (packageId, currentStatus) => {
    const normalizedStatus = String(currentStatus || '').trim().toLowerCase();

    const newStatus =
      normalizedStatus === 'active'
        ? 'Inactive'
        : 'Active';

    try {
      const response = await fetch('/api/packages', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: packageId,
          status: newStatus,
          updated_by: user?.name || user?.username,
          role: user?.role
        })
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Package status update failed:', result);
        alert(result.message || 'Failed to update package status');
        return;
      }

      await fetchPackagesByProduct(selectedProductId);

    } catch (error) {
      console.error('Error updating package:', error);
      alert('Error updating package status');
    }
  };

  const handleSaveEdit = async () => {
    if (!editingPackage) return;

    setSavingEdit(true);

    try {
      const response = await fetch('/api/packages', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: editingPackage.id,
          package_size: editingPackage.package_size,
          unit: editingPackage.unit,
          description: editingPackage.description,
          updated_by: user?.name || user?.username,
          role: user?.role
        })
      });

      const result = await response.json();

      if (!response.ok) {
        alert(result.message || 'Failed to update package');
        return;
      }

      setEditingPackage(null);
      await fetchPackagesByProduct(selectedProductId);

    } catch (error) {
      console.error('Error updating package:', error);
      alert('Failed to update package');
    } finally {
      setSavingEdit(false);
    }
  };

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  const filteredPackages = packages.filter((pkg) =>
    pkg.package_size?.toString().includes(searchTerm) ||
    pkg.unit?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pkg.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  function handleCreateNDCSuccess(ndc) {
    setShowWizard(false);
    fetchProductsData();
  }

  if (!user) return null;

  if (loading) {
    return (
      <Layout current="/packages">
        <div style={s.loadingContainer}>
          <div style={s.loadingSpinner} />
          <p style={s.loadingText}>Loading packages...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout current="/packages">
      <div style={s.page}>
        <div style={s.pageHead}>
          <div>
            <h1 style={s.pageTitle}>Packages</h1>
            <p style={s.pageSub}>Manage package variants for your products — Sun Pharma Industries Ltd.</p>
          </div>
          {user?.role !== 'Viewer' && (
            <button style={s.primaryBtn} onClick={() => setShowWizard(true)}>
              + Create NDC
            </button>
          )}
        </div>

        {products.length === 0 ? (
          <div style={s.card}>
            <div style={s.empty}>
              <div style={s.emptyIcon}>📦</div>
              <div style={s.emptyText}>No products found</div>
              <div style={s.emptySub}>Create your first product in the NDC wizard on Dashboard</div>
              <button style={{ ...s.primaryBtn, marginTop: '16px' }} onClick={() => router.push('/dashboard')}>
                Go to Dashboard
              </button>
            </div>
          </div>
        ) : (
          <div style={s.card}>
            <div style={s.filterRow}>
              <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
                <div style={s.searchWrap}>
                  <span style={s.searchIcon}>🔍︎</span>
                  <input
                    style={s.searchInput}
                    placeholder="Search product by name or code..."
                    value={productQuery}
                    onChange={(e) => {
                      setProductQuery(e.target.value);
                      setShowProductDropdown(true);
                    }}
                    onFocus={() => setShowProductDropdown(true)}
                    onBlur={() => setTimeout(() => setShowProductDropdown(false), 150)}
                  />
                </div>
                {showProductDropdown && (
                  <div style={s.dropdown}>
                    {matchingProducts.length === 0 ? (
                      <div style={s.dropdownEmpty}>No products match</div>
                    ) : (
                      matchingProducts.map((product) => (
                        <div
                          key={product.id}
                          style={{
                            ...s.dropdownItem,
                            ...(product.id === selectedProductId ? s.dropdownItemActive : {}),
                          }}
                          onMouseDown={() => handleProductSelect(product)}
                          onMouseEnter={(e) => {
                            if (product.id !== selectedProductId) e.currentTarget.style.background = '#FAF8F5';
                          }}
                          onMouseLeave={(e) => {
                            if (product.id !== selectedProductId) e.currentTarget.style.background = 'white';
                          }}
                        >
                          <span style={s.dropdownItemName}>{product.product_name}</span>
                          <span style={s.dropdownItemMeta}>
                            Code: {product.product_code} · {product.status}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
              <div style={s.searchWrap}>
                <span style={s.searchIcon}>🔍︎</span>
                <input
                  style={s.searchInput}
                  placeholder="Search by size, unit, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div style={s.countBadge}>
                {filteredPackages.length} record{filteredPackages.length !== 1 ? 's' : ''}
              </div>
            </div>

            {selectedProduct && (
              <div style={s.infoBox}>
                <div style={s.infoRow}>
                  <span style={s.infoLabel}>Product:</span> {selectedProduct.product_name}
                </div>
                <div style={s.infoRow}>
                  <span style={s.infoLabel}>Code:</span> <span style={s.codeTag}>{selectedProduct.product_code}</span>
                </div>
                <div style={s.infoRow}>
                  <span style={s.infoLabel}>ANDA:</span> {selectedProduct.anda_number}
                </div>
              </div>
            )}

            {filteredPackages.length === 0 ? (
              <div style={s.empty}>
                <div style={s.emptyIcon}>📦</div>
                <div style={s.emptyText}>No packages</div>
                <div style={s.emptySub}>
                  {packages.length === 0
                    ? 'Create packages in the NDC wizard on Dashboard'
                    : 'Try adjusting your search filters'}
                </div>
              </div>
            ) : (
              <div>
                {filteredPackages.map((pkg, i) => (
                  <div key={pkg.id} style={i % 2 === 0 ? s.rowEven : s.rowOdd}>
                    <div style={s.rowLeft}>
                      <div style={s.rowIcon}>📦</div>
                      <div>
                        <div style={s.rowName}>Code: <span style={s.codeTag}>{pkg.package_code}</span></div>
                        <div style={s.rowMeta}>
                          Size: {pkg.package_size} {pkg.unit} · {pkg.description || 'No description'}
                        </div>
                        <div style={s.rowSubMeta}>
                          By {pkg.created_by} · {new Date(pkg.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div style={s.rowRight}>
                      <span
                        style={
                          pkg.status === 'Active'
                            ? s.badgeActive
                            : s.badgeInactive
                        }
                      >
                        {pkg.status}
                      </span>

                      {user?.role !== 'Viewer' && (
                        <>
                          <button
                            onClick={() => handleEdit(pkg)}
                            style={s.editBtn}
                          >
                            Edit
                          </button>

                          <button
                            onClick={() =>
                              handleStatusToggle(pkg.id, pkg.status)
                            }
                            style={{
                              ...s.toggleBtn,
                              color:
                                pkg.status === 'Active'
                                  ? '#C4520A'
                                  : '#2D6A4F',
                              borderColor:
                                pkg.status === 'Active'
                                  ? '#F0997B'
                                  : '#97C459'
                            }}
                          >
                            {pkg.status === 'Active'
                              ? 'Deactivate'
                              : 'Reactivate'}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {editingPackage && (
        <div style={s.modalOverlay}>
          <div style={s.modal}>
            <div style={s.modalHeader}>
              <div>
                <h2 style={s.modalTitle}>Edit Package</h2>
                <p style={s.modalSub}>
                  Update package master data
                </p>
              </div>

              <button
                onClick={() => setEditingPackage(null)}
                style={s.closeBtn}
              >
                ×
              </button>
            </div>

            <div style={s.formGrid}>
              <div style={s.field}>
                <label style={s.label}>Package Code</label>
                <input
                  value={editingPackage.package_code || ''}
                  disabled
                  style={{ ...s.input, background: '#f5f5f5', color: '#777' }}
                />
                <span style={s.helper}>Package code cannot be changed.</span>
              </div>

              <div style={s.field}>
                <label style={s.label}>Product</label>
                <input
                  value={editingPackage.product_id || ''}
                  disabled
                  style={{ ...s.input, background: '#f5f5f5', color: '#777' }}
                />
                <span style={s.helper}>Product id cannot be changed.</span>
              </div>

              <div style={s.field}>
                <label style={s.label}>Package Size</label>
                <input
                  value={editingPackage.package_size || ''}
                  onChange={(e) =>
                    setEditingPackage({
                      ...editingPackage,
                      package_size: e.target.value
                    })
                  }
                  style={s.input}
                />
              </div>

              <div style={s.field}>
                <label style={s.label}>Unit</label>
                <input
                  value={editingPackage.unit || ''}
                  onChange={(e) =>
                    setEditingPackage({
                      ...editingPackage,
                      unit: e.target.value
                    })
                  }
                  style={s.input}
                />
              </div>

              <div style={{ ...s.field, gridColumn: '1 / -1' }}>
                <label style={s.label}>Description</label>
                <textarea
                  value={editingPackage.description || ''}
                  onChange={(e) =>
                    setEditingPackage({
                      ...editingPackage,
                      description: e.target.value
                    })
                  }
                  style={{ ...s.input, minHeight: '90px', resize: 'vertical' }}
                />
              </div>
            </div>

            <div style={s.modalFooter}>
              <button
                onClick={() => setEditingPackage(null)}
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
  countBadge: { fontSize: '12px', color: '#AAA', whiteSpace: 'nowrap' },
  dropdown: {
    position: 'absolute',
    top: 'calc(100% + 4px)',
    left: 0,
    right: 0,
    background: 'white',
    border: '1.5px solid #EDE8E0',
    borderRadius: '8px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
    maxHeight: '260px',
    overflowY: 'auto',
    zIndex: 50,
  },
  dropdownEmpty: {
    padding: '14px',
    fontSize: '13px',
    color: '#AAA',
    textAlign: 'center',
  },
  dropdownItem: {
    padding: '10px 14px',
    cursor: 'pointer',
    borderBottom: '1px solid #F5F2ED',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  dropdownItemActive: {
    background: '#FFF0E6',
  },
  dropdownItemName: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#1A1A1A',
  },
  dropdownItemMeta: {
    fontSize: '11px',
    color: '#999',
  },
  infoBox: {
    background: '#FAF8F5',
    borderBottom: '1px solid #EDE8E0',
    padding: '14px 20px',
    display: 'flex',
    gap: '24px',
    flexWrap: 'wrap',
  },
  infoRow: { fontSize: '13px', color: '#666' },
  infoLabel: { fontWeight: '600', color: '#1A1A1A', marginRight: '6px' },
  codeTag: {
    fontFamily: 'Consolas, monospace',
    fontWeight: '700',
    color: '#C4520A',
  },
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