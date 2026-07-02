const mysql = require('mysql2/promise');
require('dotenv').config();

let pool;

async function getPool() {
  if (!pool) {
    const dbHost = process.env.DB_HOST || process.env.MYSQLHOST || 'localhost';
    const isRemote = dbHost !== 'localhost' && dbHost !== '127.0.0.1';
    pool = mysql.createPool({
      host: dbHost,
      user: process.env.DB_USER || process.env.MYSQLUSER || 'root',
      password: process.env.DB_PASSWORD ?? process.env.MYSQLPASSWORD ?? '',
      database: process.env.DB_NAME ?? process.env.MYSQLDATABASE ?? 'montana_shop',
      port: Number(process.env.DB_PORT || process.env.MYSQLPORT || 3306),
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      ssl: isRemote ? { rejectUnauthorized: false } : undefined,
    });
  }
  return pool;
}

async function query(sql, params) {
  const p = await getPool();
  const [results] = await p.query(sql, params);
  return results;
}

async function getConnection() {
  const p = await getPool();
  return p.getConnection();
}

module.exports = { getPool, query, getConnection };
