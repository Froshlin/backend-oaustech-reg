const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  completionPercentage: { type: Number, default: 0 },
  remarks: { type: String },
  registrationStatus: { type: String, default: 'incomplete', enum: ['incomplete', 'under-review', 'approved', 'rejected'] },
}, { timestamps: true });

module.exports = mongoose.model('RegistrationProgress', progressSchema);