const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { validateObjectId } = require('../middleware/validation');
const {
  createFinding,
  getFindings,
  getFindingById,
  updateFinding,
  deleteFinding,
  updateFindingStatus,
  assignFinding,
  getFindingStats
} = require('../controllers/findingController');

const router = express.Router();

// Estadísticas de hallazgos (solo SUPER_ADMIN y ADMIN)
router.get('/stats', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), getFindingStats);

// Lista de hallazgos con filtros y paginación
router.get('/', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'COLABORADOR', 'CONSULTOR'), getFindings);

// Crear hallazgo
router.post('/', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'COLABORADOR', 'CONSULTOR'), createFinding);

// Obtener hallazgo por ID
router.get('/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'COLABORADOR', 'CONSULTOR'), validateObjectId, getFindingById);

// Actualizar hallazgo
router.put('/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'COLABORADOR', 'CONSULTOR'), validateObjectId, updateFinding);

// Cambiar estado de hallazgo
router.patch('/:id/status', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'COLABORADOR', 'CONSULTOR'), validateObjectId, updateFindingStatus);

// Asignar hallazgo
router.patch('/:id/assign', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'CONSULTOR'), validateObjectId, assignFinding);

// Eliminar hallazgo
router.delete('/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'CONSULTOR'), validateObjectId, deleteFinding);

module.exports = router;
