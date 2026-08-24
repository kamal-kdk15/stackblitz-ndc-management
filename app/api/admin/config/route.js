import { NextResponse } from 'next/server';
import { readData, writeData } from '../../../lib/jsonDB';
import { logAudit } from '../../../lib/audit';
import { getCurrentUser } from '../../../lib/auth';

export const dynamic = 'force-dynamic';

// GET — any logged-in user can read config (dashboard needs it for display)
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { success: false, message: 'Not authenticated' },
      { status: 401 }
    );
  }

  try {
    const config = await readData('config.json');
    return NextResponse.json({ success: true, data: config[0] || null });
  } catch (error) {
    console.error('Config GET Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch config' },
      { status: 500 }
    );
  }
}

// PATCH — Admin only
export async function PATCH(request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'Admin') {
    return NextResponse.json(
      { success: false, message: 'Admin access required' },
      { status: 403 }
    );
  }

  try {
    const { labeler_code, max_product_code } = await request.json();

    if (labeler_code && !/^\d{4,6}$/.test(labeler_code)) {
      return NextResponse.json(
        { success: false, message: 'Labeler code must be 4-6 digits' },
        { status: 400 }
      );
    }

    if (max_product_code && (max_product_code < 1 || max_product_code > 999)) {
      return NextResponse.json(
        { success: false, message: 'Max product code must be between 1 and 999' },
        { status: 400 }
      );
    }

  const existing = await readData('config.json');
const configId = existing[0]?.id;

if (!configId) {
  return NextResponse.json(
    { success: false, message: 'System config not initialized' },
    { status: 404 }
  );
}

const oldSnapshot = {                              // 👈 YE LINE MISSING THI
  labeler_code: existing[0].labelerCode,
  max_product_code: existing[0].maxProductCode
};

const updated = await writeData('config.json', {
  id: configId,
  labeler_code,
  max_product_code,
  updated_by: user.name
});

await logAudit(
  'SYSTEM_CONFIG_UPDATED',
  user.name,
  'system_config',
  JSON.stringify(oldSnapshot),
  JSON.stringify({
    labeler_code: labeler_code ?? oldSnapshot.labeler_code,
    max_product_code: max_product_code ?? oldSnapshot.max_product_code
  })
);
    return NextResponse.json({
      success: true,
      message: 'System configuration updated',
      config: updated
    });

  } catch (error) {
    console.error('Config PATCH Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update config' },
      { status: 500 }
    );
  }
}