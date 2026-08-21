import { NextResponse } from 'next/server';
import { readData, writeData } from '../../lib/jsonDB';
import { logAudit } from '../../lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const data = await readData('products.json');

    return NextResponse.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Products GET Error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch products'
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
   const {
  product_code,
  product_name,
  strength,
  dosage_form,
  rx_otc,
  anda_number,
  created_by,
  role
} = await request.json();

    if (role === 'Viewer') {
      return NextResponse.json(
        {
          success: false,
          message: 'Access Denied — Viewers cannot create products'
        },
        { status: 403 }
      );
    }

    if (role !== 'SPOC' && role !== 'Admin') {
      return NextResponse.json(
        {
          success: false,
          message: 'Only SPOC or Admin can create products'
        },
        { status: 403 }
      );
    }

    if (!product_code || !product_name || !strength || !dosage_form || !rx_otc || !anda_number) {
      return NextResponse.json(
        {
          success: false,
          message: 'All mandatory fields are required'
        },
        { status: 400 }
      );
    }

    // Validate ANDA format
    if (!/^ANDA\d+$/.test(anda_number)) {
      return NextResponse.json(
        {
          success: false,
          message: 'ANDA must start with "ANDA" followed by numbers only'
        },
        { status: 400 }
      );
    }

    // Validate product code format (3 digits)
    if (!/^\d{3}$/.test(product_code)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Product Code must be exactly 3 digits'
        },
        { status: 400 }
      );
    }

    const products = await readData('products.json');
    
    // Check if product code already exists
    if (products.some(p => p.product_code === product_code)) {
      return NextResponse.json(
        {
          success: false,
          message: `Product Code ${product_code} already exists`
        },
        { status: 409 }
      );
    }

    const newProduct = {
  product_code,
  product_name,
  strength,
  dosage_form,
  rx_otc,
  anda_number,
  status: 'Active',
  created_by,
  created_at: new Date().toISOString()
};

const createdProduct = await writeData(
  'products.json',
  newProduct
);

await logAudit(
  'PRODUCT_CREATED',
  created_by,
  `${createdProduct.product_code}-${createdProduct.product_name}`,
  '-',
  createdProduct.product_code
);

return NextResponse.json({
  success: true,
  message: 'Product created successfully',
  product: createdProduct
});
  } catch (error) {
    console.error('Products POST Error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create product'
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const {
      id,
      product_name,
      strength,
      dosage_form,
      rx_otc,
      anda_number,
      status,
      updated_by,
      role
    } = await request.json();

    if (role !== 'SPOC' && role !== 'Admin') {
      return NextResponse.json(
        {
          success: false,
          message: 'Only SPOC or Admin can modify products'
        },
        { status: 403 }
      );
    }

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: 'Product ID is required'
        },
        { status: 400 }
      );
    }

    const products = await readData('products.json');

    const product = products.find(
      p => p.id == id
    );

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          message: 'Product not found'
        },
        { status: 404 }
      );
    }

    // STATUS update
if (
  status &&
  product_name === undefined &&
  strength === undefined &&
  dosage_form === undefined &&
  rx_otc === undefined &&
  anda_number === undefined
) {
  const oldStatus = product.status;

  await writeData('products.json', {
    _update: true,
  id,
  product_name,
  strength,
  dosage_form,
  rx_otc,
  anda_number,
  status
});

  await logAudit(
    'PRODUCT_STATUS_CHANGED',
    updated_by,
    product.product_code,
    oldStatus,
    status
  );

if (status === 'Inactive' && oldStatus !== 'Inactive') {

  // 1. Deactivate all packages belonging to this product
  const updatedPackages = await writeData('packages.json', {
    _bulkUpdate: true,
    product_id: id,
    status: 'Inactive'
  });

  if (updatedPackages?.length > 0) {
    await logAudit(
      'PACKAGES_AUTO_DEACTIVATED',
      updated_by,
      `product-${product.product_code}`,
      'Active',
      `Inactive (${updatedPackages.length} package(s) auto-deactivated)`
    );
  }

  // 2. Deactivate all NDCs belonging to this product
  const updatedNDCs = await writeData('ndc.json', {
    _bulkUpdate: true,
    product_code: product.product_code,
    status: 'Inactive'
  });

  if (updatedNDCs?.length > 0) {
    await logAudit(
      'NDCS_AUTO_DEACTIVATED',
      updated_by,
      `product-${product.product_code}`,
      'Active',
      `Inactive (${updatedNDCs.length} NDC(s) auto-deactivated)`
    );
  }
}


  return NextResponse.json({
    success: true,
    message: status === 'Inactive'
      ? `Product deactivated. All packages also deactivated.`
      : `Product status updated to ${status}`,
  });
}

    // FULL editing
    if (
      !product_name ||
      !strength ||
      !dosage_form ||
      !rx_otc ||
      !anda_number
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'All product fields are required'
        },
        { status: 400 }
      );
    }

    const updatedProduct = await writeData(
      'products.json',
      {
        _update: true,
        id,
        status: status || product.status,
        product_name,
        strength,
        dosage_form,
        rx_otc,
        anda_number
      }
    );

    await logAudit(
      'PRODUCT_UPDATED',
      updated_by,
      product.product_code,
      JSON.stringify({
        product_name: product.product_name,
        strength: product.strength,
        dosage_form: product.dosage_form,
        rx_otc: product.rx_otc,
        anda_number: product.anda_number
      }),
      JSON.stringify({
        product_name,
        strength,
        dosage_form,
        rx_otc,
        anda_number
      })
    );

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully',
      product: updatedProduct
    });

  } catch (error) {
    console.error('Products PATCH Error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update product'
      },
      { status: 500 }
    );
  }
}
