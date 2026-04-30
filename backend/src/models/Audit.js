const mongoose = require('mongoose');

const auditSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  date: { type: Date, required: true },
  status: {
    type: String,
    enum: ['Pendiente', 'En Progreso', 'Completada'],
    default: 'Pendiente'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Índices
auditSchema.index({ date: -1 });
auditSchema.index({ status: 1 });

module.exports = mongoose.model('Audit', auditSchema);