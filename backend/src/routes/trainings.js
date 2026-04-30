const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/auth');
const {
  getUserTrainings,
  getUserCertificates,
  updateTrainingProgress,
  downloadCertificate,
  createSampleTrainings,
  getAdminTrainings,
  createTrainingByAdmin,
  updateTrainingByAdmin,
  approveTrainingByAdmin,
  getCertificateSettingsAdmin,
  updateCertificateSettingsAdmin,
} = require('../controllers/trainingController');

// Todas las rutas requieren autenticación
router.use(authenticate);

// Obtener capacitaciones del usuario actual
router.get('/', getUserTrainings);

// Obtener certificados del usuario actual
router.get('/certificates', getUserCertificates);

// Actualizar progreso de capacitación
router.put('/:id/progress', updateTrainingProgress);

// Descargar certificado
router.get('/certificates/:id/download', downloadCertificate);

// Crear capacitaciones de ejemplo (solo para desarrollo)
router.post('/sample', createSampleTrainings);

// Admin / Super Admin
router.get('/admin/all', authorize('ADMIN', 'SUPER_ADMIN'), getAdminTrainings);
router.post('/admin', authorize('ADMIN', 'SUPER_ADMIN'), createTrainingByAdmin);
router.put('/admin/:id', authorize('ADMIN', 'SUPER_ADMIN'), updateTrainingByAdmin);
router.post('/admin/:id/approve', authorize('ADMIN', 'SUPER_ADMIN'), approveTrainingByAdmin);
router.get('/admin/certificate-settings', authorize('ADMIN', 'SUPER_ADMIN'), getCertificateSettingsAdmin);
router.put('/admin/certificate-settings', authorize('ADMIN', 'SUPER_ADMIN'), updateCertificateSettingsAdmin);

module.exports = router;
