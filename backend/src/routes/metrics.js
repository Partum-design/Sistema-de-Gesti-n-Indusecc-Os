const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  getCollaboratorIndicators,
  getComplianceByClause,
  getProcessIndicators,
  getUserPerformance
} = require('../controllers/metricsController');

router.use(authenticate);

// Indicadores generales del colaborador
router.get('/indicators', getCollaboratorIndicators);

// Cumplimiento por cláusula ISO
router.get('/compliance/clauses', getComplianceByClause);

// Indicadores de proceso
router.get('/process', getProcessIndicators);

// Desempeño del usuario
router.get('/performance', getUserPerformance);

module.exports = router;
