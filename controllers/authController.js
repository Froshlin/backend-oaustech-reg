const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cloudinary = require('../config/cloudinary');

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

exports.register = async (req, res) => {
  const { username, password, name, email, department, level } = req.body;
  const profilePictureFile = req.file; // From multer

  try {
    if (!username || !password || !name || !email || !department || !level) {
      return res.status(400).json({ message: 'All fields (username, password, name, email, department, level) are required' });
    }

    const userExists = await User.findOne({ username });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    let profilePicture = null;
    if (profilePictureFile) {
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { resource_type: 'image', folder: 'oaustech_student_profiles' },
          (error, result) => (error ? reject(error) : resolve(result))
        ).end(profilePictureFile.buffer);
      });
      profilePicture = result.secure_url;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      password: hashedPassword,
      role: 'student',
      name,
      email,
      department,
      level,
      profilePicture,
    });

    res.status(201).json({
      _id: user._id,
      username: user.username,
      role: user.role,
      token: generateToken(user._id, user.role),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (user) {
      const isMatch = await user.comparePassword(password);
      if (isMatch) {
        res.json({
          _id: user._id,
          username: user.username,
          role: user.role,
          token: generateToken(user._id, user.role),
        });
      } else {
        res.status(401).json({ message: 'Invalid Matric No. or password. Please try again.' });
      }
    } else {
      res.status(401).json({ message: 'Invalid Matric No. or password. Please try again.' });
    }
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ message: error.message });
  }
};