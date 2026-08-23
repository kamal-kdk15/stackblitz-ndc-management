import { NextResponse } from 'next/server';
import { readData, writeData } from '../../lib/jsonDB';
import { logAudit } from '../../lib/audit';
import { validateAssignedCodes } from '../../lib/ndcRules.mjs';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const sp = request.nextUrl.searchParams;
    const type = sp.get('type');

    if (type === 'pending') {
      const pendingRequests = await readData('ndc_requests.json');
      return NextResponse.json({
        success: true,
        data: pendingRequests.filter((item) => item.status !== 'Activated')
      });
    }

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
    const body = await request.json();

    // Determine if this is wizard-based creation or old SPOC submission
    const isWizard = body.ndc_code || body.product_code;

    if (body.role === 'Viewer') {
      return NextResponse.json(
        {
          success: false,
          message: 'Access Denied — Viewers cannot create NDC'
        },
        { status: 403 }
      );
    }

    if (isWizard) {
      // Wizard-based creation from Product + Package selection
      const {
        ndc_code,
        product_name,
        strength,
        dosage_form,
        rx_otc,
        anda_number,
        distributor,
        created_by,
        role
      } = body;

      if (!ndc_code || !product_name) {
        return NextResponse.json(
          {
            success: false,
            message: 'Missing required fields'
          },
          { status: 400 }
        );
      }

      // Check if NDC already exists
      const registry = await readData('ndc.json');
      if (registry.some(r => r.ndc_code === ndc_code)) {
        return NextResponse.json(
          {
            success: false,
            message: `NDC ${ndc_code} already exists`
          },
          { status: 409 }
        );
      }

      const newNDC = {
        id: Date.now(),
        ndc_code,
        product_name,
        strength,
        dosage_form,
        rx_otc,
        anda_number,
        distributor: distributor || '-',
        labeler_code: '70095',
        status: 'Active',
        created_by,
        created_at: new Date().toISOString()
      };

      await writeData('ndc.json', newNDC);
      await logAudit(
        'NDC_CREATED',
        created_by,
        ndc_code,
        '-',
        ndc_code
      );

      return NextResponse.json({
        success: true,
        message: 'NDC created successfully',
        ndc: newNDC
      });
    } else {
      // Old SPOC submission flow (if still in use)
      const {
        product,
        strength,
        dosage,
        rxOtc,
        anda,
        distributor,
        createdBy,
        role
      } = body;

      if (!product || !strength || !dosage || !rxOtc || !anda) {
        return NextResponse.json(
          {
            success: false,
            message: 'All mandatory fields are required'
          },
          { status: 400 }
        );
      }

      if (role !== 'SPOC') {
        return NextResponse.json(
          {
            success: false,
            message: 'Only SPOCs can submit NDC requests'
          },
          { status: 403 }
        );
      }

      const newRequest = {
        id: Date.now(),
        product_name: product,
        strength,
        dosage_form: dosage,
        rx_otc: rxOtc,
        anda_number: anda,
        distributor: distributor || '-',
        status: 'PendingAdminReview',
        created_by: createdBy,
        created_at: new Date().toISOString()
      };

      await writeData('ndc_requests.json', newRequest);
      await logAudit(
        'NDC_REQUEST_SUBMITTED',
        createdBy,
        String(newRequest.id),
        '-',
        'PendingAdminReview'
      );

      return NextResponse.json({
        success: true,
        message: 'NDC request submitted successfully and is awaiting admin approval.',
        requestId: newRequest.id
      });
    }
  } catch (error) {
    console.error('NDC POST Error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create NDC'
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const {
      id,
      action,
      updatedBy,
      role
    } = await request.json();

    if (role !== 'Admin') {
      return NextResponse.json(
        {
          success: false,
          message: 'Only Admin can manage NDC'
        },
        { status: 403 }
      );
    }

    if (!id || !action) {
      return NextResponse.json(
        {
          success: false,
          message: 'Request ID and action are required'
        },
        { status: 400 }
      );
    }

    const pendingRequests = await readData('ndc_requests.json');
    const requestItem = pendingRequests.find(
      (item) => String(item.id) === String(id)
    );

    if (!requestItem) {
      return NextResponse.json(
        {
          success: false,
          message: 'NDC request not found'
        },
        { status: 404 }
      );
    }

    if (action === 'activate') {
      if (requestItem.status === 'Activated') {
        return NextResponse.json(
          {
            success: false,
            message: 'This NDC is already activated'
          },
          { status: 409 }
        );
      }

      const newRecord = {
        ndc_code: requestItem.ndc_code,
        product_name: requestItem.product_name,
        strength: requestItem.strength,
        dosage_form: requestItem.dosage_form,
        rx_otc: requestItem.rx_otc,
        anda_number: requestItem.anda_number,
        distributor: requestItem.distributor || '-',
        labeler_code: '70095',
        status: 'Active',
        created_by: requestItem.created_by,
        created_at: requestItem.created_at || new Date().toISOString()
      };

      await writeData('ndc.json', newRecord);
      await writeData('ndc_requests.json', {
        _update: true,
        id: requestItem.id,
        status: 'Activated',
        reviewed_by: updatedBy,
        reviewed_at: new Date().toISOString()
      });

      await logAudit(
        'NDC_ACTIVATED',
        updatedBy,
        requestItem.ndc_code,
        'PendingAdminReview',
        'Active'
      );

      return NextResponse.json({
        success: true,
        message: 'NDC activated successfully.',
        ndcCode: requestItem.ndc_code
      });
    } else if (action === 'deactivate') {
      const registry = await readData('ndc.json');
      const ndcRecord = registry.find((r) => r.ndc_code === requestItem.ndc_code);

      if (!ndcRecord) {
        return NextResponse.json(
          {
            success: false,
            message: 'NDC not found in registry'
          },
          { status: 404 }
        );
      }

      await writeData('ndc.json', {
        _update: true,
        ndc_code: requestItem.ndc_code,
        status: 'Inactive'
      });

      await logAudit(
        'NDC_DEACTIVATED',
        updatedBy,
        requestItem.ndc_code,
        'Active',
        'Inactive'
      );

      return NextResponse.json({
        success: true,
        message: 'NDC deactivated successfully.',
        ndcCode: requestItem.ndc_code
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid action. Use activate or deactivate.'
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('NDC PATCH Error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update NDC'
      },
      { status: 500 }
    );
  }
}