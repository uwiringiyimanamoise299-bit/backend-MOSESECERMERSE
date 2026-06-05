const { query } = require('../config/db');

exports.getAll = async (req, res) => {
  try {
    const categories = await query('SELECT * FROM categories ORDER BY name');
    res.json({ categories });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
