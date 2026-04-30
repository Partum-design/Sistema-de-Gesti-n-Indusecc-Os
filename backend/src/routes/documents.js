const express = require('express');
const fs = require('fs');
const multer = require('multer');
const path = require('path');
const { authenticate, authorize } = require('../middleware/auth');
const { validateObjectId } = require('../middleware/validation');
const { ensureUploadsDir } = require('../utils/uploads');
const {
  createDocument,
  getDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument,
  downloadDocument,
  viewDocument
} = require('../controllers/documentController');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadsDir = ensureUploadsDir();
    if (!uploadsDir || !fs.existsSync(uploadsDir)) {
      return cb(new Error('No se pudo inicializar el directorio de uploads'), null);
    }
    return cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}-${safeName}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

router.post('/', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), upload.single('file'), createDocument);
router.get('/', authenticate, getDocuments);
router.get('/:id', authenticate, validateObjectId, getDocumentById);
router.put('/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), validateObjectId, updateDocument);
router.delete('/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), validateObjectId, deleteDocument);
router.get('/:id/download', authenticate, validateObjectId, downloadDocument);
router.get('/:id/view', authenticate, validateObjectId, viewDocument);

module.exports = router;
