const Audit = require('../models/Audit');
const User = require('../models/User');
const logger = require('../utils/logger');
const sendEmail = require('../utils/email');

// Crear auditoría
const createAudit = async (req, res) => {
  try {
    const { title, description, date, assignedTo } = req.body;
    const createdBy = req.user.id;

    const audit = new Audit({
      title,
      description,
      date: new Date(date),
      assignedTo,
      createdBy
    });

    await audit.save();

    // Enviar notificación por correo si hay alguien asignado
    if (assignedTo) {
      try {
        const user = await User.findById(assignedTo);
        if (user && user.email) {
          const auditDate = new Date(date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
          const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
              <h2 style="color: #8B0000; border-bottom: 2px solid #D4AF37; padding-bottom: 10px;">Nueva Auditoría Asignada</h2>
              <p>Hola, <strong>${user.name}</strong>.</p>
              <p>Se te ha asignado una nueva auditoría en la plataforma <strong>Indusecc SGC</strong>.</p>
              <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #D4AF37;">
                <p><strong>Título:</strong> ${title}</p>
                <p><strong>Fecha Programada:</strong> ${auditDate}</p>
                <p><strong>Descripción:</strong> ${description || 'Sin descripción adicional'}</p>
              </div>
              <p>Por favor, revisa los detalles en tu panel de control.</p>
              <hr />
              <p style="font-size: 0.7em; color: #999;">Indusecc SGC - Sistema de Gestión de Calidad</p>
            </div>
          `;
          
          await sendEmail({
            email: user.email,
            subject: `Nueva Auditoría Asignada: ${title}`,
            message: `Hola ${user.name}, se te ha asignado la auditoría "${title}" para el día ${auditDate}.`,
            html: html
          });
        }
      } catch (err) {
        logger.error('Error al enviar correo de notificación de auditoría:', err);
        // No bloqueamos la respuesta exitosa si falla el envío del correo
      }
    }

    logger.info(`Auditoría creada: ${title} por ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Auditoría creada exitosamente',
      data: {
        audit: {
          id: audit._id,
          title: audit.title,
          description: audit.description,
          date: audit.date,
          status: audit.status,
          assignedTo: audit.assignedTo,
          createdBy: audit.createdBy,
          createdAt: audit.createdAt,
        }
      }
    });
  } catch (error) {
    logger.error('Error al crear auditoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear auditoría',
      code: 'CREATE_AUDIT_ERROR'
    });
  }
};

// Obtener auditorías con paginación y filtros
const getAudits = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const skip = (page - 1) * limit;

    // Filtros
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.assignedTo) filter.assignedTo = req.query.assignedTo;
    if (req.query.search) {
      filter.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Aplicar filtros de permisos
    // CONSULTOR: acceso de solo lectura a TODAS las auditorías (analista externo)
    // COLABORADOR: solo ve las auditorías que le fueron asignadas
    if (req.user.role === 'COLABORADOR') {
      filter.assignedTo = req.user.id;
    }

    const [audits, total] = await Promise.all([
      Audit.find(filter)
        .populate('assignedTo', 'name email')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Audit.countDocuments(filter)
    ]);

    res.json({
      success: true,
      message: 'Auditorías obtenidas exitosamente',
      data: {
        audits,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Error al obtener auditorías:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener auditorías',
      code: 'GET_AUDITS_ERROR'
    });
  }
};

// Obtener auditoría por ID
const getAuditById = async (req, res) => {
  try {
    const audit = await Audit.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');

    if (!audit) {
      return res.status(404).json({
        success: false,
        message: 'Auditoría no encontrada',
        code: 'AUDIT_NOT_FOUND'
      });
    }

    // Verificar permisos
    if (req.user.role === 'CONSULTOR' &&
        audit.createdBy._id.toString() !== req.user.id &&
        audit.assignedTo?._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para ver esta auditoría',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    if (req.user.role === 'COLABORADOR' && audit.assignedTo?._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para ver esta auditoría',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    res.json({
      success: true,
      message: 'Auditoría obtenida exitosamente',
      data: { audit }
    });
  } catch (error) {
    logger.error('Error al obtener auditoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener auditoría',
      code: 'GET_AUDIT_ERROR'
    });
  }
};

// Actualizar auditoría
const updateAudit = async (req, res) => {
  try {
    const { title, description, date, assignedTo } = req.body;
    const updateData = {};

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (date !== undefined) updateData.date = new Date(date);
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo;
    updateData.updatedAt = new Date();

    const audit = await Audit.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');

    if (!audit) {
      return res.status(404).json({
        success: false,
        message: 'Auditoría no encontrada',
        code: 'AUDIT_NOT_FOUND'
      });
    }

    // Verificar permisos
    if (req.user.role === 'CONSULTOR' && audit.createdBy._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para actualizar esta auditoría',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    logger.info(`Auditoría actualizada: ${audit.title} por ${req.user.email}`);

    res.json({
      success: true,
      message: 'Auditoría actualizada exitosamente',
      data: { audit }
    });
  } catch (error) {
    logger.error('Error al actualizar auditoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar auditoría',
      code: 'UPDATE_AUDIT_ERROR'
    });
  }
};

