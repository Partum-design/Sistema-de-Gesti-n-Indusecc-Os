const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  trainingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Training',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
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
  score: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  issueDate: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date
  },
  certificateNumber: {
    type: String,
    unique: true,
    required: true
  },
  filePath: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['Activo', 'Expirado', 'Revocado'],
    default: 'Activo'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Índices para optimización
certificateSchema.index({ userId: 1, status: 1 });
certificateSchema.index({ certificateNumber: 1 });

// Generar número de certificado único antes de guardar
certificateSchema.pre('save', function(next) {
  if (this.isNew && !this.certificateNumber) {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    this.certificateNumber = `CERT-${timestamp}-${random}`;
  }
  next();
});

module.exports = mongoose.model('Certificate', certificateSchema);