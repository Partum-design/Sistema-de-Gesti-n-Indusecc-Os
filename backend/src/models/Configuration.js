const mongoose = require('mongoose');

const configSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed },
  description: { type: String },
  type: {
    type: String,
    enum: ['boolean', 'string', 'number', 'object'],
    default: 'string'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Configuration', configSchema);
