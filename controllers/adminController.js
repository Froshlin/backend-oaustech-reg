const User = require('../models/User');
const Document = require('../models/Document');
const RegistrationProgress = require('../models/RegistrationProgress');
const studentController = require('./studentController');

const TOTAL_DOCUMENTS = 15;

exports.getAllStudents = async (req, res) => {

  try {
    const students = await User.find({ role: 'student' }).select('-password');
    const studentsWithData = await Promise.all(students.map(async (student) => {
      const docs = await Document.find({ studentId: student._id });
      const submitted = docs.length;
      const approved = docs.filter(d => d.status === 'approved').length;
      const progress = await RegistrationProgress.findOne({ studentId: student._id });

      return {
        ...student.toObject(),
        documentsSubmitted: submitted,
        documentsApproved: approved,
        totalDocuments: TOTAL_DOCUMENTS,
        status: progress ? progress.registrationStatus : 'incomplete',
      };
    }));
    res.json(studentsWithData);
  } catch (error) {
    console.error('Error in getAllStudents:', error.message, error.stack);
    res.status(500).json({ message: 'Failed to load student data' });
  }
};

exports.getStudentDetails = async (req, res) => {
  const { id } = req.params;
  try {
    const student = await User.findById(id).select('-password');
    if (!student || student.role !== 'student') {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.json({
      name: student.name,
      username: student.username,
      department: student.department || 'N/A',
      level: student.level || 'N/A',
    });
  } catch (error) {
    console.error('Error in getStudentDetails:', error.message, error.stack);
    res.status(500).json({ message: 'Failed to load student details' });
  }
};

exports.reviewDocument = async (req, res) => {
  const { id } = req.params;
  const { status, remarks } = req.body;
  try {
    const document = await Document.findByIdAndUpdate(id, { status }, { new: true });
    if (!document) return res.status(404).json({ message: 'Document not found' });

    if (remarks) {
      await RegistrationProgress.findOneAndUpdate(
        { studentId: document.studentId },
        { remarks },
        { upsert: true }
      );
    }

    const allDocs = await Document.find({ studentId: document.studentId });
    const allApproved = allDocs.every(d => d.status === 'approved');
    const hasRejected = allDocs.some(d => d.status === 'rejected');
    const hasPendingOrUploaded = allDocs.some(d => ['pending', 'uploaded', 'reviewing'].includes(d.status));
    let registrationStatus = 'under-review';
    if (allApproved) registrationStatus = 'approved';
    else if (hasRejected) registrationStatus = 'rejected';
    else if (!hasPendingOrUploaded && allDocs.length > 0) registrationStatus = 'uploaded';

    await RegistrationProgress.findOneAndUpdate(
      { studentId: document.studentId },
      { registrationStatus },
      { upsert: true }
    );

    res.json(document);
  } catch (error) {
    console.error('Error in reviewDocument:', error.message, error.stack);
    res.status(500).json({ message: error.message });
  }
};

exports.updateStudentStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const progress = await RegistrationProgress.findOneAndUpdate(
      { studentId: id },
      { registrationStatus: status },
      { upsert: true, new: true }
    );
    res.json(progress);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteStudent = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id);
    if (!user || user.role !== 'student') return res.status(404).json({ message: 'Student not found' });

    await User.findByIdAndDelete(id);
    await Document.deleteMany({ studentId: id });
    await RegistrationProgress.deleteOne({ studentId: id });

    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getStudentDocuments = studentController.getDocuments;
exports.getStudentProgress = studentController.getProgress;