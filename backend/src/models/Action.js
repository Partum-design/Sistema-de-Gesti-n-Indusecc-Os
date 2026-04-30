const mongoose = require('mongoose');

const actionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  area: { type: String },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  dueDate: { type: Date },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  status: { 
    type: String, 
    enum: ['Iniciada', 'En Proceso', 'Cerrada'], 
    default: 'Iniciada' 
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Action', actionSchema);
