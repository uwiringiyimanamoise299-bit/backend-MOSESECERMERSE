const { query } = require('../config/db');

exports.getAll = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const offset = (page - 1) * limit;
    const products = await query('SELECT * FROM products ORDER BY createdAt DESC LIMIT ? OFFSET ?', [limit, offset]);
    const countResult = await query('SELECT COUNT(*) as total FROM products');
    const total = countResult[0].total;
    res.json({
      products,
      totalPages: Math.ceil(total / limit),
      page,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getById = async (req, res) => {
  try {
    const products = await query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (products.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    const product = products[0];
    if (product.images) {
      try { product.images = JSON.parse(product.images); } catch { product.images = []; }
    }
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getByCategory = async (req, res) => {
  try {
    const products = await query('SELECT * FROM products WHERE category = ? ORDER BY createdAt DESC', [req.params.category]);
    res.json({ products });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.search = async (req, res) => {
  try {
    const q = req.query.q || '';
    const products = await query(
      'SELECT * FROM products WHERE name LIKE ? OR description LIKE ? ORDER BY createdAt DESC',
      [`%${q}%`, `%${q}%`]
    );
    res.json({ products });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
