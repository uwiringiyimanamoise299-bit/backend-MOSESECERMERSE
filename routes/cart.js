const router = require('express').Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/cartController');

router.get('/', auth, ctrl.getCart);
router.post('/', auth, ctrl.addItem);
router.put('/:id', auth, ctrl.updateItem);
router.delete('/:id', auth, ctrl.removeItem);
router.delete('/', auth, ctrl.clearCart);

module.exports = router;
