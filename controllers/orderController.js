const { query } = require('../config/db');

exports.create = async (req, res) => {
  try {
    const { items, shippingAddress, totalAmount } = req.body;
    const itemsJson = JSON.stringify(items.map((i) => ({
      product: { _id: i.product, id: i.product, name: i.name || 'Product', price: i.price, image: i.image || '' },
      quantity: i.quantity,
      price: i.price,
    })));
    const addrJson = JSON.stringify(shippingAddress);
    const result = await query(
      'INSERT INTO orders (userId, items, shippingAddress, totalAmount) VALUES (?, ?, ?, ?)',
      [req.user.id, itemsJson, addrJson, totalAmount]
    );
    await query('DELETE FROM carts WHERE userId = ?', [req.user.id]);
    const order = await query('SELECT * FROM orders WHERE id = ?', [result.insertId]);
    order[0].items = JSON.parse(order[0].items);
    order[0].shippingAddress = JSON.parse(order[0].shippingAddress);
    res.status(201).json({ order: order[0] });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAll = async (req, res) => {
  try {
    const orders = await query('SELECT * FROM orders WHERE userId = ? ORDER BY createdAt DESC', [req.user.id]);
    orders.forEach((o) => {
      try { o.items = JSON.parse(o.items); } catch { o.items = []; }
      try { o.shippingAddress = JSON.parse(o.shippingAddress); } catch { o.shippingAddress = {}; }
    });
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getById = async (req, res) => {
  try {
    const orders = await query('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (orders.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }
    const order = orders[0];
    try { order.items = JSON.parse(order.items); } catch { order.items = []; }
    try { order.shippingAddress = JSON.parse(order.shippingAddress); } catch { order.shippingAddress = {}; }
    const payments = await query('SELECT * FROM payments WHERE orderId = ?', [order.id]);
    if (payments.length > 0) {
      order.payment = payments[0];
    }
    res.json({ order });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.track = async (req, res) => {
  try {
    const orders = await query('SELECT id, status, createdAt, updatedAt FROM orders WHERE id = ?', [req.params.id]);
    if (orders.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json({ tracking: orders[0] });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
