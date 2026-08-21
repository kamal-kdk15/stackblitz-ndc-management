'use client';
import { useState, useEffect } from 'react';

export default function CreateNDCWizard({ user, onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Product selection
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [showCreateProduct, setShowCreateProduct] = useState(false);
  const [productForm, setProductForm] = useState({
    product_code: '',
    product_name: '',
    generic_name: '',
    strength: '',
    dosage_form: '',
    rx_otc: '',
    anda_number: '',
  });

  // Step 2: Package selection
  const [packages, setPackages] = useState([]);
  const [selectedPackageId, setSelectedPackageId] = useState(null);
  const [showCreatePackage, setShowCreatePackage] = useState(false);
  const [packageForm, setPackageForm] = useState({
    package_code: '',
    package_size: '',
    unit: '',
    description: '',
  });

  // Step 3: Review
  const [generatedNDC, setGeneratedNDC] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (selectedProductId && step === 2) {
      fetchPackages(selectedProductId);
    }
  }, [selectedProductId, step]);

 async function fetchProducts() {
  try {
    const res = await fetch('/api/products');
    if (!res.ok) throw new Error('Failed to fetch');
    const data = await res.json();
    if (data.success) {
      setProducts(data.data || []);
    }
  } catch (e) {
    console.error('Error fetching products:', e);
    setProducts([]);
  }
}

  async function fetchPackages(productId) {
    try {
      const res = await fetch(`/api/packages?product_id=${productId}`);
      const data = await res.json();
      if (data.success) setPackages(data.data || []);
    } catch (e) {
      console.error('Error fetching packages:', e);
    }
  }

  async function handleCreateProduct() {
  setLoading(true);
  setError('');

  if (!/^ANDA\d+$/.test(productForm.anda_number)) {
    setError('ANDA must start with "ANDA" followed by numbers only');
    setLoading(false);
    return;
  }

  if (!/^\d{3}$/.test(productForm.product_code)) {
    setError('Product Code must be exactly 3 digits');
    setLoading(false);
    return;
  }

  try {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...productForm,
        generic_name: '',
        created_by: user.name,
        role: user.role,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!data.success) {
      setError(data.message);
      return;
    }

    // Reset form
    setProductForm({
      product_code: '',
      product_name: '',
      generic_name: '',
      strength: '',
      dosage_form: '',
      rx_otc: '',
      anda_number: '',
    });

    // Fetch updated products
    const res2 = await fetch('/api/products');
    const data2 = await res2.json();
    if (data2.success) {
      setProducts(data2.data || []);
    }

    // Select the new product
    setSelectedProductId(data.product.id);
    setShowCreateProduct(false);

    // Move to step 2
    setStep(2);

  } catch (e) {
    console.error(e);
    setError('Something went wrong. Please try again.');
    setLoading(false);
  }
}

 async function handleCreatePackage() {
  setLoading(true);
  setError('');

  if (!/^\d{2}$/.test(packageForm.package_code)) {
    setError('Package Code must be exactly 2 digits');
    setLoading(false);
    return;
  }

  try {
    const res = await fetch('/api/packages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...packageForm,
        product_id: selectedProductId,
        created_by: user.name,
        role: user.role,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!data.success) {
      setError(data.message);
      return;
    }

    // Reset form
    setPackageForm({
      package_code: '',
      package_size: '',
      unit: '',
      description: '',
    });

    // Fetch updated packages
    const res2 = await fetch(`/api/packages?product_id=${selectedProductId}`);
    const data2 = await res2.json();
    if (data2.success) {
      setPackages(data2.data || []);
    }

    // Select new package
    setSelectedPackageId(data.package.id);
    setShowCreatePackage(false);

    // Move to step 3
    setStep(3);

  } catch (e) {
    console.error(e);
    setError('Something went wrong. Please try again.');
    setLoading(false);
  }
}

  function getSelectedProduct() {
    return products.find(p => p.id == selectedProductId);
  }

  function getSelectedPackage() {
    return packages.find(p => p.id == selectedPackageId);
  }

  function generateNDC() {
    const product = getSelectedProduct();
    const pkg = getSelectedPackage();
    if (product && pkg) {
      return `70095-${product.product_code}-${pkg.package_code}`;
    }
    return '';
  }

  async function handleCreateNDC() {
    setLoading(true);
    setError('');

    const product = getSelectedProduct();
    const pkg = getSelectedPackage();
    const ndc = generateNDC();

    const res = await fetch('/api/ndc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ndc_code: ndc,
        product_name: product.product_name,
        strength: product.strength,
        dosage_form: product.dosage_form,
        rx_otc: product.rx_otc,
        anda_number: product.anda_number,
        distributor: '-',
        package_size: pkg.package_size,
        package_description: pkg.description,
        product_code: product.product_code,
        package_code: pkg.package_code,
        labeler_code: '70095',
        created_by: user.name,
        role: user.role,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!data.success) {
      setError(data.message);
      return;
    }

    setGeneratedNDC(ndc);
    if (onSuccess) onSuccess(ndc);
  }

  function handleBack() {
    if (step > 1) setStep(step - 1);
  }

