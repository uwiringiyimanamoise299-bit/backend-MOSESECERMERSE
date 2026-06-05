const { query } = require('../config/db');

exports.submitConfirmation = async (req, res) => {
  try {
    const { fullName, phone, orderId, transactionId, amountPaid } = req.body;
    let screenshot = null;
    if (req.file) {
      screenshot = `/uploads/${req.file.filename}`;
    }
    await query(
      'INSERT INTO payments (orderId, userId, fullName, phone, transactionId, amountPaid, screenshot) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [orderId || null, req.user.id, fullName, phone, transactionId, amountPaid, screenshot]
    );
    if (orderId) {
      await query('UPDATE orders SET status = ? WHERE id = ?', ['paid', orderId]);
    }
    res.status(201).json({ message: 'Payment confirmation submitted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getInstructions = async (req, res) => {
  res.json({
    instructions: {
      number: '*182*1*1*0795552517#',
      name: 'Uwiringiyimana Moise',
      network: 'MTN Mobile Money',
      steps: [
        'Dial *182*1*1*0795552517# on your phone',
        'Enter the amount to pay',
        'Confirm payment details',
        'Enter your PIN to authorize',
        'Copy the transaction ID after payment',
      ],
    },
  });
};
