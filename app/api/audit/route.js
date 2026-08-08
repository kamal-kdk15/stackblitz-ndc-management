import { NextResponse } from 'next/server';
import { readData } from '../../lib/jsonDB';

export async function GET() {
  const data = readData('audit.json');
  return NextResponse.json({ success: true, data });
}