import fs from 'fs/promises';
import path from 'path';
import pkg from 'pg';
const { Pool } = pkg
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const dataDir = path.join(process.cwd(), 'app', 'data');

async function readFallbackData(fileName) {
  try {
    const filePath = path.join(dataDir, fileName);
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    console.warn('Fallback JSON read failed for', fileName, error.message);
    return [];
  }
}

async function writeFallbackData(fileName, data) {
  try {
    const filePath = path.join(dataDir, fileName);
    const json = JSON.stringify(data, null, 2);
    await fs.mkdir(dataDir, { recursive: true });
    await fs.writeFile(filePath, json, 'utf8');
  } catch (error) {
    console.warn('Fallback JSON write failed for', fileName, error.message);
  }
}

export async function readData(fileName) {
  try {
    if (fileName === 'users.json') {
      const result = await pool.query('SELECT * FROM users');
      return result.rows.map((r) => ({
        id: r.id,
        name: r.name,
        email: r.email,
        password: r.password,
        role: r.role,
        isActive: r.is_active ?? r.isActive ?? true,
      }));

    } else if (fileName === 'ndc.json') {
      const result = await pool.query(
        'SELECT * FROM ndc_registry ORDER BY id DESC'
      );
      return result.rows.map(r => ({
        id: r.id,
        ndc_code: r.ndc_code,
        product_name: r.product_name,
        strength: r.strength,
        dosage_form: r.dosage_form,
        rx_otc: r.rx_otc,
        anda_number: r.anda_number,
        distributor: r.distributor,
        labeler_code: r.labeler_code,
        status: r.status,
        created_by: r.created_by,
        created_at: r.created_at
      }));

    } else if (fileName === 'audit.json') {
      const result = await pool.query(
        'SELECT * FROM audit_log ORDER BY id DESC'
      );
      return result.rows.map(r => ({
        id: r.id,
        action: r.action,
        performedBy: r.performed_by,
        recordId: r.record_id,
        oldValue: r.old_value,
        newValue: r.new_value,
        timestamp: r.timestamp
      }));

    } else if (fileName === 'changes.json') {
      const result = await pool.query(
        'SELECT * FROM change_requests ORDER BY id DESC'
      );
      return result.rows.map(r => ({
        id: r.id,
        originalNdc: r.original_ndc,
        changeType: r.change_type,
        reason: r.reason,
        impact: r.impact,
        status: r.status,
        requestedBy: r.requested_by,
        reviewedBy: r.reviewed_by,
        created_at: r.created_at
      }));
    } else if (fileName === 'ndc_requests.json') {
      const result = await pool.query(
        'SELECT * FROM ndc_requests ORDER BY id DESC'
      );
      return result.rows.map(r => ({
        id: r.id,
        product_name: r.product_name,
        strength: r.strength,
        dosage_form: r.dosage_form,
        rx_otc: r.rx_otc,
        anda_number: r.anda_number,
        distributor: r.distributor,
        status: r.status,
        created_by: r.created_by,
        reviewed_by: r.reviewed_by,
        created_at: r.created_at,
        reviewed_at: r.reviewed_at
      }));
    } else if (fileName === 'products.json') {
  const result = await pool.query(
    'SELECT * FROM products ORDER BY id DESC'
  );

  return result.rows.map(r => ({
    id: r.id,
    product_code: r.product_code,
    product_name: r.product_name,
    strength: r.strength,
    dosage_form: r.dosage_form,
    rx_otc: r.rx_otc,
    anda_number: r.anda_number,
    status: r.status,
    created_by: r.created_by,
    created_at: r.created_at
  }));
 } else if (fileName === 'packages.json') {
  const result = await pool.query(
    'SELECT * FROM packages ORDER BY id DESC'
  );

  return result.rows.map(r => ({
    id: r.id,
    package_code: r.package_code,
    product_id: r.product_id,
    package_size: r.package_size,
    unit: r.unit,
    description: r.description,
    status: r.status,
    created_by: r.created_by,
    created_at: r.created_at
  }));
}
    return [];
  } catch (e) {
    console.error('DB Read Error:', e);
    return readFallbackData(fileName);
  }
}

