const mongoose = require('mongoose');

const riskSchema = new mongoose.Schema({
  // Campos principales
  description: { type: String, required: true },
  title: { type: String }, // Alias de description para compatibilidad frontend
  process: { type: String, required: true },
  probability: { type: String, enum: ['Baja', 'Media', 'Alta'], required: true },
  impact: { type: String, enum: ['Bajo', 'Medio', 'Alto', 'Crítico'], required: true },
  owner: { type: String, required: true }, // Responsable
  control: { type: String }, // Medidas de control
  score: { type: Number }, // Calculado: prob * impacto
  // Campos adicionales para vista consultor
  cause: { type: String }, // Causa raíz
  action: { type: String }, // Acción de tratamiento
  level: { type: String, enum: ['Bajo', 'Medio', 'Alto', 'Crítico'] }, // Nivel de riesgo calculado
  status: { type: String, enum: ['Activo', 'En tratamiento', 'Controlado', 'Cerrado'], default: 'Activo' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Virtual para compatibilidad con frontend consultor
riskSchema.virtual('riesgo').get(function() { return this.description; });
riskSchema.virtual('proceso').get(function() { return this.process; });
riskSchema.virtual('probabilidad').get(function() { return this.probability; });
riskSchema.virtual('impacto').get(function() { return this.impact; });
riskSchema.virtual('responsable').get(function() { return this.owner; });
riskSchema.virtual('nivel').get(function() { return this.level; });
riskSchema.virtual('estado').get(function() { return this.status; });
riskSchema.virtual('accion').get(function() { return this.action; });
riskSchema.virtual('causa').get(function() { return this.cause; });

riskSchema.set('toJSON', { virtuals: true });
riskSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Risk', riskSchema);
