const Risk = require('../models/Risk');
const logger = require('../utils/logger');

const getRisks = async (req, res) => {
  try {
    const risks = await Risk.find().sort({ createdAt: -1 });
    // Convertir a JSON con virtuals incluidos
    const risksWithVirtuals = risks.map(r => r.toJSON());
    res.json({ success: true, count: risksWithVirtuals.length, data: risksWithVirtuals });
  } catch (error) {
    logger.error('Error al obtener riesgos:', error);
    res.status(500).json({ success: false, message: 'Error al obtener riesgos' });
  }
};

const createRisk = async (req, res) => {
  try {
    const {
      description, process, probability, impact, owner, control, score,
      cause, action, level, status, title
    } = req.body;

    const risk = new Risk({
      description: description || title,
      process,
      probability,
      impact,
      owner,
      control,
      score,
      cause,
      action,
      level,
      status: status || 'Activo',
      createdBy: req.user?.id
    });

    await risk.save();
    logger.info(`Riesgo creado exitosamente: ${risk.description}`);
    res.status(201).json({ success: true, data: risk.toJSON() });
  } catch (error) {
    logger.error('Error al crear riesgo:', error);
    res.status(500).json({ success: false, message: 'Error al crear riesgo' });
  }
};

const updateRisk = async (req, res) => {
  try {
    const updateData = { ...req.body, updatedAt: new Date() };
    const risk = await Risk.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    if (!risk) {
      return res.status(404).json({ success: false, message: 'Riesgo no encontrado' });
    }
    logger.info(`Riesgo actualizado: ${risk.description}`);
    res.json({ success: true, data: risk.toJSON() });
  } catch (error) {
    logger.error('Error al actualizar riesgo:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar riesgo' });
  }
};

const deleteRisk = async (req, res) => {
  try {
    const risk = await Risk.findByIdAndDelete(req.params.id);
    if (!risk) {
      return res.status(404).json({ success: false, message: 'Riesgo no encontrado' });
    }
    logger.info(`Riesgo eliminado: ${risk.description}`);
    res.json({ success: true, message: 'Riesgo eliminado' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al eliminar riesgo' });
  }
};

module.exports = { getRisks, createRisk, updateRisk, deleteRisk };
