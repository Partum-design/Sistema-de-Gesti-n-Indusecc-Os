const mongoose = require('mongoose');

const findingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  severity: {
    type: String,
    enum: ['Baja', 'Media', 'Alta', 'Crítica'],
    default: 'Media'
  },
  status: {
    type: String,
    enum: ['Abierto', 'En Revisión', 'Cerrado'],
    default: 'Abierto'
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  audit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Audit'
  },
  // Campos adicionales para hallazgos reportados por colaboradores
  area: { type: String },
  clause: { type: String },
  riskLevel: { type: String, enum: ['Bajo', 'Medio', 'Alto', 'Crítico'] },
  relatedDocument: { type: String },
  findingDate: { type: Date },
  immediateAction: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Índices
findingSchema.index({ audit: 1, status: 1 });
findingSchema.index({ severity: 1 });

module.exports = mongoose.model('Finding', findingSchema);