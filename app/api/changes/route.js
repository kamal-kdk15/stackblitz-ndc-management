import { NextResponse } from 'next/server';
import { readData, writeData } from '../../lib/jsonDB';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await readData('changes.json');
    return NextResponse.json({ success: true, data: Array.isArray(data) ? data : [] });
  } catch (error) {
    console.error('Changes GET Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch change requests' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { originalNdc, changeType, reason, requestedBy } = await request.json();

    const registry = await readData('ndc.json');
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

    const changes = await readData('changes.json');
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
    await writeData('changes.json', changes);

    const audit = await readData('audit.json');
    audit.unshift({
      id: audit.length + 1,
      action: 'CHANGE_REQUESTED',
      performedBy: requestedBy,
      recordId: originalNdc,
      oldValue: originalNdc,
      newValue: changeType,
      timestamp: new Date().toLocaleString()
    });
    await writeData('audit.json', audit);

    return NextResponse.json({ success: true, data: newReq });
  } catch (error) {
    console.error('Changes POST Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create change request' },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const { id, status, reviewedBy } = await request.json();
    const changes = await readData('changes.json');
    const req = changes.find(c => c.id === id);

    if (!req) {
      return NextResponse.json(
        { success: false, message: 'Not found' },
        { status: 404 }
      );
    }

    req.status = status;
    req.reviewedBy = reviewedBy;
    await writeData('changes.json', changes);

    const audit = await readData('audit.json');
    audit.unshift({
      id: audit.length + 1,
      action: 'CHANGE_REVIEWED',
      performedBy: reviewedBy,
      recordId: req.originalNdc,
      oldValue: 'Pending',
      newValue: status,
      timestamp: new Date().toLocaleString()
    });
    await writeData('audit.json', audit);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Changes PATCH Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update change request' },
      { status: 500 }
    );
  }
}