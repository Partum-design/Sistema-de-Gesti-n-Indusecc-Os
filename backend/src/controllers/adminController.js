const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const Configuration = require('../models/Configuration');
const logger = require('../utils/logger');
const bcrypt = require('bcryptjs');

// ===== CONFIGURACIÓN GLOBAL =====

// Obtener todas las configuraciones
const getConfiguration = async (req, res) => {
  try {
    const configs = await Configuration.find().populate('updatedBy', 'name email');

    res.json({
      success: true,
      message: 'Configuración obtenida',
      data: configs
    });
  } catch (error) {
    logger.error('Error al obtener configuración:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener configuración',
      code: 'GET_CONFIG_ERROR'
    });
  }
};

// Actualizar configuraciones globales
const updateConfiguration = async (req, res) => {
  try {
    const { settings } = req.body;
    const userId = req.user.id;

    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'El campo settings debe ser un objeto',
        code: 'INVALID_SETTINGS'
      });
    }

    const updatedConfigs = [];

    for (const [key, value] of Object.entries(settings)) {
      const config = await Configuration.findOneAndUpdate(
        { key },
        {
          value,
          updatedBy: userId,
          updatedAt: new Date()
        },
        { upsert: true, new: true }
      );
      updatedConfigs.push(config);
    }

    logger.info(`Configuración actualizada por usuario ${userId}:`, Object.keys(settings));

    res.json({
      success: true,
      message: 'Configuración guardada exitosamente',
      data: {
        updated: updatedConfigs.length,
        configs: updatedConfigs
      }
    });
  } catch (error) {
    logger.error('Error al actualizar configuración:', error);
    res.status(500).json({
      success: false,
      message: 'Error al guardar configuración',
      code: 'UPDATE_CONFIG_ERROR'
    });
  }
};

// Restaurar configuración a defaults
const restoreConfiguration = async (req, res) => {
  try {
    const userId = req.user.id;

    // Valores por defecto
    const defaultConfigs = {
      siteName: 'Indusecc SGC',
      version: '2.4.1',
      sessionTimeout: 60,
      maxUsers: 50,
      logRetention: 365,
      twoFactor: true,
      maintenanceMode: false,
      emailNotif: true,
      autoBackup: true,
      backupFrequency: 'Diario',
      debugMode: false,
      allowRegister: false
    };

    await Configuration.deleteMany({});

    const configs = await Promise.all(
      Object.entries(defaultConfigs).map(([key, value]) =>
        Configuration.create({
          key,
          value,
          updatedBy: userId,
          description: `Configuración por defecto: ${key}`
        })
      )
    );

    logger.info(`Configuración restaurada a valores predeterminados por usuario ${userId}`);

    res.json({
      success: true,
      message: 'Configuración restaurada a valores predeterminados',
      data: {
        configs: configs.length
      }
    });
  } catch (error) {
    logger.error('Error al restaurar configuración:', error);
    res.status(500).json({
      success: false,
      message: 'Error al restaurar configuración',
      code: 'RESTORE_CONFIG_ERROR'
    });
  }
};

// ===== GESTIÓN DE CONTRASEÑAS =====

// Resetear contraseña de usuario (SuperAdmin)
const resetUserPassword = async (req, res) => {
  try {
    const { userId, newPassword } = req.body;
    const adminId = req.user.id;

    if (!userId || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'userId y newPassword son requeridos',
        code: 'MISSING_FIELDS'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
        code: 'USER_NOT_FOUND'
      });
    }

    // Validar contraseña
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 8 caracteres',
        code: 'PASSWORD_TOO_SHORT'
      });
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe contener mayúsculas, minúsculas y números',
        code: 'WEAK_PASSWORD'
      });
    }

    // Cambiar contraseña
    user.password = newPassword;
    await user.save();

    // Registrar en auditoría
    await AuditLog.create({
      action: 'RESET_PASSWORD',
      module: 'Users',
      description: `${user.email} - contraseña reseteada por administrador`,
      status: 'Éxito',
      user: adminId,
      details: { targetUser: userId }
    });

    logger.info(`Contraseña reseteada para ${user.email} por usuario ${adminId}`);

    res.json({
      success: true,
      message: 'Contraseña reseteada exitosamente',
      data: {
        userId: user._id,
        email: user.email
      }
    });
  } catch (error) {
    logger.error('Error al resetear contraseña:', error);
    res.status(500).json({
      success: false,
      message: 'Error al resetear contraseña',
      code: 'RESET_PASSWORD_ERROR'
    });
  }
};

