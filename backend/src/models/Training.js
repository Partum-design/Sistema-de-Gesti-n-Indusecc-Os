const mongoose = require('mongoose');

const trainingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  module: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['Pendiente', 'En proceso', 'Pendiente de aprobacion', 'Completado'],
    default: 'Pendiente'
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  score: {
    type: Number,
    min: 0,
    max: 100
  },
  startDate: {
    type: Date
  },
  completionDate: {
    type: Date
  },
  scheduledDate: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Índices para optimización
trainingSchema.index({ assignedTo: 1, status: 1 });
trainingSchema.index({ scheduledDate: 1 });

// Middleware para actualizar updatedAt
trainingSchema.pre('save', function(next) {
  if (!this.isModified()) return next();
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Training', trainingSchema);
