import fs from 'fs/promises';
import path from 'path';
import pkg from 'pg';
const { Pool } = pkg;

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
      if (item._update) {
        await pool.query(
          'UPDATE ndc_registry SET status=$1 WHERE ndc_code=$2',
          [item.status, item.ndc_code]
        );
      } else {
        await pool.query(`
          INSERT INTO ndc_registry
          (ndc_code, product_name, strength, dosage_form,
           rx_otc, anda_number, distributor, status,
           created_by, created_at)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
          ON CONFLICT (ndc_code) DO NOTHING
        `, [
          item.ndc_code, item.product_name, item.strength,
          item.dosage_form, item.rx_otc, item.anda_number,
          item.distributor || '-', item.status,
          item.created_by, item.created_at
        ]);
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
    }
  } catch (e) {
    console.error('DB Write Error:', e);

    if (Array.isArray(data)) {
      await writeFallbackData(fileName, data);
    } else {
      const existing = await readFallbackData(fileName);
      const next = Array.isArray(existing) ? [data, ...existing] : [data];
      await writeFallbackData(fileName, next);
    }
  }
}