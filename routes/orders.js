const router = require('express').Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/orderController');

router.post('/', auth, ctrl.create);
router.get('/', auth, ctrl.getAll);
router.get('/:id', auth, ctrl.getById);
router.get('/:id/track', auth, ctrl.track);

module.exports = router;
