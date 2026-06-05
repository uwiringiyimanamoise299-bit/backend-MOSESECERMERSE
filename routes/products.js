const router = require('express').Router();
const ctrl = require('../controllers/productController');

router.get('/', ctrl.getAll);
router.get('/search', ctrl.search);
router.get('/category/:category', ctrl.getByCategory);
router.get('/:id', ctrl.getById);

module.exports = router;
