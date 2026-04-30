const Calendar = require('../models/Calendar');
const logger = require('../utils/logger');

// Crear evento de calendario
const createCalendar = async (req, res) => {
  try {
    const { title, description, date, type, assignedTo } = req.body;
    const createdBy = req.user.id;

    const calendar = new Calendar({
      title,
      description,
      date: new Date(date),
      type,
      assignedTo,
      createdBy
    });

    await calendar.save();

    logger.info(`Evento de calendario creado: ${title} por ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Evento de calendario creado exitosamente',
      data: {
        calendar: {
          id: calendar._id,
          title: calendar.title,
          description: calendar.description,
          date: calendar.date,
          type: calendar.type,
          assignedTo: calendar.assignedTo,
          createdBy: calendar.createdBy,
          createdAt: calendar.createdAt,
        }
      }
    });
  } catch (error) {
    logger.error('Error al crear evento de calendario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear evento de calendario',
      code: 'CREATE_CALENDAR_ERROR'
    });
  }
};

// Obtener eventos de calendario con paginación y filtros
const getCalendars = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const skip = (page - 1) * limit;

    // Filtros
    const filter = {};
    if (req.query.type) filter.type = req.query.type;
    if (req.query.assignedTo) filter.assignedTo = req.query.assignedTo;
    if (req.query.search) {
      filter.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Filtro de fecha
    if (req.query.startDate && req.query.endDate) {
      filter.date = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    } else if (req.query.startDate) {
      filter.date = { $gte: new Date(req.query.startDate) };
    } else if (req.query.endDate) {
      filter.date = { $lte: new Date(req.query.endDate) };
    }

    // Aplicar filtros de permisos
    if (req.user.role === 'CONSULTOR') {
      filter.$or = [
        { createdBy: req.user.id },
        { assignedTo: req.user.id }
      ];
    } else if (req.user.role === 'COLABORADOR') {
      filter.assignedTo = req.user.id;
    }

    const [calendars, total] = await Promise.all([
      Calendar.find(filter)
        .populate('assignedTo', 'name email')
        .populate('createdBy', 'name email')
        .sort({ date: 1 })
        .skip(skip)
        .limit(limit),
      Calendar.countDocuments(filter)
    ]);

    res.json({
      success: true,
      message: 'Eventos de calendario obtenidos exitosamente',
      data: {
        calendars,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Error al obtener eventos de calendario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener eventos de calendario',
      code: 'GET_CALENDARS_ERROR'
    });
  }
};

// Obtener evento de calendario por ID
const getCalendarById = async (req, res) => {
  try {
    const calendar = await Calendar.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');

    if (!calendar) {
      return res.status(404).json({
        success: false,
        message: 'Evento de calendario no encontrado',
        code: 'CALENDAR_NOT_FOUND'
      });
    }

    // Verificar permisos
    if (req.user.role === 'CONSULTOR' &&
        calendar.createdBy._id.toString() !== req.user.id &&
        calendar.assignedTo?._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para ver este evento',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    if (req.user.role === 'COLABORADOR' && calendar.assignedTo?._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para ver este evento',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    res.json({
      success: true,
      message: 'Evento de calendario obtenido exitosamente',
      data: { calendar }
    });
  } catch (error) {
    logger.error('Error al obtener evento de calendario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener evento de calendario',
      code: 'GET_CALENDAR_ERROR'
    });
  }
};

// Actualizar evento de calendario
const updateCalendar = async (req, res) => {
  try {
    const { title, description, date, type, assignedTo } = req.body;
    const updateData = {};

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (date !== undefined) updateData.date = new Date(date);
    if (type !== undefined) updateData.type = type;
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo;
    updateData.updatedAt = new Date();

    const calendar = await Calendar.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');

    if (!calendar) {
      return res.status(404).json({
        success: false,
        message: 'Evento de calendario no encontrado',
        code: 'CALENDAR_NOT_FOUND'
      });
    }

    // Verificar permisos
    if (req.user.role === 'CONSULTOR' && calendar.createdBy._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para actualizar este evento',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    logger.info(`Evento de calendario actualizado: ${calendar.title} por ${req.user.email}`);

    res.json({
      success: true,
      message: 'Evento de calendario actualizado exitosamente',
      data: { calendar }
    });
  } catch (error) {
    logger.error('Error al actualizar evento de calendario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar evento de calendario',
      code: 'UPDATE_CALENDAR_ERROR'
    });
  }
};

// Eliminar evento de calendario
const deleteCalendar = async (req, res) => {
  try {
    const calendar = await Calendar.findById(req.params.id);

    if (!calendar) {
      return res.status(404).json({
        success: false,
        message: 'Evento de calendario no encontrado',
        code: 'CALENDAR_NOT_FOUND'
      });
    }

    // Verificar permisos
    if (req.user.role === 'CONSULTOR' && calendar.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para eliminar este evento',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    await Calendar.findByIdAndDelete(req.params.id);

    logger.info(`Evento de calendario eliminado: ${calendar.title} por ${req.user.email}`);

    res.json({
      success: true,
      message: 'Evento de calendario eliminado exitosamente',
      data: { deletedCalendar: { id: calendar._id, title: calendar.title } }
    });
  } catch (error) {
    logger.error('Error al eliminar evento de calendario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar evento de calendario',
      code: 'DELETE_CALENDAR_ERROR'
    });
  }
};

// Asignar evento de calendario
const assignCalendar = async (req, res) => {
  try {
    const { assignedTo } = req.body;

    const calendar = await Calendar.findById(req.params.id);

    if (!calendar) {
      return res.status(404).json({
        success: false,
        message: 'Evento de calendario no encontrado',
        code: 'CALENDAR_NOT_FOUND'
      });
    }

    // Verificar permisos
    if (req.user.role === 'CONSULTOR' && calendar.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para asignar este evento',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    calendar.assignedTo = assignedTo;
    calendar.updatedAt = new Date();
    await calendar.save();

    await calendar.populate('assignedTo', 'name email');
    await calendar.populate('createdBy', 'name email');

    logger.info(`Evento de calendario asignado: ${calendar.title} -> ${calendar.assignedTo?.name || 'Sin asignar'} por ${req.user.email}`);

    res.json({
      success: true,
      message: 'Evento de calendario asignado exitosamente',
      data: { calendar }
    });
  } catch (error) {
    logger.error('Error al asignar evento de calendario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al asignar evento de calendario',
      code: 'ASSIGN_CALENDAR_ERROR'
    });
  }
};

// Estadísticas de calendario
const getCalendarStats = async (req, res) => {
  try {
    const stats = await Calendar.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    const totalEvents = await Calendar.countDocuments();
    const upcomingEvents = await Calendar.countDocuments({
      date: { $gte: new Date() }
    });
    const pastEvents = await Calendar.countDocuments({
      date: { $lt: new Date() }
    });
    const thisMonthEvents = await Calendar.countDocuments({
      date: {
        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        $lt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
      }
    });
    const nextMonthEvents = await Calendar.countDocuments({
      date: {
        $gte: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
        $lt: new Date(new Date().getFullYear(), new Date().getMonth() + 2, 1)
      }
    });

    res.json({
      success: true,
      message: 'Estadísticas de calendario obtenidas exitosamente',
      data: {
        totalEvents,
        upcomingEvents,
        pastEvents,
        thisMonthEvents,
        nextMonthEvents,
        byType: stats
      }
    });
  } catch (error) {
    logger.error('Error al obtener estadísticas de calendario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas',
      code: 'GET_CALENDAR_STATS_ERROR'
    });
  }
};

module.exports = {
  createCalendar,
  getCalendars,
  getCalendarById,
  updateCalendar,
  deleteCalendar,
  assignCalendar,
  getCalendarStats,
};
