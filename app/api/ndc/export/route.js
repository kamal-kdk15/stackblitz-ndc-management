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
      status: sp.get('status') || undefined,
      rx_otc: sp.get('rx_otc') || undefined,
      dosage_form: sp.get('dosage_form') || undefined,
      created_by: sp.get('created_by') || undefined,
      dateFrom: sp.get('dateFrom') || undefined,
      dateTo: sp.get('dateTo') || undefined,
    };

    const data = await readData('ndc.json', filters);

    const rows = data.map((r) => ({
      'NDC Code': r.ndc_code,
      'Product Name': r.product_name,
      'Strength': r.strength,
      'Dosage Form': r.dosage_form,
      'Rx / OTC': r.rx_otc,
      'ANDA Number': r.anda_number,
      'Distributor': r.distributor,
      'Labeler Code': r.labeler_code,
      'Status': r.status,
      'Created By': r.created_by,
      'Created At': r.created_at,
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet['!cols'] = [
      { wch: 16 }, { wch: 22 }, { wch: 12 }, { wch: 14 }, { wch: 8 },
      { wch: 14 }, { wch: 20 }, { wch: 14 }, { wch: 10 }, { wch: 14 }, { wch: 20 }
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'NDC Registry');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="ndc-registry-${new Date().toISOString().slice(0, 10)}.xlsx"`,
      },
    });

  } catch (error) {
    console.error('NDC Export Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to export registry' },
      { status: 500 }
    );
  }
}