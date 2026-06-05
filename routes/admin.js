const router = require('express').Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const upload = require('../middleware/upload');
const ctrl = require('../controllers/adminController');

router.use(auth, admin);

router.get('/dashboard', ctrl.getDashboard);
router.get('/products', ctrl.getProducts);
router.post('/products', upload.array('images', 5), ctrl.addProduct);
router.put('/products/:id', ctrl.updateProduct);
router.delete('/products/:id', ctrl.deleteProduct);
router.get('/orders', ctrl.getOrders);
router.put('/orders/:id', ctrl.updateOrderStatus);
router.get('/users', ctrl.getCustomers);
router.get('/payments', ctrl.getPayments);
router.put('/payments/:id/verify', ctrl.verifyPayment);
router.put('/payments/:id/reject', ctrl.rejectPayment);
router.get('/reports', ctrl.getReports);

module.exports = router;
