const express = require('express');
const { body } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');
const {
  getComplianceReport,
  getNorm,
  getClause,
  updateClause,
  exportClause
} = require('../controllers/normController');

const router = express.Router();

// Validaciones
const updateClauseValidation = [
  body('status')
    .optional()
    .isIn(['pendiente', 'in-progress', 'completed'])
    .withMessage('Estado inválido'),
  body('completion')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Completion debe estar entre 0 y 100'),
  handleValidationErrors
];

// Reporte de cumplimiento (todos pueden ver)
router.get('/compliance-report', authenticate, getComplianceReport);

// Obtener norma completa
router.get('/norms', authenticate, getNorm);

// Obtener cláusula específica
router.get('/clauses/:clauseId', authenticate, getClause);

// Actualizar cláusula (solo SUPER_ADMIN y ADMIN)
router.put('/clauses/:clauseId', 
  authenticate, 
  authorize('SUPER_ADMIN', 'ADMIN'), 
  updateClauseValidation, 
  updateClause
);

// Exportar cláusula
router.get('/clauses/:clauseId/export', authenticate, exportClause);

module.exports = router;
