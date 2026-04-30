const express = require('express');
const router = express.Router();
const riskController = require('../controllers/riskController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate); // Protegemos todas las rutas de riesgos

router.get('/', riskController.getRisks);
router.post('/', authorize('SUPER_ADMIN', 'ADMIN'), riskController.createRisk);
router.put('/:id', authorize('SUPER_ADMIN', 'ADMIN'), riskController.updateRisk);
router.delete('/:id', authorize('SUPER_ADMIN', 'ADMIN'), riskController.deleteRisk);

module.exports = router;