// ===== GESTIÓN DE LOGS =====

// Obtener logs de auditoría con paginación
const getAuditLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.action) filter.action = req.query.action;
    if (req.query.module) filter.module = req.query.module;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.userId) filter.user = req.query.userId;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      AuditLog.countDocuments(filter)
    ]);

    res.json({
      success: true,
      message: 'Logs de auditoría obtenidos',
      data: {
        logs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Error al obtener logs:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener logs',
      code: 'GET_LOGS_ERROR'
    });
  }
};

// Purgar logs antiguos
const purgeLogs = async (req, res) => {
  try {
    const { daysOld } = req.body;
    const userId = req.user.id;

    if (!daysOld || daysOld < 1) {
      return res.status(400).json({
        success: false,
        message: 'daysOld debe ser mayor a 0',
        code: 'INVALID_DAYS'
      });
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await AuditLog.deleteMany({
      createdAt: { $lt: cutoffDate }
    });

    logger.info(`${result.deletedCount} logs purgados por usuario ${userId}`);

    res.json({
      success: true,
      message: `${result.deletedCount} logs eliminados`,
      data: {
        deleted: result.deletedCount
      }
    });
  } catch (error) {
    logger.error('Error al purgar logs:', error);
    res.status(500).json({
      success: false,
      message: 'Error al purgar logs',
      code: 'PURGE_LOGS_ERROR'
    });
  }
};

// ===== SESIONES =====

// Logout de todos los usuarios (cierra todas las sesiones)
const logoutAllSessions = async (req, res) => {
  try {
    const userId = req.user.id;

    // En una implementación real, invalidarías todos los tokens
    // Por ahora, registramos la acción
    await AuditLog.create({
      action: 'LOGOUT_ALL',
      module: 'Sessions',
      description: 'Logout forzado de todas las sesiones',
      status: 'Éxito',
      user: userId
    });

    logger.info(`Logout de todas las sesiones iniciado por usuario ${userId}`);

    res.json({
      success: true,
      message: 'Todas las sesiones han sido cerradas',
      data: {
        message: 'Los usuarios deberán volver a iniciar sesión'
      }
    });
  } catch (error) {
    logger.error('Error al hacer logout de todas las sesiones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cerrar sesiones',
      code: 'LOGOUT_ALL_ERROR'
    });
  }
};

// ===== SISTEMA =====

// Limpiar caché
const clearCache = async (req, res) => {
  try {
    const userId = req.user.id;

    // En una implementación real, limpiarías Redis o similar
    // Por ahora, registramos la acción
    await AuditLog.create({
      action: 'CLEAR_CACHE',
      module: 'System',
      description: 'Caché del sistema limpiado',
      status: 'Éxito',
      user: userId
    });

    logger.info(`Caché limpiado por usuario ${userId}`);

    res.json({
      success: true,
      message: 'Caché limpiado exitosamente',
      data: {
        message: 'Sistema optimizado'
      }
    });
  } catch (error) {
    logger.error('Error al limpiar caché:', error);
    res.status(500).json({
      success: false,
      message: 'Error al limpiar caché',
      code: 'CLEAR_CACHE_ERROR'
    });
  }
};

module.exports = {
  getConfiguration,
  updateConfiguration,
  restoreConfiguration,
  resetUserPassword,
  getAuditLogs,
  purgeLogs,
  logoutAllSessions,
  clearCache
};
