import { NextResponse } from 'next/server';
import { readData, writeData } from '../../lib/jsonDB';
import { logAudit } from '../../lib/audit';

export async function GET() {
  try {
    const data = await readData('ndc.json');

    return NextResponse.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('NDC GET Error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch NDC data'
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const {
      product,
      strength,
      dosage,
      rxOtc,
      anda,
      distributor,
      packs,
      createdBy,
      role
    } = await request.json();

    if (role === 'Viewer') {
      return NextResponse.json(
        {
          success: false,
          message: 'Access Denied — Viewers cannot create NDC'
        },
        { status: 403 }
      );
    }

    if (
      !product ||
      !strength ||
      !dosage ||
      !rxOtc ||
      !anda ||
      !packs
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'All mandatory fields are required'
        },
        { status: 400 }
      );
    }

    const registry = await readData('ndc.json');

    const labeler = '70095';

    const productCode = String(
      new Set(
        registry.map(r => r.ndc_code.split('-')[1])
      ).size + 1
    ).padStart(3, '0');

    const generated = [];

    for (let i = 1; i <= parseInt(packs); i++) {
      const pkgCode = String(i).padStart(2, '0');

      const ndc = `${labeler}-${productCode}-${pkgCode}`;

      if (registry.find(r => r.ndc_code === ndc)) {
        return NextResponse.json(
          {
            success: false,
            message: `Duplicate NDC: ${ndc}`
          },
          { status: 409 }
        );
      }

      const newRecord = {
        ndc_code: ndc,
        product_name: product,
        strength,
        dosage_form: dosage,
        rx_otc: rxOtc,
        anda_number: anda,
        distributor: distributor || '-',
        labeler_code: labeler,
        status: 'Active',
        created_by: createdBy,
        created_at: new Date().toISOString()
      };

      await writeData('ndc.json', newRecord);

      generated.push(ndc);
    }

    // Audit Trail
    await logAudit(
      'NDC_CREATED',
      createdBy,
      generated.join(', '),
      '-',
      generated.join(', ')
    );

    return NextResponse.json({
      success: true,
      message: 'NDC Generated Successfully',
      ndcCodes: generated
    });

  } catch (error) {
    console.error('NDC POST Error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to generate NDC'
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const {
      ndc_code,
      status,
      updatedBy
    } = await request.json();

    const registry = await readData('ndc.json');

    const record = registry.find(
      r => r.ndc_code === ndc_code
    );

    if (!record) {
      return NextResponse.json(
        {
          success: false,
          message: 'NDC not found'
        },
        { status: 404 }
      );
    }

    const oldStatus = record.status;

    await writeData('ndc.json', {
      _update: true,
      ndc_code,
      status
    });

    // Audit Trail
    await logAudit(
      'STATUS_CHANGED',
      updatedBy,
      ndc_code,
      oldStatus,
      status
    );

    return NextResponse.json({
      success: true,
      message: 'Status updated'
    });

  } catch (error) {
    console.error('NDC PATCH Error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update status'
      },
      { status: 500 }
    );
  }
}