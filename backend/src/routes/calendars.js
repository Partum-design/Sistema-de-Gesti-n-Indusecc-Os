const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { validateObjectId } = require('../middleware/validation');
const {
  createCalendar,
  getCalendars,
  getCalendarById,
  updateCalendar,
  deleteCalendar,
  assignCalendar,
  getCalendarStats
} = require('../controllers/calendarController');

const router = express.Router();

// Estadísticas de calendario (solo SUPER_ADMIN y ADMIN)
router.get('/stats', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), getCalendarStats);

// Lista de eventos de calendario con filtros y paginación
router.get('/', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'COLABORADOR', 'CONSULTOR'), getCalendars);

// Crear evento de calendario
router.post('/', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'COLABORADOR', 'CONSULTOR'), createCalendar);

// Obtener evento de calendario por ID
router.get('/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'COLABORADOR', 'CONSULTOR'), validateObjectId, getCalendarById);

// Actualizar evento de calendario
router.put('/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'COLABORADOR', 'CONSULTOR'), validateObjectId, updateCalendar);

// Asignar evento de calendario
router.patch('/:id/assign', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'CONSULTOR'), validateObjectId, assignCalendar);

// Eliminar evento de calendario
router.delete('/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'CONSULTOR'), validateObjectId, deleteCalendar);

module.exports = router;
