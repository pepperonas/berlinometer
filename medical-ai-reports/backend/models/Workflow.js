const mongoose = require('mongoose');

const workflowSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  practice: { type: mongoose.Schema.Types.ObjectId, ref: 'Practice', required: true },
  templatePrompt: String,
  fields: [{
    name: String,
    type: { type: String, enum: ['text', 'number', 'date', 'select'] },
    options: [String],
    required: Boolean
  }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Workflow', workflowSchema);
