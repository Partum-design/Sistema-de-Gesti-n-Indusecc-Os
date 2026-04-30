const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: { type: String, required: true },
  module: { type: String, required: true },
  description: { type: String },
  status: {
    type: String,
    enum: ['Éxito', 'Error', 'Advertencia'],
    default: 'Éxito'
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  details: { type: mongoose.Schema.Types.Mixed },
  ipAddress: { type: String },
  userAgent: { type: String },
  createdAt: { type: Date, default: Date.now }
});

// Índices para búsqueda rápida
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ user: 1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ module: 1 });
auditLogSchema.index({ status: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
