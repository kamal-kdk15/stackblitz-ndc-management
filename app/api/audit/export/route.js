import { NextResponse } from 'next/server';
import { readData } from '../../../lib/jsonDB';
import { getCurrentUser } from '../../../lib/auth';
import * as XLSX from 'xlsx';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { success: false, message: 'Not authenticated' },
      { status: 401 }
    );
  }

  try {
    const sp = request.nextUrl.searchParams;

    const filters = {
      search: sp.get('search') || undefined,
      action: sp.get('action') || undefined,
      dateFrom: sp.get('dateFrom') || undefined,
      dateTo: sp.get('dateTo') || undefined,
    };

    const data = await readData('audit.json', filters);

    const rows = data.map((l) => ({
      'Action': l.action,
      'Performed By': l.performedBy,
      'Record': l.recordId,
      'Old Value': l.oldValue,
      'New Value': l.newValue,
      'Timestamp': l.timestamp,
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet['!cols'] = [
      { wch: 22 }, { wch: 18 }, { wch: 20 }, { wch: 28 }, { wch: 28 }, { wch: 20 }
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Audit Trail');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="audit-trail-${new Date().toISOString().slice(0, 10)}.xlsx"`,
      },
    });

  } catch (error) {
    console.error('Audit Export Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to export audit trail' },
      { status: 500 }
    );
  }
}