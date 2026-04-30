const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  code: { type: String, trim: true },
  title: { type: String, trim: true },
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  mimetype: { type: String },
  size: { type: Number },
  url: { type: String },
  type: { type: String, trim: true },
  status: {
    type: String,
    enum: ['Vigente', 'Vencido', 'Archivado'],
    default: 'Vigente'
  },
  category: { type: String },
  clause: { type: String, trim: true },
  responsible: { type: String, trim: true },
  description: { type: String },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  expiryDate: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

documentSchema.index({ code: 1 });
documentSchema.index({ title: 'text', originalName: 'text', filename: 'text' });
documentSchema.index({ status: 1 });
documentSchema.index({ uploadedBy: 1 });
documentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Document', documentSchema);
