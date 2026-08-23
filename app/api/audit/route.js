import { NextResponse } from 'next/server';
import { readData } from '../../lib/jsonDB';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const sp = request.nextUrl.searchParams;

    const filters = {
      search: sp.get('search') || undefined,
      action: sp.get('action') || undefined,
      dateFrom: sp.get('dateFrom') || undefined,
      dateTo: sp.get('dateTo') || undefined,
    };

    const data = await readData('audit.json', filters);

    return NextResponse.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Audit API Error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch audit logs'
      },
      { status: 500 }
    );
  }
}