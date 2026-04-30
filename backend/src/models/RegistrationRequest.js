const mongoose = require('mongoose');

const registrationRequestSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  department: { type: String },
  requestedRole: {
    type: String,
    enum: ['COLABORADOR', 'CONSULTOR', 'ADMIN'],
    default: 'COLABORADOR'
  },
  status: {
    type: String,
    enum: ['Pendiente', 'Aprobada', 'Rechazada'],
    default: 'Pendiente'
  },
  approvalNotes: { type: String },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: { type: Date, default: Date.now },
  approvedAt: { type: Date },
  rejectedAt: { type: Date }
});

// Índices
registrationRequestSchema.index({ status: 1 });
registrationRequestSchema.index({ createdAt: -1 });

module.exports = mongoose.model('RegistrationRequest', registrationRequestSchema);
