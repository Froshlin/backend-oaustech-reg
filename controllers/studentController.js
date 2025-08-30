const Document = require('../models/Document');
const RegistrationProgress = require('../models/RegistrationProgress');
const User = require('../models/User');
const cloudinary = require('../config/cloudinary');

const TOTAL_DOCUMENTS = 15;

const updateProgress = async (studentId) => {
  const documents = await Document.find({ studentId });
  const uploadedCount = documents.length;
  const percentage = Math.round((uploadedCount / TOTAL_DOCUMENTS) * 100);
  await RegistrationProgress.findOneAndUpdate(
    { studentId },
    { completionPercentage: percentage },
    { upsert: true, new: true }
  );
};

exports.uploadDocument = async (req, res) => {
  const { documentType } = req.body;
  const studentId = req.params.id;
  try {
    const existingDoc = await Document.findOne({ studentId, documentType });
    if (existingDoc) return res.status(400).json({ message: 'Document type already uploaded' });

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { resource_type: 'auto', folder: 'oaustech_student_docs' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });

    const document = await Document.create({
      studentId,
      documentType,
      fileURL: result.secure_url,
      status: 'pending',
    });

    await updateProgress(studentId);
    res.status(201).json(document);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.uploadProfilePicture = async (req, res) => {
  const studentId = req.params.id;
  try {
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { resource_type: 'image', folder: 'oaustech_student_profiles' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });

    const user = await User.findByIdAndUpdate(studentId, { profilePicture: result.secure_url }, { new: true });
    if (!user) return res.status(404).json({ message: 'Student not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getDocuments = async (req, res) => {
  const studentId = req.params.id;
  try {
    const documents = await Document.find({ studentId });
    res.json(documents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getProgress = async (req, res) => {
  const studentId = req.params.id;
  try {
    let progress = await RegistrationProgress.findOne({ studentId });
    if (!progress) {
      progress = await RegistrationProgress.create({ studentId, completionPercentage: 0 });
    }
    res.json(progress);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};