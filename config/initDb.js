const mysql = require('mysql2/promise');
require('dotenv').config();

async function initDatabase() {
  const dbHost = process.env.DB_HOST || process.env.MYSQLHOST || 'localhost';
  const isRemote = dbHost !== 'localhost' && dbHost !== '127.0.0.1';
  const connection = await mysql.createConnection({
    host: dbHost,
    user: process.env.DB_USER || process.env.MYSQLUSER || 'root',
    password: process.env.DB_PASSWORD ?? process.env.MYSQLPASSWORD ?? '',
    port: Number(process.env.DB_PORT || process.env.MYSQLPORT || 3306),
    multipleStatements: true,
    ssl: isRemote ? { rejectUnauthorized: false } : undefined,
  });

  const dbName = process.env.DB_NAME ?? process.env.MYSQLDATABASE ?? 'montana_shop';

  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await connection.query(`USE \`${dbName}\``);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) NOT NULL UNIQUE,
      phone VARCHAR(20) DEFAULT NULL,
      password VARCHAR(255) NOT NULL,
      address TEXT DEFAULT NULL,
      role ENUM('customer','admin') DEFAULT 'customer',
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(200) NOT NULL,
      description TEXT DEFAULT NULL,
      price DECIMAL(12,2) NOT NULL DEFAULT 0,
      category VARCHAR(100) DEFAULT NULL,
      image VARCHAR(500) DEFAULT NULL,
      images JSON DEFAULT NULL,
      stock INT NOT NULL DEFAULT 0,
      featured TINYINT(1) DEFAULT 0,
      rating DECIMAL(2,1) DEFAULT 0.0,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS carts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      userId INT NOT NULL,
      productId INT NOT NULL,
      quantity INT NOT NULL DEFAULT 1,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE,
      UNIQUE KEY unique_user_product (userId, productId)
    )
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      userId INT DEFAULT NULL,
      items JSON NOT NULL,
      shippingAddress JSON NOT NULL,
      totalAmount DECIMAL(12,2) NOT NULL,
      status ENUM('pending','paid','processing','shipped','delivered','cancelled') DEFAULT 'pending',
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS payments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      orderId INT DEFAULT NULL,
      userId INT DEFAULT NULL,
      fullName VARCHAR(100) NOT NULL,
      phone VARCHAR(20) NOT NULL,
      transactionId VARCHAR(200) NOT NULL,
      amountPaid DECIMAL(12,2) NOT NULL,
      screenshot VARCHAR(500) DEFAULT NULL,
      status ENUM('pending','verified','rejected') DEFAULT 'pending',
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE SET NULL,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  const [adminRows] = await connection.query('SELECT id FROM users WHERE email = ?', ['uwiringiyimanamoise911@gmail.com']);
  if (adminRows.length === 0) {
    const bcrypt = require('bcryptjs');
    const hashed = await bcrypt.hash('Moise300', 10);
    await connection.query(
      'INSERT INTO users (name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)',
      ['Admin', 'uwiringiyimanamoise911@gmail.com', '+25079552517', hashed, 'admin']
    );
    console.log('Default admin created (uwiringiyimanamoise911@gmail.com / Moise300)');
  }

  const [catRows] = await connection.query('SELECT id FROM categories LIMIT 1');
  if (catRows.length === 0) {
    const cats = ['Electronics', 'Clothing', 'Home & Kitchen', 'Beauty', 'Sports', 'Books'];
    for (const name of cats) {
      await connection.query('INSERT INTO categories (name) VALUES (?)', [name]);
    }
    console.log('Default categories created');
  }

  const [prodRows] = await connection.query('SELECT id FROM products LIMIT 1');
  if (prodRows.length === 0) {
    const sampleProducts = [
      ['Wireless Headphones', 'Premium wireless headphones with noise cancellation', 45000, 'Electronics', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300', 25, 1, 4.5],
      ['Smart Watch', 'Feature-rich smartwatch for everyday use', 85000, 'Electronics', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300', 15, 1, 4.3],
      ['Leather Bag', 'Handcrafted leather bag for men and women', 65000, 'Clothing', 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=300', 20, 1, 4.7],
      ['Running Shoes', 'Comfortable running shoes for daily jogging', 55000, 'Sports', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300', 30, 1, 4.4],
      ['Coffee Maker', 'Automatic coffee maker with grinder', 95000, 'Home & Kitchen', 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=300', 10, 1, 4.6],
      ['Perfume', 'Long-lasting luxury perfume for men', 35000, 'Beauty', 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=300', 40, 0, 4.2],
      ['Laptop Stand', 'Ergonomic aluminum laptop stand', 25000, 'Electronics', 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=300', 50, 0, 4.0],
      ['Yoga Mat', 'Non-slip exercise yoga mat', 15000, 'Sports', 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=300', 60, 0, 4.1],
      ['Cookbook', 'Delicious recipes from around the world', 12000, 'Books', 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=300', 35, 0, 4.8],
      ['Sunglasses', 'Polarized UV protection sunglasses', 20000, 'Clothing', 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=300', 45, 0, 4.3],
      ['Backpack', 'Durable waterproof travel backpack', 40000, 'Clothing', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300', 28, 0, 4.5],
      ['Bluetooth Speaker', 'Portable waterproof bluetooth speaker', 30000, 'Electronics', 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=300', 22, 0, 4.2],
    ];
    for (const [name, desc, price, cat, img, stock, featured, rating] of sampleProducts) {
      await connection.query(
        'INSERT INTO products (name, description, price, category, image, stock, featured, rating) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [name, desc, price, cat, img, stock, featured, rating]
      );
    }
    console.log('Sample products created');
  }

  await connection.end();
  console.log('Database initialized successfully');
}

module.exports = initDatabase;
