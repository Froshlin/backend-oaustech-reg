const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true }, // Matric No. for students, Email for admins
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'admin'], required: true },
  name: { type: String },
  email: { type: String },
  department: { type: String },
  level: { type: String },
  profilePicture: { type: String },
}, { timestamps: true });

userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);