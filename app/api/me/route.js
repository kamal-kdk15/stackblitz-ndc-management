// app/api/me/route.js
import { NextResponse } from 'next/server';
import { getCurrentUser } from '../../lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          user: null
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user
    });

  } catch (error) {
    console.error('Me API error:', error);

    return NextResponse.json(
      {
        success: false,
        user: null
      },
      { status: 500 }
    );
  }
}