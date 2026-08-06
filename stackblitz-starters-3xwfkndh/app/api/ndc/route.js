import { NextResponse } from 'next/server';
import { readData, writeData } from '../../lib/jsonDB';

export async function GET() {
  const data = readData('ndc.json');
  return NextResponse.json({ success: true, data });
}

export async function POST(request) {
  const { product, strength, dosage, rxOtc, anda,
          distributor, packs, createdBy, role } = await request.json();

  if (role === 'Viewer') {
    return NextResponse.json(
      { success: false, message: 'Access Denied — Viewers cannot create NDC' },
      { status: 403 }
    );
  }

  if (!product || !strength || !dosage || !rxOtc || !anda || !packs) {
    return NextResponse.json(
      { success: false, message: 'All mandatory fields are required' },
      { status: 400 }
    );
  }

  const registry = readData('ndc.json');
  const labeler = '70095';
  const productCode = String(
    new Set(registry.map(r => r.ndc_code.split('-')[1])).size + 1
  ).padStart(3, '0');

  const generated = [];

  for (let i = 1; i <= parseInt(packs); i++) {
    const pkgCode = String(i).padStart(2, '0');
    const ndc = `${labeler}-${productCode}-${pkgCode}`;

    if (registry.find(r => r.ndc_code === ndc)) {
      return NextResponse.json(
        { success: false, message: `Duplicate NDC: ${ndc}` },
        { status: 409 }
      );
    }

    registry.push({
      id: registry.length + 1,
      ndc_code: ndc,
      product_name: product,
      strength,
      dosage_form: dosage,
      rx_otc: rxOtc,
      anda_number: anda,
      distributor: distributor || '-',
      labeler_code: labeler,
      status: 'Active',
      created_by: createdBy,
      created_at: new Date().toLocaleString()
    });

    generated.push(ndc);
  }

  writeData('ndc.json', registry);

  // Audit
  const audit = readData('audit.json');
  audit.unshift({
    id: audit.length + 1,
    action: 'NDC_CREATED',
    performedBy: createdBy,
    recordId: generated.join(', '),
    oldValue: '-',
    newValue: generated.join(', '),
    timestamp: new Date().toLocaleString()
  });
  writeData('audit.json', audit);

  return NextResponse.json({
    success: true,
    message: 'NDC Generated Successfully',
    ndcCodes: generated
  });
}

export async function PATCH(request) {
  const { ndc_code, status, updatedBy } = await request.json();
  const registry = readData('ndc.json');
  const record = registry.find(r => r.ndc_code === ndc_code);

  if (!record) {
    return NextResponse.json(
      { success: false, message: 'NDC not found' },
      { status: 404 }
    );
  }

  const oldStatus = record.status;
  record.status = status;
  writeData('ndc.json', registry);

  // Audit
  const audit = readData('audit.json');
  audit.unshift({
    id: audit.length + 1,
    action: 'STATUS_CHANGED',
    performedBy: updatedBy,
    recordId: ndc_code,
    oldValue: oldStatus,
    newValue: status,
    timestamp: new Date().toLocaleString()
  });
  writeData('audit.json', audit);

  return NextResponse.json({ success: true, message: 'Status updated' });
}