const mongoose = require('mongoose');

const calendarSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  date: { type: Date, required: true },
  type: {
    type: String,
    enum: ['Auditoría', 'Capacitación', 'Reunión', 'Otro'],
    default: 'Otro'
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
calendarSchema.index({ date: 1 });
calendarSchema.index({ type: 1 });

module.exports = mongoose.model('Calendar', calendarSchema);