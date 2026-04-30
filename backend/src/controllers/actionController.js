const Action = require('../models/Action');
const User = require('../models/User');
const logger = require('../utils/logger');
const sendEmail = require('../utils/email');

const getActions = async (req, res) => {
  try {
    const actions = await Action.find().populate('assignedTo', 'name').sort({ createdAt: -1 });
    res.json({ success: true, count: actions.length, data: { actions } });
  } catch (error) {
    logger.error('Error al obtener acciones de mejora continuas:', error);
    res.status(500).json({ success: false, message: 'Error al obtener acciones' });
  }
};

const createAction = async (req, res) => {
  try {
    const action = new Action(req.body);
    await action.save();

    // Notificar al asignado
    if (action.assignedTo) {
      try {
        const user = await User.findById(action.assignedTo);
        if (user && user.email) {
          const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
              <h2 style="color: #1B6B3A; border-bottom: 2px solid #D4AF37; padding-bottom: 10px;">Nueva Tarea Asignada</h2>
              <p>Hola, <strong>${user.name}</strong>.</p>
              <p>Se te ha asignado una nueva Acción de Mejora en <strong>Indusecc SGC</strong>.</p>
              <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #1B6B3A;">
                <p><strong>Tarea:</strong> ${action.title}</p>
                <p><strong>Área:</strong> ${action.area || 'General'}</p>
                <p><strong>Prioridad:</strong> ${action.priority || 'Normal'}</p>
                <p><strong>Vencimiento:</strong> ${action.dueDate ? new Date(action.dueDate).toLocaleDateString() : 'No definida'}</p>
              </div>
              <p>Por favor, revisa la sección "Mis Tareas" en la plataforma para más detalles.</p>
              <hr />
              <p style="font-size: 0.7em; color: #999;">Indusecc SGC - Sistema de Gestión de Calidad</p>
            </div>
          `;

          await sendEmail({
            email: user.email,
            subject: `📋 Nueva Tarea: ${action.title}`,
            message: `Hola ${user.name}, se te ha asignado una nueva tarea: ${action.title}.`,
            html: html
          });
        }
      } catch (err) {
        logger.error('Error al enviar correo de notificación de tarea:', err);
      }
    }

    logger.info(`Acción de mejora continua creada: ${action.code}`);
    res.status(201).json({ success: true, data: action });
  } catch (error) {
    logger.error('Error al crear acción de mejora continua:', error);
    res.status(500).json({ success: false, message: 'Error al crear acción' });
  }
};

const updateAction = async (req, res) => {
  try {
    const action = await Action.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('assignedTo');

    // Si se acaba de asignar o reasignar en el update
    if (req.body.assignedTo && action.assignedTo && action.assignedTo.email) {
      try {
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
              <h2 style="color: #1B6B3A; border-bottom: 2px solid #D4AF37; padding-bottom: 10px;">Tarea Actualizada / Asignada</h2>
              <p>Hola, <strong>${action.assignedTo.name}</strong>.</p>
              <p>Se ha actualizado o asignado una Acción de Mejora a tu nombre en <strong>Indusecc SGC</strong>.</p>
              <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #1D4ED8;">
                <p><strong>Tarea:</strong> ${action.title}</p>
                <p><strong>Área:</strong> ${action.area || 'General'}</p>
                <p><strong>Prioridad:</strong> ${action.priority || 'Normal'}</p>
              </div>
              <p>Revisa los cambios en tu panel de control.</p>
              <hr />
              <p style="font-size: 0.7em; color: #999;">Indusecc SGC - Sistema de Gestión de Calidad</p>
            </div>
          `;

        await sendEmail({
          email: action.assignedTo.email,
          subject: `🔄 Tarea Actualizada: ${action.title}`,
          message: `Hola ${action.assignedTo.name}, tu tarea "${action.title}" ha sido actualizada o asignada.`,
          html: html
        });
      } catch (err) {
        logger.error('Error al enviar correo de actualización de tarea:', err);
      }
    }

    res.json({ success: true, data: action });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al actualizar acción' });
  }
};

const deleteAction = async (req, res) => {
  try {
    await Action.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Acción eliminada' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al eliminar acción' });
  }
};

module.exports = { getActions, createAction, updateAction, deleteAction };
