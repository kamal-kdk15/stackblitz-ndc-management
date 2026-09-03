import { NextResponse } from 'next/server';
import { readData } from '../../lib/jsonDB';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const sp = request.nextUrl.searchParams;

    // Pagination
    const page = Math.max(
      parseInt(sp.get('page')) || 1,
      1
    );

    const pageSize = Math.min(
      Math.max(
        parseInt(sp.get('pageSize')) || 50,
        1
      ),
      100
    );

    const filters = {
      search: sp.get('search') || undefined,
      action: sp.get('action') || undefined,
      dateFrom: sp.get('dateFrom') || undefined,
      dateTo: sp.get('dateTo') || undefined,
    };

    const result = await readData(
      'audit.json',
      filters,
      {
        page,
        pageSize,
      }
    );

    return NextResponse.json({
      success: true,
      data: result.data,
      total: result.total,
      page,
      pageSize,
      totalPages: Math.ceil(result.total / pageSize),
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