export async function writeData(fileName, data) {
  try {
    const item = Array.isArray(data) ? data[0] : data;
    if (!item) return;

   if (fileName === 'ndc.json') {

  // BULK STATUS UPDATE FOR ALL NDCs OF A PRODUCT
  if (item._bulkUpdate) {
     console.log(' NDC bulk update called with:', {
    status: item.status,
    product_code: item.product_code,
    product_code_type: typeof item.product_code
  });

    const result = await pool.query(`
  UPDATE ndc_registry
  SET status = $1
  WHERE TRIM(split_part(ndc_code, '-', 2)) = TRIM($2)
  RETURNING *
`, [
  item.status,
  item.product_code
]);
 console.log(' NDC bulk update result:', result.rowCount, 'rows affected');
    return result.rows;
  }

  // SINGLE NDC STATUS UPDATE
  else if (item._update) {

    const result = await pool.query(`
      UPDATE ndc_registry
      SET status = $1
      WHERE ndc_code = $2
      RETURNING *
    `, [
      item.status,
      item.ndc_code
    ]);

    return result.rows[0];
  }

  // CREATE NDC
  else {

    const result = await pool.query(`
      INSERT INTO ndc_registry
      (
        ndc_code,
        product_name,
        strength,
        dosage_form,
        rx_otc,
        anda_number,
        distributor,
        status,
        created_by,
        created_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      ON CONFLICT (ndc_code) DO NOTHING
      RETURNING *
    `, [
      item.ndc_code,
      item.product_name,
      item.strength,
      item.dosage_form,
      item.rx_otc,
      item.anda_number,
      item.distributor || '-',
      item.status,
      item.created_by,
      item.created_at
    ]);

    return result.rows[0];
  }


    } else if (fileName === 'audit.json') {
      await pool.query(`
        INSERT INTO audit_log
        (action, performed_by, record_id,
         old_value, new_value, timestamp)
        VALUES ($1,$2,$3,$4,$5,$6)
      `, [
        item.action, item.performedBy, item.recordId,
        item.oldValue, item.newValue, item.timestamp
      ]);

    } else if (fileName === 'changes.json') {
      if (item.reviewedBy) {
        await pool.query(`
          UPDATE change_requests
          SET status=$1, reviewed_by=$2
          WHERE id=$3
        `, [item.status, item.reviewedBy, item.id]);
      } else {
        await pool.query(`
          INSERT INTO change_requests
          (original_ndc, change_type, reason, impact,
           status, requested_by, created_at)
          VALUES ($1,$2,$3,$4,$5,$6,$7)
        `, [
          item.originalNdc, item.changeType, item.reason,
          item.impact, item.status, item.requestedBy,
          item.created_at
        ]);
      }
    } else if (fileName === 'ndc_requests.json') {
      if (item._update) {
        await pool.query(`
          UPDATE ndc_requests
          SET status=$1, reviewed_by=$2, reviewed_at=$3
          WHERE id=$4
        `, [item.status, item.reviewed_by, item.reviewed_at, item.id]);
      } else {
        await pool.query(`
          INSERT INTO ndc_requests
          (product_name, strength, dosage_form, rx_otc,
           anda_number, distributor, status, created_by, created_at)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        `, [
          item.product_name, item.strength, item.dosage_form,
          item.rx_otc, item.anda_number, item.distributor || '-',
          item.status, item.created_by, item.created_at
        ]);
      }
    }   else if (fileName === 'products.json') {
 if (item._update) {

  const result = await pool.query(`
    UPDATE products
    SET product_name = COALESCE($1, product_name),
        strength = COALESCE($2, strength),
        dosage_form = COALESCE($3, dosage_form),
        rx_otc = COALESCE($4, rx_otc),
        anda_number = COALESCE($5, anda_number),
        status = COALESCE($6, status)
    WHERE id = $7
    RETURNING *
  `, [
    item.product_name ?? null,
    item.strength ?? null,
    item.dosage_form ?? null,
    item.rx_otc ?? null,
    item.anda_number ?? null,
    item.status ?? null,
    item.id
  ]);

  return result.rows[0];

} else {

    const result = await pool.query(`
      INSERT INTO products
      (
        product_code,
        product_name,
        strength,
        dosage_form,
        rx_otc,
        anda_number,
        status,
        created_by,
        created_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *
    `, [
      item.product_code,
      item.product_name,
      item.strength,
      item.dosage_form,
      item.rx_otc,
      item.anda_number,
      item.status,
      item.created_by,
      item.created_at
    ]);

    return result.rows[0];
  
  }
  
   }

  else if (fileName === 'packages.json') {


  if (item._bulkUpdate) {

    const result = await pool.query(`
      UPDATE packages
      SET status = $1
      WHERE product_id = $2
      RETURNING *
    `, [
      item.status,
      item.product_id
    ]);

    return result.rows;
  }

  
 if (item._update) {

  const result = await pool.query(`
    UPDATE packages
    SET package_size = COALESCE($1, package_size),
        unit = COALESCE($2, unit),
        description = COALESCE($3, description),
        status = COALESCE($4, status)
    WHERE id = $5
    RETURNING *
  `, [
    item.package_size ?? null,
    item.unit ?? null,
    item.description ?? null,
    item.status ?? null,
    item.id
  ]);

  const updatedPackage = result.rows[0];

  // Sync corresponding NDC status
  if (updatedPackage && updatedPackage.status) {

    const productResult = await pool.query(`
      SELECT product_code
      FROM products
      WHERE id = $1
    `, [updatedPackage.product_id]);

    const product = productResult.rows[0];

    if (product) {

      await pool.query(`
        UPDATE ndc_registry
        SET status = $1
        WHERE split_part(ndc_code, '-', 2) = $2
          AND split_part(ndc_code, '-', 3) = $3
      `, [
        updatedPackage.status,
        product.product_code,
        updatedPackage.package_code
      ]);
    }
  }

  return updatedPackage;
}


  const result = await pool.query(`
    INSERT INTO packages
    (
      package_code,
      product_id,
      package_size,
      unit,
      description,
      status,
      created_by,
      created_at
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    RETURNING *
  `, [
    item.package_code,
    item.product_id,
    item.package_size,
    item.unit,
    item.description,
    item.status,
    item.created_by,
    item.created_at
  ]);

  return result.rows[0];
}

  } catch (e) {
  console.error(`DB Write Error [${fileName}]:`, e);
  throw e;
}
}