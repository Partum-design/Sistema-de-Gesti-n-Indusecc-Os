const Training = require('../models/Training');
const Certificate = require('../models/Certificate');
const User = require('../models/User');
const logger = require('../utils/logger');

// Obtener capacitaciones del usuario actual
const getUserTrainings = async (req, res) => {
  try {
    const userId = req.user.id;

    const trainings = await Training.find({ assignedTo: userId })
      .sort({ createdAt: -1 })
      .populate('assignedTo', 'name email');

    // Calcular estadísticas
    const stats = {
      completed: trainings.filter(t => t.status === 'Completado').length,
      inProgress: trainings.filter(t => t.status === 'En proceso').length,
      pending: trainings.filter(t => t.status === 'Pendiente').length,
      averageScore: 0
    };

    const completedTrainings = trainings.filter(t => t.status === 'Completado' && t.score);
    if (completedTrainings.length > 0) {
      stats.averageScore = Math.round(
        completedTrainings.reduce((sum, t) => sum + t.score, 0) / completedTrainings.length
      );
    }

    res.json({
      success: true,
      data: {
        trainings: trainings.map(training => ({
          _id: training._id,
          title: training.title,
          module: training.module,
          status: training.status,
          progress: training.progress,
          score: training.score,
          startDate: training.startDate,
          completionDate: training.completionDate,
          scheduledDate: training.scheduledDate,
          createdAt: training.createdAt
        })),
        stats
      }
    });
  } catch (error) {
    logger.error('Error al obtener capacitaciones del usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener capacitaciones',
      code: 'GET_TRAININGS_ERROR'
    });
  }
};

// Obtener certificados del usuario actual
const getUserCertificates = async (req, res) => {
  try {
    const userId = req.user.id;

    const certificates = await Certificate.find({
      userId,
      status: 'Activo'
    })
      .sort({ issueDate: -1 })
      .populate('trainingId', 'title module');

    res.json({
      success: true,
      data: {
        certificates: certificates.map(cert => ({
          _id: cert._id,
          title: cert.title,
          module: cert.module,
          score: cert.score,
          issueDate: cert.issueDate,
          expiryDate: cert.expiryDate,
          certificateNumber: cert.certificateNumber,
          filePath: cert.filePath,
          status: cert.status
        }))
      }
    });
  } catch (error) {
    logger.error('Error al obtener certificados del usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener certificados',
      code: 'GET_CERTIFICATES_ERROR'
    });
  }
};

// Actualizar progreso de capacitación
const updateTrainingProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const { progress, status } = req.body;
    const userId = req.user.id;

    const training = await Training.findOne({ _id: id, assignedTo: userId });
    if (!training) {
      return res.status(404).json({
        success: false,
        message: 'Capacitación no encontrada'
      });
    }

    // Actualizar progreso
    if (progress !== undefined) {
      training.progress = Math.min(100, Math.max(0, progress));
    }

    // Si el progreso llega a 100, marcar como completado
    if (training.progress === 100 && training.status !== 'Completado') {
      training.status = 'Completado';
      training.completionDate = new Date();

      // Generar certificado automáticamente
      const certificate = new Certificate({
        trainingId: training._id,
        userId: training.assignedTo,
        title: training.title,
        module: training.module,
        score: Math.floor(Math.random() * 15) + 85 // Score aleatorio entre 85-100
      });

      await certificate.save();
    }

    if (status) {
      training.status = status;
      if (status === 'En proceso' && !training.startDate) {
        training.startDate = new Date();
      }
    }

    await training.save();

    res.json({
      success: true,
      data: {
        training: {
          _id: training._id,
          title: training.title,
          module: training.module,
          status: training.status,
          progress: training.progress,
          score: training.score,
          completionDate: training.completionDate
        }
      }
    });
  } catch (error) {
    logger.error('Error al actualizar progreso de capacitación:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar capacitación',
      code: 'UPDATE_TRAINING_ERROR'
    });
  }
};

// Descargar certificado
const downloadCertificate = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const certificate = await Certificate.findOne({
      _id: id,
      userId,
      status: 'Activo'
    });

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificado no encontrado'
      });
    }

    // Aquí iría la lógica para generar y enviar el PDF del certificado
    // Por ahora, devolver información del certificado
    res.json({
      success: true,
      data: {
        certificate: {
          _id: certificate._id,
          title: certificate.title,
          module: certificate.module,
          score: certificate.score,
          issueDate: certificate.issueDate,
          certificateNumber: certificate.certificateNumber
        },
        downloadUrl: `/api/trainings/certificates/${certificate._id}/download`
      }
    });
  } catch (error) {
    logger.error('Error al descargar certificado:', error);
    res.status(500).json({
      success: false,
      message: 'Error al descargar certificado',
      code: 'DOWNLOAD_CERTIFICATE_ERROR'
    });
  }
};

// Crear capacitación de ejemplo (para desarrollo)
const createSampleTrainings = async (req, res) => {
  try {
    const userId = req.user.id;

    const sampleTrainings = [
      {
        title: 'Fundamentos ISO 9001:2015',
        module: 'Módulo 1 — Contexto y Liderazgo',
        assignedTo: userId,
        status: 'Completado',
        progress: 100,
        score: 95,
        completionDate: new Date('2026-01-15'),
        scheduledDate: new Date('2026-01-15')
      },
      {
        title: 'Gestión de Documentos SGC',
        module: 'Módulo 2 — Control Documental',
        assignedTo: userId,
        status: 'Completado',
        progress: 100,
        score: 88,
        completionDate: new Date('2026-02-28'),
        scheduledDate: new Date('2026-02-28')
      },
      {
        title: 'Auditorías Internas ISO',
        module: 'Módulo 3 — Planificación',
        assignedTo: userId,
        status: 'En proceso',
        progress: 65,
        startDate: new Date(),
        scheduledDate: new Date('2026-03-15')
      },
      {
        title: 'Gestión de Riesgos y Oportunidades',
        module: 'Módulo 4 — Cláusula 6.1',
        assignedTo: userId,
        status: 'Pendiente',
        progress: 0,
        scheduledDate: new Date('2026-04-15')
      },
      {
        title: 'Mejora Continua y CAPA',
        module: 'Módulo 5 — Cláusula 10',
        assignedTo: userId,
        status: 'Pendiente',
        progress: 0,
        scheduledDate: new Date('2026-05-05')
      }
    ];

    // Eliminar capacitaciones existentes del usuario
    await Training.deleteMany({ assignedTo: userId });

    // Crear nuevas capacitaciones
    const createdTrainings = await Training.insertMany(sampleTrainings);

    // Crear certificados para las capacitaciones completadas
    const completedTrainings = createdTrainings.filter(t => t.status === 'Completado');
    for (const training of completedTrainings) {
      const certificate = new Certificate({
        trainingId: training._id,
        userId: training.assignedTo,
        title: training.title,
        module: training.module,
        score: training.score
      });
      await certificate.save();
    }

    res.json({
      success: true,
      message: 'Capacitaciones de ejemplo creadas exitosamente',
      data: {
        trainingsCount: createdTrainings.length,
        certificatesCount: completedTrainings.length
      }
    });
  } catch (error) {
    logger.error('Error al crear capacitaciones de ejemplo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear capacitaciones de ejemplo',
      code: 'CREATE_SAMPLE_TRAININGS_ERROR'
    });
  }
};

module.exports = {
  getUserTrainings,
  getUserCertificates,
  updateTrainingProgress,
  downloadCertificate,
  createSampleTrainings
};