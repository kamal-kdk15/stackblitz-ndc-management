import { NextResponse } from 'next/server';
import { readData, writeData } from '../../lib/jsonDB';

export async function GET() {
  const data = readData('changes.json');
  return NextResponse.json({ success: true, data });
}

export async function POST(request) {
  const { originalNdc, changeType, reason, requestedBy } = await request.json();

  const registry = readData('ndc.json');
  if (!registry.find(r => r.ndc_code === originalNdc)) {
    return NextResponse.json(
      { success: false, message: 'NDC not found' },
      { status: 404 }
    );
  }

  const impact =
    changeType === 'pack' ? 'New Package Code only — Product Code unchanged'
    : changeType === 'strength' ? 'New Product Code required — full NDC reassignment'
    : 'New Product Code required — ANDA amendment may be needed';

  const changes = readData('changes.json');
  const newReq = {
    id: changes.length + 1,
    originalNdc,
    changeType,
    reason,
    impact,
    status: 'Pending',
    requestedBy,
    reviewedBy: null,
    created_at: new Date().toLocaleString()
  };

  changes.unshift(newReq);
  writeData('changes.json', changes);

  // Audit
  const audit = readData('audit.json');
  audit.unshift({
    id: audit.length + 1,
    action: 'CHANGE_REQUESTED',
    performedBy: requestedBy,
    recordId: originalNdc,
    oldValue: originalNdc,
    newValue: changeType,
    timestamp: new Date().toLocaleString()
  });
  writeData('audit.json', audit);

  return NextResponse.json({ success: true, data: newReq });
}

export async function PATCH(request) {
  const { id, status, reviewedBy } = await request.json();
  const changes = readData('changes.json');
  const req = changes.find(c => c.id === id);

  if (!req) {
    return NextResponse.json(
      { success: false, message: 'Not found' },
      { status: 404 }
    );
  }

  req.status = status;
  req.reviewedBy = reviewedBy;
  writeData('changes.json', changes);

  // Audit
  const audit = readData('audit.json');
  audit.unshift({
    id: audit.length + 1,
    action: 'CHANGE_REVIEWED',
    performedBy: reviewedBy,
    recordId: req.originalNdc,
    oldValue: 'Pending',
    newValue: status,
    timestamp: new Date().toLocaleString()
  });
  writeData('audit.json', audit);

  return NextResponse.json({ success: true });
}