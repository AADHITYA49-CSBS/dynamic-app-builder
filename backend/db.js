const mysql = require('mysql2/promise');
require('dotenv').config();

/**
 * Create a connection pool for MySQL
 * Uses environment variables for configuration
 */
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'dynamic_app_builder',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
});

// Handle connection errors gracefully
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

pool.on('connection', () => {
  console.log('✓ New database connection established');
});

async function ensureSchema() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS forms (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        \`schema\` JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_forms_name (name)
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS form_submissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        form_id INT NOT NULL,
        data JSON,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_form_id (form_id),
        CONSTRAINT fk_form_submissions_form
          FOREIGN KEY (form_id) REFERENCES forms(id)
          ON DELETE CASCADE
      )
    `);

    // Migrate older column name if needed.
    const legacyColumn = await query(
      `SELECT COUNT(*) AS count
       FROM information_schema.columns
       WHERE table_schema = ?
         AND table_name = 'forms'
         AND column_name = 'form_schema'`,
      [process.env.DB_NAME || 'dynamic_app_builder']
    );

    const schemaColumn = await query(
      `SELECT COUNT(*) AS count
       FROM information_schema.columns
       WHERE table_schema = ?
         AND table_name = 'forms'
         AND column_name = 'schema'`,
      [process.env.DB_NAME || 'dynamic_app_builder']
    );

    if (legacyColumn[0].count > 0 && schemaColumn[0].count === 0) {
      await query('ALTER TABLE forms ADD COLUMN `schema` JSON');
      await query('UPDATE forms SET `schema` = form_schema WHERE `schema` IS NULL');
    }

    const createdAtColumn = await query(
      `SELECT COUNT(*) AS count
       FROM information_schema.columns
       WHERE table_schema = ?
         AND table_name = 'forms'
         AND column_name = 'created_at'`,
      [process.env.DB_NAME || 'dynamic_app_builder']
    );

    if (createdAtColumn[0].count === 0) {
      await query('ALTER TABLE forms ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
    }

    console.log('✓ Database schema ensured');
  } catch (err) {
    console.error('✗ Failed to ensure database schema:', err.message);
    throw err;
  }
}

/**
 * Test the database connection
 */
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✓ Database connection successful');
    connection.release();
    return true;
  } catch (err) {
    console.error('✗ Database connection failed:', err.message);
    return false;
  }
}

/**
 * Get a query function that uses the pool
 */
async function query(sql, values) {
  try {
    const [results] = await pool.execute(sql, values);
    return results;
  } catch (err) {
    console.error('Database query error:', err.message);
    throw err;
  }
}

/**
 * Close the pool
 */
async function closePool() {
  try {
    await pool.end();
    console.log('✓ Connection pool closed');
  } catch (err) {
    console.error('Error closing connection pool:', err.message);
  }
}

// Utility: validate and escape identifiers (table/column names)
function sanitizeIdentifier(name) {
  if (typeof name !== 'string') return null;
  const cleaned = name.trim();
  // allow letters, numbers, underscore, must not start with number
  if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(cleaned)) {
    return `\`${cleaned}\``;
  }
  return null;
}

// Map config types to SQL column definitions
function mapFieldToColumnDef(field) {
  const name = (field && field.name) ? String(field.name).trim() : '';
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) return null;

  const type = (field && field.type) ? String(field.type).toLowerCase() : 'text';
  switch (type) {
    case 'number':
      return { name, sql: '`' + name + '` INT' };
    case 'date':
      return { name, sql: '`' + name + '` DATETIME' };
    case 'textarea':
      return { name, sql: '`' + name + '` TEXT' };
    case 'checkbox':
    case 'boolean':
      return { name, sql: '`' + name + '` TINYINT(1)' };
    case 'email':
    case 'password':
    case 'text':
    default:
      return { name, sql: '`' + name + '` VARCHAR(255)' };
  }
}

/**
 * Ensure an entity table exists and matches config fields.
 * Creates the table if missing, and adds any new columns found in config.
 */
async function ensureEntityTable(entity, fields) {
  if (!entity || typeof entity !== 'string') throw new Error('Invalid entity');
  const tableName = entity.trim();
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(tableName)) {
    throw new Error('Invalid entity name for table');
  }

  const quoted = sanitizeIdentifier(tableName);
  // Build columns from fields
  const cols = [];
  (Array.isArray(fields) ? fields : []).forEach(f => {
    const def = mapFieldToColumnDef(f);
    if (def) cols.push(def.sql);
  });

  // Always include id and submitted_at if not present
  const baseCols = ['`id` INT AUTO_INCREMENT PRIMARY KEY'];
  if (!cols.find(c => /submitted_at/.test(c))) baseCols.push('`submitted_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP');

  const allCols = baseCols.concat(cols).join(', ');

  // Create table if not exists
  await query(`CREATE TABLE IF NOT EXISTS ${quoted} (${allCols})`);

  // Now ensure any missing columns are added (schema migration)
  // Get existing columns
  const info = await query(
    `SELECT column_name FROM information_schema.columns WHERE table_schema = ? AND table_name = ?`,
    [process.env.DB_NAME || 'dynamic_app_builder', tableName]
  );
  const existing = new Set(info.map(r => r.COLUMN_NAME || r.column_name));

  for (const f of (Array.isArray(fields) ? fields : [])) {
    const def = mapFieldToColumnDef(f);
    if (!def) continue;
    if (!existing.has(def.name)) {
      console.log(`Adding column ${def.name} to table ${tableName}`);
      await query(`ALTER TABLE ${quoted} ADD COLUMN ${def.sql}`);
    }
  }
}

/**
 * Insert a row into the entity table using parameterized queries.
 */
async function insertEntityRow(entity, data, fields) {
  const tableName = entity.trim();
  const quoted = sanitizeIdentifier(tableName);
  const allowed = (Array.isArray(fields) ? fields : []).map(f => (f && f.name ? f.name.trim() : '')).filter(n => /^[A-Za-z_][A-Za-z0-9_]*$/.test(n));
  const cols = [];
  const placeholders = [];
  const values = [];
  for (const col of allowed) {
    if (col in data) {
      cols.push('`' + col + '`');
      placeholders.push('?');
      values.push(data[col]);
    }
  }

  if (cols.length === 0) {
    throw new Error('No valid columns to insert');
  }

  const sql = `INSERT INTO ${quoted} (${cols.join(',')}) VALUES (${placeholders.join(',')})`;
  const result = await query(sql, values);
  return result;
}

/**
 * Fetch rows from entity table. If table doesn't exist return []
 */
async function fetchEntityRows(entity) {
  const tableName = entity.trim();
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(tableName)) return [];
  const quoted = sanitizeIdentifier(tableName);

  // check table exists
  const tables = await query(
    `SELECT COUNT(*) AS count FROM information_schema.tables WHERE table_schema = ? AND table_name = ?`,
    [process.env.DB_NAME || 'dynamic_app_builder', tableName]
  );
  if (!tables || tables[0].count === 0) return [];

  const rows = await query(`SELECT * FROM ${quoted} ORDER BY submitted_at DESC LIMIT 1000`);
  return rows;
}

module.exports = {
  pool,
  query,
  testConnection,
  ensureSchema,
  closePool,
  sanitizeIdentifier,
  ensureEntityTable,
  insertEntityRow,
  fetchEntityRows,
};

