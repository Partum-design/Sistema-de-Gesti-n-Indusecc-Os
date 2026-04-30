const Finding = require('../models/Finding');
const User = require('../models/User');
const logger = require('../utils/logger');
const sendEmail = require('../utils/email');

// Crear hallazgo
const createFinding = async (req, res) => {
  try {
    const {
      title,
      description,
      severity,
      assignedTo,
      audit,
      area,
      clause,
      riskLevel,
      relatedDocument,
      findingDate,
      immediateAction
    } = req.body;

    const reportedBy = req.user.id;

    // Mapear severity del frontend al formato del backend
    const severityMap = {
      'critical': 'Crítica',
      'high': 'Alta',
      'medium': 'Media',
      'low': 'Baja'
    };

    const finding = new Finding({
      title,
      description,
      severity: severityMap[severity] || severity, // Usar mapeo o el valor original si ya está correcto
      assignedTo,
      audit,
      reportedBy,
      area,
      clause,
      riskLevel,
      relatedDocument,
      findingDate: findingDate ? new Date(findingDate) : undefined,
      immediateAction
    });

    await finding.save();

    // Notificar a los administradores sobre el nuevo hallazgo
    try {
      const admins = await User.find({ role: { $in: ['ADMIN', 'SUPER_ADMIN'] }, active: true });
      if (admins.length > 0) {
        const adminEmails = admins.map(admin => admin.email);
        const reporterName = req.user.name || req.user.email;
        const findingSeverity = severityMap[severity] || severity;
        
        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #9B1C1C; border-bottom: 2px solid #D4AF37; padding-bottom: 10px;">Nuevo Hallazgo Reportado</h2>
            <p>Se ha registrado un nuevo hallazgo en la plataforma que requiere revisión.</p>
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #9B1C1C;">
              <p><strong>Título:</strong> ${title}</p>
              <p><strong>Severidad:</strong> <span style="color: #c62828; font-weight: bold;">${findingSeverity}</span></p>
              <p><strong>Área:</strong> ${area || 'No especificada'}</p>
              <p><strong>Reportado por:</strong> ${reporterName}</p>
              <p><strong>Descripción:</strong> ${description || 'Sin descripción'}</p>
            </div>
            <p>Por favor, ingresa al panel de administración para gestionar este hallazgo.</p>
            <hr />
            <p style="font-size: 0.7em; color: #999;">Indusecc SGC - Sistema de Gestión de Calidad</p>
          </div>
        `;

        // Enviamos correos individuales para evitar problemas de privacidad en el campo 'to'
        for (const admin of admins) {
          if (admin.email) {
            await sendEmail({
              email: admin.email,
              subject: `⚠️ Nuevo Hallazgo: ${title}`,
              message: `Se ha reportado un nuevo hallazgo de severidad ${findingSeverity} por ${reporterName}.`,
              html: html
            });
          }
        }
      }
    } catch (err) {
      logger.error('Error al enviar notificaciones de nuevo hallazgo a administradores:', err);
    }

    logger.info(`Hallazgo creado: ${title} por ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Hallazgo creado exitosamente',
      data: {
        finding: {
          id: finding._id,
          title: finding.title,
          description: finding.description,
          severity: finding.severity,
          status: finding.status,
          reportedBy: finding.reportedBy,
          assignedTo: finding.assignedTo,
          audit: finding.audit,
          area: finding.area,
          clause: finding.clause,
          riskLevel: finding.riskLevel,
          relatedDocument: finding.relatedDocument,
          findingDate: finding.findingDate,
          immediateAction: finding.immediateAction,
          createdAt: finding.createdAt,
        }
      }
    });
  } catch (error) {
    logger.error('Error al crear hallazgo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear hallazgo',
      code: 'CREATE_FINDING_ERROR'
    });
  }
};

