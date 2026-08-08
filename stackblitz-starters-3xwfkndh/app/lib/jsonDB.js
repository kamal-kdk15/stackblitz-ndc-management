import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.join(process.cwd(), 'data.db'));

// Tables banao
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT, email TEXT UNIQUE,
    password TEXT, role TEXT,
    isActive INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS ndc_registry (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ndc_code TEXT UNIQUE,
    product_name TEXT, strength TEXT,
    dosage_form TEXT, rx_otc TEXT,
    anda_number TEXT, distributor TEXT,
    labeler_code TEXT DEFAULT '70095',
    status TEXT DEFAULT 'Active',
    created_by TEXT,
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS changes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    originalNdc TEXT, changeType TEXT,
    reason TEXT, impact TEXT,
    status TEXT DEFAULT 'Pending',
    requestedBy TEXT, reviewedBy TEXT,
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS audit (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action TEXT, performedBy TEXT,
    recordId TEXT, oldValue TEXT,
    newValue TEXT, timestamp TEXT
  );
`);

// Default users insert karo
const existingUsers = db.prepare('SELECT COUNT(*) as count FROM users').get();
if (existingUsers.count === 0) {
  db.prepare(`INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`).run('Admin User', 'admin@sunpharma.com', 'admin123', 'Admin');
  db.prepare(`INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`).run('Kamal Deep', 'kamal@sunpharma.com', 'kamal123', 'SPOC');
  db.prepare(`INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`).run('Viewer User', 'viewer@sunpharma.com', 'view123', 'Viewer');
}

export function readData(fileName) {
  const table = fileName.replace('.json', '');
  try {
    if (table === 'users') {
      return db.prepare('SELECT * FROM users').all();
    } else if (table === 'ndc') {
      return db.prepare('SELECT * FROM ndc_registry ORDER BY id DESC').all();
    } else if (table === 'changes') {
      return db.prepare('SELECT * FROM changes ORDER BY id DESC').all();
    } else if (table === 'audit') {
      return db.prepare('SELECT * FROM audit ORDER BY id DESC').all();
    }
  } catch (e) {
    console.error(e);
    return [];
  }
}

export function writeData(fileName, data) {
  const table = fileName.replace('.json', '');
  try {
    if (table === 'ndc') {
      const last = data[data.length - 1];
      if (!last) return;
      db.prepare(`
        INSERT OR IGNORE INTO ndc_registry 
        (ndc_code, product_name, strength, dosage_form, 
         rx_otc, anda_number, distributor, status, created_by, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        last.ndc_code, last.product_name, last.strength,
        last.dosage_form, last.rx_otc, last.anda_number,
        last.distributor, last.status, last.created_by, last.created_at
      );
    } else if (table === 'audit') {
      const last = data[0];
      if (!last) return;
      db.prepare(`
        INSERT INTO audit 
        (action, performedBy, recordId, oldValue, newValue, timestamp)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        last.action, last.performedBy, last.recordId,
        last.oldValue, last.newValue, last.timestamp
      );
    } else if (table === 'changes') {
      const last = data[0];
      if (!last) return;
      if (last.reviewedBy) {
        db.prepare(`
          UPDATE changes SET status=?, reviewedBy=? WHERE id=?
        `).run(last.status, last.reviewedBy, last.id);
      } else {
        db.prepare(`
          INSERT INTO changes 
          (originalNdc, changeType, reason, impact, 
           status, requestedBy, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          last.originalNdc, last.changeType, last.reason,
          last.impact, last.status, last.requestedBy, last.created_at
        );
      }
    }
  } catch (e) {
    console.error(e);
  }
}