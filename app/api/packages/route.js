import { NextResponse } from 'next/server';
import { readData, writeData } from '../../lib/jsonDB';
import { logAudit } from '../../lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const productId = request.nextUrl.searchParams.get('product_id');
    const data = await readData('packages.json');

    if (productId) {
      return NextResponse.json({
        success: true,
        data: data.filter(p => p.product_id == productId)
      });
    }

    return NextResponse.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Packages GET Error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch packages'
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const {
      package_code,
      product_id,
      package_size,
      unit,
      description,
      created_by,
      role
    } = await request.json();

    if (role === 'Viewer') {
      return NextResponse.json(
        {
          success: false,
          message: 'Access Denied — Viewers cannot create packages'
        },
        { status: 403 }
      );
    }

    if (role !== 'SPOC' && role !== 'Admin') {
      return NextResponse.json(
        {
          success: false,
          message: 'Only SPOC or Admin can create packages'
        },
        { status: 403 }
      );
    }

    if (!package_code || !product_id || !package_size || !unit) {
      return NextResponse.json(
        {
          success: false,
          message: 'All mandatory fields are required'
        },
        { status: 400 }
      );
    }

    // Validate package code format (2 digits)
    if (!/^\d{2}$/.test(package_code)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Package Code must be exactly 2 digits'
        },
        { status: 400 }
      );
    }

    // Validate product exists
    const products = await readData('products.json');
    const productExists = products.some(p => p.id == product_id);

    if (!productExists) {
      return NextResponse.json(
        {
          success: false,
          message: 'Product not found'
        },
        { status: 404 }
      );
    }

    const packages = await readData('packages.json');
    
    // Check if package code already exists for this product
    if (packages.some(p => p.package_code === package_code && p.product_id == product_id)) {
      return NextResponse.json(
        {
          success: false,
          message: `Package Code ${package_code} already exists for this product`
        },
        { status: 409 }
      );
    }

    const newPackage = {
  package_code,
  product_id,
  package_size,
  unit,
  description: description || '-',
   status: 'Active',
  created_by,
  created_at: new Date().toISOString()
};

   const createdPackage = await writeData(
  'packages.json',
  newPackage
);

await logAudit(
  'PACKAGE_CREATED',
  created_by,
  `${createdPackage.package_code}-for-product-${createdPackage.product_id}`,
  '-',
  createdPackage.package_code
);

return NextResponse.json({
  success: true,
  message: 'Package created successfully',
  package: createdPackage
});
  } catch (error) {
    console.error('Packages POST Error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create package'
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const {
      id,
      package_size,
      unit,
      description,
      status,
      updated_by,
      role
    } = await request.json();

    // Permission check
    if (role !== 'SPOC' && role !== 'Admin') {
      return NextResponse.json(
        {
          success: false,
          message: 'Only SPOC or Admin can update packages'
        },
        { status: 403 }
      );
    }

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: 'Package ID is required'
        },
        { status: 400 }
      );
    }

    // Get existing package
    const packages = await readData('packages.json');
    const pkg = packages.find(p => p.id == id);

    if (!pkg) {
      return NextResponse.json(
        {
          success: false,
          message: 'Package not found'
        },
        { status: 404 }
      );
    }

   
    if (status) {

      const oldStatus = pkg.status;

      await writeData('packages.json', {
        _update: true,
        id: pkg.id,
        package_size: pkg.package_size,
        unit: pkg.unit,
        description: pkg.description || '-',
        status
      });

      await logAudit(
        'PACKAGE_STATUS_CHANGED',
        updated_by,
        pkg.package_code,
        oldStatus,
        status
      );

      return NextResponse.json({
        success: true,
        message: `Package status updated to ${status}`
      });
    }

  
    if (!package_size || !unit) {
      return NextResponse.json(
        {
          success: false,
          message: 'Package Size and Unit are required'
        },
        { status: 400 }
      );
    }

    await writeData('packages.json', {
      _update: true,
      id: pkg.id,
      package_size,
      unit,
      description: description || '-',
      status: pkg.status
    });

    await logAudit(
      'PACKAGE_UPDATED',
      updated_by,
      pkg.package_code,
      '-',
      'Package details updated'
    );

    return NextResponse.json({
      success: true,
      message: 'Package updated successfully'
    });

  } catch (error) {
    console.error('Packages PATCH Error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update package'
      },
      { status: 500 }
    );
  }
}