// Obtener hallazgos con paginación y filtros
const getFindings = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const skip = (page - 1) * limit;

    // Filtros
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.severity) filter.severity = req.query.severity;
    if (req.query.audit) filter.audit = req.query.audit;
    if (req.query.assignedTo) filter.assignedTo = req.query.assignedTo;
    if (req.query.search) {
      filter.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Aplicar filtros de permisos
    // CONSULTOR: acceso de solo lectura a TODOS los hallazgos (rol de auditoría externa)
    // COLABORADOR: solo ve los hallazgos en los que participa
    if (req.user.role === 'COLABORADOR') {
      filter.$or = [
        { reportedBy: req.user.id },
        { assignedTo: req.user.id }
      ];
    }

    const [findings, total] = await Promise.all([
      Finding.find(filter)
        .populate('reportedBy', 'name email')
        .populate('assignedTo', 'name email')
        .populate('audit', 'title')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Finding.countDocuments(filter)
    ]);

    res.json({
      success: true,
      message: 'Hallazgos obtenidos exitosamente',
      data: {
        findings,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Error al obtener hallazgos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener hallazgos',
      code: 'GET_FINDINGS_ERROR'
    });
  }
};

// Obtener hallazgo por ID
const getFindingById = async (req, res) => {
  try {
    const finding = await Finding.findById(req.params.id)
      .populate('reportedBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate('audit', 'title');

    if (!finding) {
      return res.status(404).json({
        success: false,
        message: 'Hallazgo no encontrado',
        code: 'FINDING_NOT_FOUND'
      });
    }

    // Verificar permisos — CONSULTOR tiene acceso de solo lectura a todos
    if (req.user.role === 'COLABORADOR' &&
        finding.reportedBy._id.toString() !== req.user.id &&
        finding.assignedTo?._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para ver este hallazgo',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    res.json({
      success: true,
      message: 'Hallazgo obtenido exitosamente',
      data: { finding }
    });
  } catch (error) {
    logger.error('Error al obtener hallazgo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener hallazgo',
      code: 'GET_FINDING_ERROR'
    });
  }
};

// Actualizar hallazgo
const updateFinding = async (req, res) => {
  try {
    const { title, description, severity, assignedTo, status } = req.body;
    const updateData = {};

    const severityMap = {
      critical: 'CrÃ­tica',
      high: 'Alta',
      medium: 'Media',
      low: 'Baja'
    };

    const validStatuses = ['Abierto', 'En RevisiÃ³n', 'Cerrado'];

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (severity !== undefined) updateData.severity = severityMap[severity] || severity;
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo;
    if (status !== undefined) {
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Estado invÃ¡lido',
          code: 'INVALID_STATUS'
        });
      }
      updateData.status = status;
    }
    updateData.updatedAt = new Date();

    const finding = await Finding.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('reportedBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate('audit', 'title');

    if (!finding) {
      return res.status(404).json({
        success: false,
        message: 'Hallazgo no encontrado',
        code: 'FINDING_NOT_FOUND'
      });
    }

    // Verificar permisos
    if (req.user.role === 'CONSULTOR' &&
        finding.reportedBy._id.toString() !== req.user.id &&
        finding.assignedTo?._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para actualizar este hallazgo',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    if (req.user.role === 'COLABORADOR' &&
        finding.reportedBy._id.toString() !== req.user.id &&
        finding.assignedTo?._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para actualizar este hallazgo',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    logger.info(`Hallazgo actualizado: ${finding.title} por ${req.user.email}`);

    res.json({
      success: true,
      message: 'Hallazgo actualizado exitosamente',
      data: { finding }
    });
  } catch (error) {
    logger.error('Error al actualizar hallazgo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar hallazgo',
      code: 'UPDATE_FINDING_ERROR'
    });
  }
};

// Eliminar hallazgo
const deleteFinding = async (req, res) => {
  try {
    const finding = await Finding.findById(req.params.id);

    if (!finding) {
      return res.status(404).json({
        success: false,
        message: 'Hallazgo no encontrado',
        code: 'FINDING_NOT_FOUND'
      });
    }

    // Verificar permisos
    if (req.user.role === 'CONSULTOR' &&
        finding.reportedBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para eliminar este hallazgo',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    if (req.user.role === 'COLABORADOR' &&
        finding.reportedBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para eliminar este hallazgo',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    await Finding.findByIdAndDelete(req.params.id);

    logger.info(`Hallazgo eliminado: ${finding.title} por ${req.user.email}`);

    res.json({
      success: true,
      message: 'Hallazgo eliminado exitosamente',
      data: { deletedFinding: { id: finding._id, title: finding.title } }
    });
  } catch (error) {
    logger.error('Error al eliminar hallazgo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar hallazgo',
      code: 'DELETE_FINDING_ERROR'
    });
  }
};