// Eliminar auditoría
const deleteAudit = async (req, res) => {
  try {
    const audit = await Audit.findById(req.params.id);

    if (!audit) {
      return res.status(404).json({
        success: false,
        message: 'Auditoría no encontrada',
        code: 'AUDIT_NOT_FOUND'
      });
    }

    // Verificar permisos
    if (req.user.role === 'CONSULTOR' && audit.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para eliminar esta auditoría',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    await Audit.findByIdAndDelete(req.params.id);

    logger.info(`Auditoría eliminada: ${audit.title} por ${req.user.email}`);

    res.json({
      success: true,
      message: 'Auditoría eliminada exitosamente',
      data: { deletedAudit: { id: audit._id, title: audit.title } }
    });
  } catch (error) {
    logger.error('Error al eliminar auditoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar auditoría',
      code: 'DELETE_AUDIT_ERROR'
    });
  }
};

// Cambiar estado de auditoría
const updateAuditStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Pendiente', 'En Progreso', 'Completada'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Estado inválido',
        code: 'INVALID_STATUS'
      });
    }

    const audit = await Audit.findById(req.params.id);

    if (!audit) {
      return res.status(404).json({
        success: false,
        message: 'Auditoría no encontrada',
        code: 'AUDIT_NOT_FOUND'
      });
    }

    // Verificar permisos
    if (req.user.role === 'CONSULTOR' &&
        audit.createdBy.toString() !== req.user.id &&
        audit.assignedTo?.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para cambiar el estado de esta auditoría',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    if (req.user.role === 'COLABORADOR' && audit.assignedTo?.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para cambiar el estado de esta auditoría',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    audit.status = status;
    audit.updatedAt = new Date();
    await audit.save();

    await audit.populate('assignedTo', 'name email');
    await audit.populate('createdBy', 'name email');

    logger.info(`Estado de auditoría cambiado: ${audit.title} -> ${status} por ${req.user.email}`);

    res.json({
      success: true,
      message: 'Estado actualizado exitosamente',
      data: { audit }
    });
  } catch (error) {
    logger.error('Error al cambiar estado de auditoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar estado de auditoría',
      code: 'UPDATE_AUDIT_STATUS_ERROR'
    });
  }
};

// Asignar auditoría
const assignAudit = async (req, res) => {
  try {
    const { assignedTo } = req.body;

    const audit = await Audit.findById(req.params.id);

    if (!audit) {
      return res.status(404).json({
        success: false,
        message: 'Auditoría no encontrada',
        code: 'AUDIT_NOT_FOUND'
      });
    }

    // Verificar permisos
    if (req.user.role === 'CONSULTOR' && audit.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para asignar esta auditoría',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    audit.assignedTo = assignedTo;
    audit.updatedAt = new Date();
    await audit.save();

    await audit.populate('assignedTo', 'name email');
    await audit.populate('createdBy', 'name email');

    // Enviar notificación al nuevo asignado
    if (audit.assignedTo && audit.assignedTo.email) {
      try {
        const auditDate = new Date(audit.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #8B0000; border-bottom: 2px solid #D4AF37; padding-bottom: 10px;">Auditoría Asignada</h2>
            <p>Hola, <strong>${audit.assignedTo.name}</strong>.</p>
            <p>Se te ha asignado (o reasignado) una auditoría en la plataforma <strong>Indusecc SGC</strong>.</p>
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #D4AF37;">
              <p><strong>Título:</strong> ${audit.title}</p>
              <p><strong>Fecha Programada:</strong> ${auditDate}</p>
              <p><strong>Descripción:</strong> ${audit.description || 'Sin descripción adicional'}</p>
            </div>
            <p>Por favor, revisa los detalles en tu panel de control.</p>
            <hr />
            <p style="font-size: 0.7em; color: #999;">Indusecc SGC - Sistema de Gestión de Calidad</p>
          </div>
        `;
        
        await sendEmail({
          email: audit.assignedTo.email,
          subject: `Auditoría Asignada: ${audit.title}`,
          message: `Hola ${audit.assignedTo.name}, se te ha asignado la auditoría "${audit.title}" para el día ${auditDate}.`,
          html: html
        });
      } catch (err) {
        logger.error('Error al enviar correo de notificación de asignación:', err);
      }
    }

    logger.info(`Auditoría asignada: ${audit.title} -> ${audit.assignedTo?.name || 'Sin asignar'} por ${req.user.email}`);

    res.json({
      success: true,
      message: 'Auditoría asignada exitosamente',
      data: { audit }
    });
  } catch (error) {
    logger.error('Error al asignar auditoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error al asignar auditoría',
      code: 'ASSIGN_AUDIT_ERROR'
    });
  }
};

// Estadísticas de auditorías
const getAuditStats = async (req, res) => {
  try {
    const stats = await Audit.aggregate([
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

    const totalAudits = await Audit.countDocuments();
    const completedAudits = await Audit.countDocuments({ status: 'Completada' });
    const inProgressAudits = await Audit.countDocuments({ status: 'En Progreso' });
    const pendingAudits = await Audit.countDocuments({ status: 'Pendiente' });
    const recentAudits = await Audit.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });

    res.json({
      success: true,
      message: 'Estadísticas de auditorías obtenidas exitosamente',
      data: {
        totalAudits,
        completedAudits,
        inProgressAudits,
        pendingAudits,
        recentAudits,
        byStatus: stats
      }
    });
  } catch (error) {
    logger.error('Error al obtener estadísticas de auditorías:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas',
      code: 'GET_AUDIT_STATS_ERROR'
    });
  }
};

module.exports = {
  createAudit,
  getAudits,
  getAuditById,
  updateAudit,
  deleteAudit,
  updateAuditStatus,
  assignAudit,
  getAuditStats,
};
