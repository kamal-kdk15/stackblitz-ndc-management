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

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/');
      return;
    }

    const userData = JSON.parse(storedUser);
    setUser(userData);

    if (userData.role === 'Viewer') {
      router.push('/dashboard');
      return;
    }

    const fetchProductsData = async () => {
      try {
        const response = await fetch('/api/products');
        if (response.ok) {
          const data = await response.json();
          setProducts(data.data || []);
          if (data.data && data.data.length > 0) {
            setSelectedProductId(data.data[0].id);
            fetchPackagesData(data.data[0].id);
          }
        }
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchPackagesData = async (productId) => {
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

    fetchProductsData();
  }, [router]);

  const handleProductSelect = (productId) => {
    setSelectedProductId(productId);
    fetchPackagesByProduct(productId);
  };

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
    await fetchPackages();

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
    fetchData();
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
        {/* Header */}
        <div style={s.header}>
          <div>
            <h1 style={s.title}>Packages</h1>
            <p style={s.sub}>Manage package variants for your products</p>
          </div>
          {user?.role !== 'Viewer' && (
            <button style={s.btn} onClick={() => setShowWizard(true)}>
              + Create NDC
            </button>
          )}
        </div>

        {/* Product Selector */}
        {products.length === 0 ? (
          <div style={s.empty}>
            <div style={s.emptyTitle}>📦 No products found</div>
            <div style={s.emptySub}>Create your first product in the NDC wizard on Dashboard</div>
            <button style={{ ...s.btn, marginTop: '16px' }} onClick={() => router.push('/dashboard')}>
              Go to Dashboard
            </button>
          </div>
        ) : (
          <>
            {/* Product Selector */}
            <div style={s.controls}>
              <label style={s.label}>Select Product:</label>
              <select
                value={selectedProductId || ''}
                onChange={(e) => handleProductSelect(Number(e.target.value))}
                style={{ ...s.input, width: '100%' }}
              >
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.product_name} (Code: {product.product_code}) - {product.status}
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Product Info */}
            {selectedProduct && (
              <div style={s.infoBox}>
                <div style={s.infoRow}>
                  <span style={s.infoLabel}>Product:</span> {selectedProduct.product_name}
                </div>
                <div style={s.infoRow}>
                  <span style={s.infoLabel}>Code:</span> {selectedProduct.product_code}
                </div>
                <div style={s.infoRow}>
                  <span style={s.infoLabel}>ANDA:</span> {selectedProduct.anda_number}
                </div>
              </div>
            )}

            {/* Search */}
            <div style={s.controls}>
              <input
                type="text"
                placeholder="Search by size, unit, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ ...s.input, width: '100%' }}
              />
            </div>

            {/* Packages List */}
            {filteredPackages.length === 0 ? (
              <div style={s.empty}>
                <div style={s.emptyTitle}> No packages</div>
                <div style={s.emptySub}>
                  {packages.length === 0
                    ? 'Create packages in the NDC wizard on Dashboard'
                    : 'Try adjusting your search filters'}
                </div>
              </div>
            ) : (
              <div>
                {filteredPackages.map((pkg) => (
                  <div key={pkg.id} style={s.row}>
                    <div style={s.rowLeft}>
                      <div style={s.rowIcon}>📦</div>
                      <div>
                        <div style={s.rowName}>Code: {pkg.package_code}</div>
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
  style={{
    ...s.statusBadge,
    ...(pkg.status === 'Active'
      ? s.statusActive
      : s.statusInactive)
  }}
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
        ? '#dc2626'
        : '#16a34a',
    borderColor:
      pkg.status === 'Active'
        ? '#dc2626'
        : '#16a34a'
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
          </>
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

        {/* Package Code - LOCKED */}
        <div style={s.field}>
          <label style={s.label}>
            Package Code
          </label>

          <input
            value={editingPackage.package_code || ''}
            disabled
            style={{
              ...s.input,
              background: '#f5f5f5',
              color: '#777'
            }}
          />

          <span style={s.helper}>
            Package code cannot be changed.
          </span>
        </div>

        {/* Product - LOCKED */}
        <div style={s.field}>
          <label style={s.label}>
            Product
          </label>

          <input
            value={editingPackage.product_id || ''}
            disabled
            style={{
              ...s.input,
              background: '#f5f5f5',
              color: '#777'
            }}
          />

          <span style={s.helper}>
            Product id cannot be changed.
          </span>
        </div>

        {/* Package Size */}
        <div style={s.field}>
          <label style={s.label}>
            Package Size
          </label>

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

        {/* Unit */}
        <div style={s.field}>
          <label style={s.label}>
            Unit
          </label>

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

        {/* Description */}
        <div
          style={{
            ...s.field,
            gridColumn: '1 / -1'
          }}
        >
          <label style={s.label}>
            Description
          </label>

          <textarea
            value={editingPackage.description || ''}
            onChange={(e) =>
              setEditingPackage({
                ...editingPackage,
                description: e.target.value
              })
            }
            style={{
              ...s.input,
              minHeight: '90px',
              resize: 'vertical'
            }}
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
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid #EDE8E0' },
  title: { fontSize: '25px', fontWeight: '700', color: '#1A1A1A', marginBottom: '3px' },
  sub: { fontSize: '13px', color: '#999' },
  btn: { padding: '9px 16px', background: '#E8650A', color: 'white', border: 'none', borderRadius: '7px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  controls: { marginBottom: '24px' },
  label: { display: 'block', fontSize: '13px', fontWeight: '600', color: '#1A1A1A', marginBottom: '8px' },
  input: { padding: '10px 14px', border: '1px solid #EDE8E0', borderRadius: '7px', fontSize: '13px', fontFamily: 'inherit' },
  infoBox: { background: '#F9F5F0', border: '1px solid #EDE8E0', borderRadius: '7px', padding: '16px', marginBottom: '24px' },
  infoRow: { fontSize: '13px', color: '#666', marginBottom: '8px' },
  infoLabel: { fontWeight: '600', color: '#1A1A1A', marginRight: '8px' },
  empty: { textAlign: 'center', padding: '60px 20px' },
  emptyTitle: { fontSize: '18px', fontWeight: '600', color: '#1A1A1A', marginBottom: '8px' },
  emptySub: { fontSize: '13px', color: '#999' },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid #EDE8E0' },
  rowLeft: { display: 'flex', gap: '12px', flex: 1 },
  rowIcon: { fontSize: '22px', minWidth: '30px' },
  rowName: { fontSize: '14px', fontWeight: '600', color: '#1A1A1A' },
  rowMeta: { fontSize: '12px', color: '#999', marginTop: '4px' },
  rowSubMeta: { fontSize: '11px', color: '#BBB', marginTop: '2px' },
  rowRight: { display: 'flex', gap: '12px', alignItems: 'center' },
  statusBadge: { padding: '4px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: '600' },
  statusActive: { background: '#E8F5E9', color: '#2D6A4F' },
  statusInactive: { background: '#FFEBEE', color: '#C4520A' },
  toggleBtn: { padding: '6px 12px', border: '1px solid', borderRadius: '4px', fontSize: '12px', fontWeight: '600', background: 'transparent', cursor: 'pointer' },
  loadingContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' },
  loadingSpinner: { width: '40px', height: '40px', border: '3px solid #EDE8E0', borderTop: '3px solid #E8650A', borderRadius: '50%', animation: 'spin 1s linear infinite' },
  loadingText: { marginTop: '16px', fontSize: '14px', color: '#999' },
  editBtn: {
  padding: '6px 12px',
  border: '1px solid #D6D0C7',
  borderRadius: '4px',
  fontSize: '12px',
  fontWeight: '600',
  background: '#fff',
  color: '#444',
  cursor: 'pointer'
},

modalOverlay: {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0, 0, 0, 0.35)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000
},

modal: {
  width: '600px',
  maxWidth: '90%',
  background: '#fff',
  borderRadius: '10px',
  padding: '24px',
  boxShadow: '0 20px 50px rgba(0,0,0,0.15)'
},

modalHeader: {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: '24px',
  paddingBottom: '16px',
  borderBottom: '1px solid #EDE8E0'
},

modalTitle: {
  fontSize: '20px',
  fontWeight: '700',
  color: '#1A1A1A',
  margin: 0
},

modalSub: {
  fontSize: '12px',
  color: '#999',
  marginTop: '4px'
},

closeBtn: {
  border: 'none',
  background: 'transparent',
  fontSize: '24px',
  color: '#777',
  cursor: 'pointer'
},

formGrid: {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '18px'
},

field: {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px'
},

label: {
  fontSize: '12px',
  fontWeight: '600',
  color: '#444'
},

helper: {
  fontSize: '10px',
  color: '#999'
},

modalFooter: {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '10px',
  marginTop: '24px',
  paddingTop: '16px',
  borderTop: '1px solid #EDE8E0'
},

cancelBtn: {
  padding: '9px 16px',
  border: '1px solid #D6D0C7',
  background: '#fff',
  color: '#444',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '13px',
  fontWeight: '600'
},

saveBtn: {
  padding: '9px 18px',
  border: 'none',
  background: '#E8650A',
  color: '#fff',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '13px',
  fontWeight: '600'
}
};