function handleNext() {
  setError('');

  if (step === 1) {
    if (!selectedProductId) {
      setError('Please select or create a product');
      return;
    }
    // Fetch packages for selected product
    fetchPackages(selectedProductId);
    setStep(2);
    return;
  }

  if (step === 2) {
    if (!selectedPackageId) {
      setError('Please select or create a package');
      return;
    }
    setStep(3);
    return;
  }
}

  const product = getSelectedProduct();
  const pkg = getSelectedPackage();

  return (
    <div style={s.overlay}>
      <div style={s.modal}>
        {/* Header */}
        <div style={s.header}>
          <h2 style={s.title}>Create NDC</h2>
          <p style={s.stepIndicator}>Step {step} of 3</p>
          <button style={s.closeBtn} onClick={onClose}>×</button>
        </div>

        {/* Progress */}
        <div style={s.progressBar}>
          {[1, 2, 3].map(i => (
            <div
              key={i}
              style={{
                ...s.progressStep,
                ...(i <= step ? s.progressStepActive : {}),
              }}
            >
              {i}
            </div>
          ))}
        </div>

        {/* Content */}
        <div style={s.content}>
          {error && <div style={s.errorBox}>{error}</div>}

          {step === 1 && !showCreateProduct && (
            <div style={s.stepContainer}>
              <h3 style={s.stepTitle}>Select or Create a Product</h3>
              <p style={s.stepDesc}>
                Choose an existing product or create a new one to get started.
              </p>

              <div style={s.productList}>
                {products.length === 0 ? (
                  <div style={s.emptyState}>No products yet. Create your first product.</div>
                ) : (
                  products.map(p => (
                    <div
                      key={p.id}
                      style={{
                        ...s.productCard,
                        ...(selectedProductId === p.id ? s.productCardSelected : {}),
                      }}
                      onClick={() => setSelectedProductId(p.id)}
                    >
                      <div style={s.productName}>{p.product_name}</div>
                      <div style={s.productCode}>Code: {p.product_code}</div>
                      <div style={s.productStrength}>{p.strength} — {p.dosage_form}</div>
                    </div>
                  ))
                )}
              </div>

              <button
                style={s.createBtn}
                onClick={() => setShowCreateProduct(true)}
              >
                + Create New Product
              </button>
            </div>
          )}

          {step === 1 && showCreateProduct && (
            <div style={s.stepContainer}>
              <h3 style={s.stepTitle}>Create New Product</h3>
              <div style={s.form}>
                <div style={s.formGroup}>
                  <label style={s.label}>Product Code <span style={s.req}>*</span></label>
                  <input
                    type="text"
                    placeholder="e.g. 001"
                    maxLength="3"
                    value={productForm.product_code}
                    onChange={(e) => setProductForm({ ...productForm, product_code: e.target.value })}
                    style={s.input}
                  />
                  <span style={s.hint}>3-digit code</span>
                </div>

                <div style={s.formGroup}>
                  <label style={s.label}>Product Name <span style={s.req}>*</span></label>
                  <input
                    type="text"
                    placeholder="e.g. Paracetamol"
                    value={productForm.product_name}
                    onChange={(e) => setProductForm({ ...productForm, product_name: e.target.value })}
                    style={s.input}
                  />
                </div>

                {/* <div style={s.formGroup}>
                  <label style={s.label}>Generic Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Acetaminophen"
                    value={productForm.generic_name}
                    onChange={(e) => setProductForm({ ...productForm, generic_name: e.target.value })}
                    style={s.input}
                  />
                </div> */}

                <div style={s.formGroup}>
                  <label style={s.label}>Strength <span style={s.req}>*</span></label>
                  <input
                    type="text"
                    placeholder="e.g. 500 MG"
                    value={productForm.strength}
                    onChange={(e) => setProductForm({ ...productForm, strength: e.target.value })}
                    style={s.input}
                  />
                </div>

                <div style={s.formGroup}>
                  <label style={s.label}>Dosage Form <span style={s.req}>*</span></label>
                  <select
                    value={productForm.dosage_form}
                    onChange={(e) => setProductForm({ ...productForm, dosage_form: e.target.value })}
                    style={s.input}
                  >
                    <option value="">— Select —</option>
                    <option value="Tablet">Tablet</option>
                    <option value="Capsule">Capsule</option>
                    <option value="Syrup">Syrup</option>
                    <option value="Injection">Injection</option>
                    <option value="Cream">Cream</option>
                    <option value="Ointment">Ointment</option>
                  </select>
                </div>

                <div style={s.formGroup}>
                  <label style={s.label}>Rx / OTC <span style={s.req}>*</span></label>
                  <select
                    value={productForm.rx_otc}
                    onChange={(e) => setProductForm({ ...productForm, rx_otc: e.target.value })}
                    style={s.input}
                  >
                    <option value="">— Select —</option>
                    <option value="Rx">Rx</option>
                    <option value="OTC">OTC</option>
                  </select>
                </div>

                <div style={s.formGroup}>
                  <label style={s.label}>ANDA Number <span style={s.req}>*</span></label>
                  <input
                    type="text"
                    placeholder="e.g. ANDA123456"
                    value={productForm.anda_number}
                    onChange={(e) => setProductForm({ ...productForm, anda_number: e.target.value })}
                    style={s.input}
                  />
                  <span style={s.hint}>Must start with &quot;ANDA&quot; followed by numbers</span>
                </div>
              </div>
            </div>
          )}

          {step === 2 && !showCreatePackage && (
            <div style={s.stepContainer}>
              <h3 style={s.stepTitle}>Add a Package</h3>
              <p style={s.stepDesc}>
                Select an existing package for this product or create a new one.
              </p>

              <div style={s.productInfo}>
                <strong>{product?.product_name}</strong>
                <span>{product?.strength} — {product?.dosage_form}</span>
              </div>

              <div style={s.packageList}>
                {packages.length === 0 ? (
                  <div style={s.emptyState}>No packages for this product yet.</div>
                ) : (
                  packages.map(p => (
                    <div
                      key={p.id}
                      style={{
                        ...s.packageCard,
                        ...(selectedPackageId === p.id ? s.packageCardSelected : {}),
                      }}
                      onClick={() => setSelectedPackageId(p.id)}
                    >
                      <div style={s.packageCode}>Code: {p.package_code}</div>
                      <div style={s.packageSize}>{p.package_size} {p.unit}</div>
                      <div style={s.packageDesc}>{p.description}</div>
                    </div>
                  ))
                )}
              </div>

              <button
                style={s.createBtn}
                onClick={() => setShowCreatePackage(true)}
              >
                + Create New Package
              </button>
            </div>
          )}

          {step === 2 && showCreatePackage && (
            <div style={s.stepContainer}>
              <h3 style={s.stepTitle}>Create New Package</h3>
              <div style={s.form}>
                <div style={s.formGroup}>
                  <label style={s.label}>Package Code <span style={s.req}>*</span></label>
                  <input
                    type="text"
                    placeholder="e.g. 01"
                    maxLength="2"
                    value={packageForm.package_code}
                    onChange={(e) => setPackageForm({ ...packageForm, package_code: e.target.value })}
                    style={s.input}
                  />
                  <span style={s.hint}>2-digit code</span>
                </div>

                <div style={s.formGroup}>
                  <label style={s.label}>Package Size <span style={s.req}>*</span></label>
                  <input
                    type="text"
                    placeholder="e.g. 100"
                    value={packageForm.package_size}
                    onChange={(e) => setPackageForm({ ...packageForm, package_size: e.target.value })}
                    style={s.input}
                  />
                </div>

                <div style={s.formGroup}>
                  <label style={s.label}>Unit <span style={s.req}>*</span></label>
                  <select
                    value={packageForm.unit}
                    onChange={(e) => setPackageForm({ ...packageForm, unit: e.target.value })}
                    style={s.input}
                  >
                    <option value="">— Select —</option>
                    <option value="TABLET">TABLET</option>
                    <option value="CAPSULE">CAPSULE</option>
                    <option value="ML">ML</option>
                    <option value="BOTTLE">BOTTLE</option>
                    <option value="BLISTER">BLISTER</option>
                  </select>
                </div>

                <div style={s.formGroup}>
                  <label style={s.label}>Description</label>
                  <input
                    type="text"
                    placeholder="e.g. 100 TABLET IN 1 BOTTLE"
                    value={packageForm.description}
                    onChange={(e) => setPackageForm({ ...packageForm, description: e.target.value })}
                    style={s.input}
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div style={s.stepContainer}>
              <h3 style={s.stepTitle}>Review NDC</h3>
              <p style={s.stepDesc}>
                Verify all details before creating the NDC.
              </p>

              <div style={s.ndcDisplay}>
                <div style={s.ndcSegment}>
                  <div style={s.segmentLabel}>LABELER</div>
                  <div style={s.segmentValue}>70095</div>
                </div>
                <div style={s.ndcSegment}>
                  <div style={s.segmentLabel}>PRODUCT</div>
                  <div style={s.segmentValue}>{product?.product_code}</div>
                </div>
                <div style={s.ndcSegment}>
                  <div style={s.segmentLabel}>PACKAGE</div>
                  <div style={s.segmentValue}>{pkg?.package_code}</div>
                </div>
              </div>

              <div style={s.ndcFull}>{generateNDC()}</div>

              <div style={s.reviewDetails}>
                <div style={s.reviewRow}>
                  <strong>Product:</strong>
                  <span>{product?.product_name}</span>
                </div>
                {/* <div style={s.reviewRow}>
                  <strong>Generic:</strong>
                  <span>{product?.generic_name || '-'}</span>
                </div> */}
                <div style={s.reviewRow}>
                  <strong>Strength:</strong>
                  <span>{product?.strength}</span>
                </div>
                <div style={s.reviewRow}>
                  <strong>Dosage Form:</strong>
                  <span>{product?.dosage_form}</span>
                </div>
                <div style={s.reviewRow}>
                  <strong>Package:</strong>
                  <span>{pkg?.package_size} {pkg?.unit}</span>
                </div>
                {pkg?.description && (
                  <div style={s.reviewRow}>
                    <strong>Description:</strong>
                    <span>{pkg.description}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={s.footer}>
          <button
            style={s.btnSecondary}
            onClick={handleBack}
            disabled={step === 1 || loading}
          >
            Back
          </button>
          <button
            style={s.btnSecondary}
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          {step < 3 && (
            <button
              style={s.btnPrimary}
              onClick={step === 1 && showCreateProduct ? handleCreateProduct : step === 2 && showCreatePackage ? handleCreatePackage : handleNext}
              disabled={loading}
            >
              {loading ? 'Processing...' : (showCreateProduct || showCreatePackage) ? 'Create & Continue' : 'Next'}
            </button>
          )}
          {step === 3 && (
            <button
              style={s.btnPrimary}
              onClick={handleCreateNDC}
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create NDC'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const s = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  modal: {
    background: 'white',
    borderRadius: '12px',
    width: '90%',
    maxWidth: '600px',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
  },
  header: {
    padding: '24px',
    borderBottom: '1px solid #E8E3D9',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1A1A1A',
    margin: 0,
  },
  stepIndicator: {
    fontSize: '12px',
    color: '#999',
    margin: 0,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '28px',
    cursor: 'pointer',
    color: '#999',
  },
  progressBar: {
    display: 'flex',
    gap: '8px',
    padding: '16px 24px',
    background: '#FAF8F5',
  },
  progressStep: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: '#E8E3D9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '600',
    color: '#999',
  },
  progressStepActive: {
    background: '#C4520A',
    color: 'white',
  },
  content: {
    flex: 1,
    overflow: 'auto',
    padding: '24px',
  },
  stepContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  stepTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1A1A1A',
    margin: 0,
  },
  stepDesc: {
    fontSize: '13px',
    color: '#666',
    margin: 0,
  },
  errorBox: {
    padding: '12px 14px',
    background: '#FEF2F2',
    border: '1px solid #FECACA',
    borderRadius: '7px',
    color: '#991B1B',
    fontSize: '13px',
    marginBottom: '12px',
  },
  productInfo: {
    padding: '12px',
    background: '#FFF0E6',
    borderRadius: '8px',
    marginBottom: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  productList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginBottom: '16px',
  },
  productCard: {
    padding: '12px',
    border: '1.5px solid #E8E3D9',
    borderRadius: '8px',
    cursor: 'pointer',
    background: '#FFFDFB',
  },
  productCardSelected: {
    border: '2px solid #C4520A',
    background: '#FFF0E6',
  },
  productName: {
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: '4px',
  },
  productCode: {
    fontSize: '12px',
    color: '#666',
  },
  productStrength: {
    fontSize: '12px',
    color: '#999',
  },
  packageList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginBottom: '16px',
  },
  packageCard: {
    padding: '12px',
    border: '1.5px solid #E8E3D9',
    borderRadius: '8px',
    cursor: 'pointer',
    background: '#FFFDFB',
  },
  packageCardSelected: {
    border: '2px solid #C4520A',
    background: '#FFF0E6',
  },
  packageCode: {
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: '4px',
  },
  packageSize: {
    fontSize: '12px',
    color: '#666',
  },
  packageDesc: {
    fontSize: '12px',
    color: '#999',
  },
  createBtn: {
    padding: '10px 16px',
    background: 'white',
    border: '1.5px solid #C4520A',
    color: '#C4520A',
    borderRadius: '7px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  },
  label: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#374151',
  },
  req: {
    color: '#DC2626',
  },
  input: {
    padding: '9px 12px',
    border: '1.5px solid #E8E3D9',
    borderRadius: '7px',
    fontSize: '13px',
    background: '#FAF8F5',
    outline: 'none',
    color: '#1A1A1A',
  },
  hint: {
    fontSize: '11px',
    color: '#94A3B8',
  },
  emptyState: {
    padding: '24px',
    textAlign: 'center',
    color: '#999',
  },
  ndcDisplay: {
    display: 'flex',
    gap: '12px',
    marginBottom: '20px',
    justifyContent: 'center',
  },
  ndcSegment: {
    padding: '12px',
    background: '#FAF8F5',
    borderRadius: '8px',
    minWidth: '80px',
    textAlign: 'center',
  },
  segmentLabel: {
    fontSize: '10px',
    color: '#999',
    fontWeight: '600',
    marginBottom: '4px',
  },
  segmentValue: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#C4520A',
  },
  ndcFull: {
    padding: '16px',
    background: '#1A1A1A',
    color: 'white',
    borderRadius: '8px',
    textAlign: 'center',
    fontFamily: 'Consolas, monospace',
    fontSize: '24px',
    fontWeight: '700',
    letterSpacing: '2px',
    marginBottom: '20px',
  },
  reviewDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  reviewRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    padding: '8px',
    background: '#FAF8F5',
    borderRadius: '6px',
  },
  footer: {
    padding: '16px 24px',
    borderTop: '1px solid #E8E3D9',
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end',
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
    padding: '10px 20px',
    background: 'white',
    color: '#666',
    border: '1.5px solid #E8E3D9',
    borderRadius: '7px',
    fontSize: '13px',
    cursor: 'pointer',
  },
};