// Cambiar estado de hallazgo
const updateFindingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Abierto', 'En Revisión', 'Cerrado'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Estado inválido',
        code: 'INVALID_STATUS'
      });
    }

    const finding = await Finding.findById(req.params.id);

    if (!finding) {
      return res.status(404).json({
        success: false,
        message: 'Hallazgo no encontrado',
        code: 'FINDING_NOT_FOUND'
      });
    }

    // Verificar permisos
    if (req.user.role === 'CONSULTOR' &&
        finding.reportedBy.toString() !== req.user.id &&
        finding.assignedTo?.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para cambiar el estado de este hallazgo',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    if (req.user.role === 'COLABORADOR' &&
        finding.reportedBy.toString() !== req.user.id &&
        finding.assignedTo?.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para cambiar el estado de este hallazgo',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    finding.status = status;
    finding.updatedAt = new Date();
    await finding.save();

    await finding.populate('reportedBy', 'name email');
    await finding.populate('assignedTo', 'name email');
    await finding.populate('audit', 'title');

    logger.info(`Estado de hallazgo cambiado: ${finding.title} -> ${status} por ${req.user.email}`);

    res.json({
      success: true,
      message: 'Estado actualizado exitosamente',
      data: { finding }
    });
  } catch (error) {
    logger.error('Error al cambiar estado de hallazgo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar estado de hallazgo',
      code: 'UPDATE_FINDING_STATUS_ERROR'
    });
  }
};

// Asignar hallazgo
const assignFinding = async (req, res) => {
  try {
    const { assignedTo } = req.body;

    const finding = await Finding.findById(req.params.id);

    if (!finding) {
      return res.status(404).json({
        success: false,
        message: 'Hallazgo no encontrado',
        code: 'FINDING_NOT_FOUND'
      });
    }

    // Verificar permisos
    if (req.user.role === 'CONSULTOR' &&
        finding.reportedBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para asignar este hallazgo',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    finding.assignedTo = assignedTo;
    finding.updatedAt = new Date();
    await finding.save();

    await finding.populate('reportedBy', 'name email');
    await finding.populate('assignedTo', 'name email');
    await finding.populate('audit', 'title');

    logger.info(`Hallazgo asignado: ${finding.title} -> ${finding.assignedTo?.name || 'Sin asignar'} por ${req.user.email}`);

    res.json({
      success: true,
      message: 'Hallazgo asignado exitosamente',
      data: { finding }
    });
  } catch (error) {
    logger.error('Error al asignar hallazgo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al asignar hallazgo',
      code: 'ASSIGN_FINDING_ERROR'
    });
  }
};

// Estadísticas de hallazgos
const getFindingStats = async (req, res) => {
  try {
    const stats = await Finding.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    const severityStats = await Finding.aggregate([
      {
        $group: {
          _id: '$severity',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    const totalFindings = await Finding.countDocuments();
    const openFindings = await Finding.countDocuments({ status: 'Abierto' });
    const inReviewFindings = await Finding.countDocuments({ status: 'En Revisión' });
    const closedFindings = await Finding.countDocuments({ status: 'Cerrado' });
    const highSeverityFindings = await Finding.countDocuments({ severity: 'Alta' });
    const recentFindings = await Finding.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });

    res.json({
      success: true,
      message: 'Estadísticas de hallazgos obtenidas exitosamente',
      data: {
        totalFindings,
        openFindings,
        inReviewFindings,
        closedFindings,
        highSeverityFindings,
        recentFindings,
        byStatus: stats,
        bySeverity: severityStats
      }
    });
  } catch (error) {
    logger.error('Error al obtener estadísticas de hallazgos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas',
      code: 'GET_FINDING_STATS_ERROR'
    });
  }
};

module.exports = {
  createFinding,
  getFindings,
  getFindingById,
  updateFinding,
  deleteFinding,
  updateFindingStatus,
  assignFinding,
  getFindingStats,
};
