import { NextResponse } from 'next/server';
import { readData } from '../../../lib/jsonDB';

export async function GET() {
  try {
    const data = await readData('audit.json');

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