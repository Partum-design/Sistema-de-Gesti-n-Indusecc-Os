const Document = require('../models/Document');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');

const uploadsDir = path.join(__dirname, '../../uploads');

const resolveDocumentFields = (req) => {
  const uploadedFile = req.file;
  const body = req.body || {};

  const storedFilename = uploadedFile?.filename || body.filename;
  const originalName = uploadedFile?.originalname || body.originalName || body.title || body.filename;
  const title = body.title || body.name || body.filename || originalName;
  const type = body.type || body.category || 'Documento';
  const clause = body.clause || body.clausula || '';
  const responsible = body.responsible || body.resp || '';
  const expiryDate = body.expiryDate || body.vigencia || null;

  return {
    code: body.code || '',
    title,
    filename: storedFilename,
    originalName,
    mimetype: uploadedFile?.mimetype || body.mimetype || 'application/octet-stream',
    size: uploadedFile?.size || (body.size ? Number(body.size) : 0),
    type,
    category: body.category || type,
    clause,
    responsible,
    description: body.description || '',
    expiryDate,
    url: storedFilename ? `/uploads/${storedFilename}` : null
  };
};

const createDocument = async (req, res) => {
  try {
    const uploadedBy = req.user.id;
    const payload = resolveDocumentFields(req);

    if (!payload.filename || !payload.originalName) {
      return res.status(400).json({
        success: false,
        message: 'Archivo y nombre de archivo requeridos',
        code: 'MISSING_FILENAME'
      });
    }

    const document = new Document({
      ...payload,
      uploadedBy,
      expiryDate: payload.expiryDate ? new Date(payload.expiryDate) : null,
      status: 'Vigente'
    });

    await document.save();

    logger.info(`Documento creado: ${document.filename} por usuario ${uploadedBy}`);

    res.status(201).json({
      success: true,
      message: 'Documento cargado exitosamente',
      data: { document }
    });
  } catch (error) {
    logger.error('Error al crear documento:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cargar documento',
      code: 'CREATE_DOCUMENT_ERROR'
    });
  }
};

const getDocuments = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100);
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.category) filter.category = req.query.category;
    if (req.query.search) {
      filter.$or = [
        { code: { $regex: req.query.search, $options: 'i' } },
        { title: { $regex: req.query.search, $options: 'i' } },
        { filename: { $regex: req.query.search, $options: 'i' } },
        { originalName: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const [documents, total] = await Promise.all([
      Document.find(filter)
        .populate('uploadedBy', '-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Document.countDocuments(filter)
    ]);

    res.json({
      success: true,
      message: 'Documentos obtenidos exitosamente',
      data: {
        documents,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Error al obtener documentos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener documentos',
      code: 'GET_DOCUMENTS_ERROR'
    });
  }
};

const getDocumentById = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id).populate('uploadedBy', '-password');

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Documento no encontrado',
        code: 'DOCUMENT_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: { document }
    });
  } catch (error) {
    logger.error('Error al obtener documento:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener documento',
      code: 'GET_DOCUMENT_ERROR'
    });
  }
};

const updateDocument = async (req, res) => {
  try {
    const { code, title, type, category, clause, responsible, description, expiryDate, vigencia, status } = req.body;

    const document = await Document.findByIdAndUpdate(
      req.params.id,
      {
        code,
        title,
        type,
        category,
        clause,
        responsible,
        description,
        expiryDate: (expiryDate || vigencia) ? new Date(expiryDate || vigencia) : undefined,
        status,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Documento no encontrado',
        code: 'DOCUMENT_NOT_FOUND'
      });
    }

    logger.info(`Documento actualizado: ${document.filename}`);

    res.json({
      success: true,
      message: 'Documento actualizado exitosamente',
      data: { document }
    });
  } catch (error) {
    logger.error('Error al actualizar documento:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar documento',
      code: 'UPDATE_DOCUMENT_ERROR'
    });
  }
};

const deleteDocument = async (req, res) => {
  try {
    const document = await Document.findByIdAndDelete(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Documento no encontrado',
        code: 'DOCUMENT_NOT_FOUND'
      });
    }

    const filePath = path.join(uploadsDir, document.filename);
    if (document.filename && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    logger.info(`Documento eliminado: ${document.filename}`);

    res.json({
      success: true,
      message: 'Documento eliminado exitosamente'
    });
  } catch (error) {
    logger.error('Error al eliminar documento:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar documento',
      code: 'DELETE_DOCUMENT_ERROR'
    });
  }
};

const downloadDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Documento no encontrado',
        code: 'DOCUMENT_NOT_FOUND'
      });
    }

    const filePath = path.join(uploadsDir, document.filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Archivo no encontrado en el servidor',
        code: 'FILE_NOT_FOUND'
      });
    }

    res.setHeader('Content-Disposition', `attachment; filename="${document.originalName}"`);
    res.setHeader('Content-Type', document.mimetype);

    fs.createReadStream(filePath).pipe(res);
    logger.info(`Documento descargado: ${document.filename}`);
  } catch (error) {
    logger.error('Error al descargar documento:', error);
    res.status(500).json({
      success: false,
      message: 'Error al descargar documento',
      code: 'DOWNLOAD_DOCUMENT_ERROR'
    });
  }
};

const viewDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Documento no encontrado',
        code: 'DOCUMENT_NOT_FOUND'
      });
    }

    const filePath = path.join(uploadsDir, document.filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Archivo no encontrado en el servidor',
        code: 'FILE_NOT_FOUND'
      });
    }

    res.setHeader('Content-Disposition', `inline; filename="${document.originalName}"`);
    res.setHeader('Content-Type', document.mimetype);

    fs.createReadStream(filePath).pipe(res);
    logger.info(`Documento visualizado: ${document.filename}`);
  } catch (error) {
    logger.error('Error al visualizar documento:', error);
    res.status(500).json({
      success: false,
      message: 'Error al visualizar documento',
      code: 'VIEW_DOCUMENT_ERROR'
    });
  }
};

module.exports = {
  createDocument,
  getDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument,
  downloadDocument,
  viewDocument
};
