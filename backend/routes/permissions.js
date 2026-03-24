const express = require('express');
const router = express.Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const ctrl = require('../controllers/permissionController');

router.get('/', authenticate, ctrl.getAll);
router.post('/', authenticate, requireAdmin, ctrl.create);
router.put('/:id', authenticate, requireAdmin, ctrl.update);
router.delete('/:id', authenticate, requireAdmin, ctrl.remove);

module.exports = router;
