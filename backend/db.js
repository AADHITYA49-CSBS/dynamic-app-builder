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
  keepAliveInitialDelayMs: 0,
});

// Handle connection errors gracefully
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

pool.on('connection', () => {
  console.log('✓ New database connection established');
});

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

module.exports = {
  pool,
  query,
  testConnection,
  closePool,
};

