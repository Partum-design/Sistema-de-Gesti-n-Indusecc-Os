const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { validateObjectId } = require('../middleware/validation');
const {
  createAudit,
  getAudits,
  getAuditById,
  updateAudit,
  deleteAudit,
  updateAuditStatus,
  assignAudit,
  getAuditStats
} = require('../controllers/auditController');

const router = express.Router();

// Estadísticas de auditorías (solo SUPER_ADMIN y ADMIN)
router.get('/stats', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), getAuditStats);

// Lista de auditorías con filtros y paginación
router.get('/', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'COLABORADOR', 'CONSULTOR'), getAudits);

// Crear auditoría
router.post('/', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), createAudit);

// Obtener auditoría por ID
router.get('/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'COLABORADOR', 'CONSULTOR'), validateObjectId, getAuditById);

// Actualizar auditoría
router.put('/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), validateObjectId, updateAudit);

// Cambiar estado de auditoría
router.patch('/:id/status', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'COLABORADOR', 'CONSULTOR'), validateObjectId, updateAuditStatus);

// Asignar auditoría
router.patch('/:id/assign', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), validateObjectId, assignAudit);

// Eliminar auditoría
router.delete('/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), validateObjectId, deleteAudit);

module.exports = router;
