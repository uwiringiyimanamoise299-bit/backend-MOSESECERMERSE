const { query } = require('../config/db');
const path = require('path');

exports.getDashboard = async (req, res) => {
  try {
    const [totalRevenue] = await query('SELECT COALESCE(SUM(totalAmount),0) as total FROM orders WHERE status != ?', ['cancelled']);
    const [totalOrders] = await query('SELECT COUNT(*) as total FROM orders');
    const [totalCustomers] = await query('SELECT COUNT(*) as total FROM users WHERE role = ?', ['customer']);
    const [totalProducts] = await query('SELECT COUNT(*) as total FROM products');
    const recentOrders = await query('SELECT o.*, u.name as userName FROM orders o LEFT JOIN users u ON o.userId = u.id ORDER BY o.createdAt DESC LIMIT 5');
    recentOrders.forEach((o) => {
      try { o.items = JSON.parse(o.items); } catch { o.items = []; }
      try { o.shippingAddress = JSON.parse(o.shippingAddress); } catch { o.shippingAddress = {}; }
      if (o.userName) {
        o.user = { name: o.userName };
      }
    });
    const orderStatsRows = await query('SELECT status, COUNT(*) as count FROM orders GROUP BY status');
    const orderStats = {};
    orderStatsRows.forEach((r) => { orderStats[r.status] = r.count; });

    res.json({
      dashboard: {
        totalRevenue: totalRevenue.total,
        totalOrders: totalOrders.total,
        totalCustomers: totalCustomers.total,
        totalProducts: totalProducts.total,
        recentOrders,
        orderStats,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getProducts = async (req, res) => {
  try {
    const products = await query('SELECT * FROM products ORDER BY createdAt DESC');
    products.forEach((p) => {
      if (p.images) { try { p.images = JSON.parse(p.images); } catch { p.images = []; } }
    });
    res.json({ products });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.addProduct = async (req, res) => {
  try {
    const { name, description, price, category, stock, featured } = req.body;
    let image = null;
    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map((f) => `/uploads/${f.filename}`);
      image = images[0];
    }
    await query(
      'INSERT INTO products (name, description, price, category, image, images, stock, featured) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [name, description, price, category, image, JSON.stringify(images), stock || 0, featured ? 1 : 0]
    );
    res.status(201).json({ message: 'Product added successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { name, description, price, category, stock, featured } = req.body;
    await query(
      'UPDATE products SET name=?, description=?, price=?, category=?, stock=?, featured=? WHERE id=?',
      [name, description, price, category, stock || 0, featured ? 1 : 0, req.params.id]
    );
    res.json({ message: 'Product updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    await query('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getOrders = async (req, res) => {
  try {
    let orders;
    if (req.query.status) {
      orders = await query('SELECT o.*, u.name as userName, u.email as userEmail FROM orders o LEFT JOIN users u ON o.userId = u.id WHERE o.status = ? ORDER BY o.createdAt DESC', [req.query.status]);
    } else {
      orders = await query('SELECT o.*, u.name as userName, u.email as userEmail FROM orders o LEFT JOIN users u ON o.userId = u.id ORDER BY o.createdAt DESC');
    }
    orders.forEach((o) => {
      try { o.items = JSON.parse(o.items); } catch { o.items = []; }
      try { o.shippingAddress = JSON.parse(o.shippingAddress); } catch { o.shippingAddress = {}; }
      if (o.userName) o.user = { name: o.userName, email: o.userEmail };
    });
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    await query('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
    const orders = await query('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (orders.length > 0) {
      const o = orders[0];
      try { o.items = JSON.parse(o.items); } catch { o.items = []; }
      try { o.shippingAddress = JSON.parse(o.shippingAddress); } catch { o.shippingAddress = {}; }
      res.json({ order: o, message: 'Order status updated' });
    } else {
      res.json({ message: 'Order status updated' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getCustomers = async (req, res) => {
  try {
    const users = await query('SELECT id, name, email, phone, role, address, createdAt FROM users ORDER BY createdAt DESC');
    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getPayments = async (req, res) => {
  try {
    const payments = await query('SELECT * FROM payments ORDER BY createdAt DESC');
    res.json({ payments });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    await query('UPDATE payments SET status = ? WHERE id = ?', ['verified', req.params.id]);
    const payments = await query('SELECT * FROM payments WHERE id = ?', [req.params.id]);
    if (payments.length > 0 && payments[0].orderId) {
      await query('UPDATE orders SET status = ? WHERE id = ?', ['processing', payments[0].orderId]);
    }
    res.json({ payment: payments[0] || { _id: req.params.id }, message: 'Payment verified' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.rejectPayment = async (req, res) => {
  try {
    await query('UPDATE payments SET status = ? WHERE id = ?', ['rejected', req.params.id]);
    const payments = await query('SELECT * FROM payments WHERE id = ?', [req.params.id]);
    res.json({ payment: payments[0] || { _id: req.params.id }, message: 'Payment rejected' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getReports = async (req, res) => {
  try {
    const period = req.query.period || 'daily';
    let dateFormat;
    if (period === 'weekly') dateFormat = '%Y-%u';
    else if (period === 'monthly') dateFormat = '%Y-%m';
    else dateFormat = '%Y-%m-%d';

    const data = await query(
      `SELECT DATE_FORMAT(createdAt, ?) as label, COUNT(*) as orders, COALESCE(SUM(totalAmount),0) as revenue
       FROM orders WHERE status != ? GROUP BY label ORDER BY label`,
      [dateFormat, 'cancelled']
    );
    const [totalSales] = await query('SELECT COUNT(*) as total FROM orders WHERE status != ?', ['cancelled']);
    const [totalRevenue] = await query('SELECT COALESCE(SUM(totalAmount),0) as total FROM orders WHERE status != ?', ['cancelled']);
    const [totalOrders] = await query('SELECT COUNT(*) as total FROM orders');

    res.json({
      reports: {
        totalSales: totalSales.total,
        totalRevenue: totalRevenue.total,
        totalOrders: totalOrders.total,
        data: data.map((r) => ({ date: r.label, sales: Number(r.orders), revenue: Number(r.revenue), orders: Number(r.orders) })),
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
