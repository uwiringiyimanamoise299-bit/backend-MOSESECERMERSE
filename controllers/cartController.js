const { query } = require('../config/db');

exports.getCart = async (req, res) => {
  try {
    const rows = await query(
      `SELECT c.id, c.productId, c.quantity, p.id as pid, p.name, p.price, p.image, p.stock
       FROM carts c JOIN products p ON c.productId = p.id WHERE c.userId = ?`,
      [req.user.id]
    );
    const items = rows.map((r) => ({
      _id: r.id,
      product: {
        _id: r.pid,
        id: r.pid,
        name: r.name,
        price: r.price,
        image: r.image,
        stock: r.stock,
      },
      quantity: r.quantity,
    }));
    const totalItems = items.reduce((s, i) => s + i.quantity, 0);
    const totalPrice = items.reduce((s, i) => s + i.product.price * i.quantity, 0);
    res.json({ items, totalItems, totalPrice });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.addItem = async (req, res) => {
  try {
    const { product, quantity } = req.body;
    const productId = product?._id || product?.id || product;
    const qty = quantity || 1;
    const existing = await query('SELECT id, quantity FROM carts WHERE userId = ? AND productId = ?', [req.user.id, productId]);
    if (existing.length > 0) {
      await query('UPDATE carts SET quantity = quantity + ? WHERE id = ?', [qty, existing[0].id]);
    } else {
      await query('INSERT INTO carts (userId, productId, quantity) VALUES (?, ?, ?)', [req.user.id, productId, qty]);
    }
    const rows = await query(
      `SELECT c.id, c.productId, c.quantity, p.id as pid, p.name, p.price, p.image, p.stock
       FROM carts c JOIN products p ON c.productId = p.id WHERE c.userId = ?`,
      [req.user.id]
    );
    const items = rows.map((r) => ({
      _id: r.id,
      product: { _id: r.pid, id: r.pid, name: r.name, price: r.price, image: r.image, stock: r.stock },
      quantity: r.quantity,
    }));
    res.json({ items, totalItems: items.reduce((s, i) => s + i.quantity, 0), totalPrice: items.reduce((s, i) => s + i.product.price * i.quantity, 0) });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    const cartId = req.params.id;
    await query('UPDATE carts SET quantity = ? WHERE id = ? AND userId = ?', [quantity, cartId, req.user.id]);
    res.json({ message: 'Cart updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.removeItem = async (req, res) => {
  try {
    await query('DELETE FROM carts WHERE id = ? AND userId = ?', [req.params.id, req.user.id]);
    res.json({ message: 'Item removed' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.clearCart = async (req, res) => {
  try {
    await query('DELETE FROM carts WHERE userId = ?', [req.user.id]);
    res.json({ message: 'Cart cleared' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
