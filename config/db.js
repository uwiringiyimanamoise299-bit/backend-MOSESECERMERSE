const mysql = require('mysql2/promise');
require('dotenv').config();

let pool;

async function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'montana_shop',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }
  return pool;
}

async function query(sql, params) {
  const p = await getPool();
  const [results] = await p.execute(sql, params);
  return results;
}

async function getConnection() {
  const p = await getPool();
  return p.getConnection();
}

module.exports = { getPool, query, getConnection };
