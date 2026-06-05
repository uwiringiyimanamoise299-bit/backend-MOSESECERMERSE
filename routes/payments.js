const router = require('express').Router();
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const ctrl = require('../controllers/paymentController');

router.post('/', auth, upload.single('screenshot'), ctrl.submitConfirmation);
router.get('/instructions', auth, ctrl.getInstructions);

module.exports = router;
