const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  documentType: { type: String, required: true },
  fileURL: { type: String, required: true },
  status: { type: String, default: 'pending', enum: ['pending', 'approved', 'rejected'] },
}, { timestamps: true });

module.exports = mongoose.model('Document', documentSchema);