const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const protect = require('../middleware/authMiddleware');
const requireStudent = require('../middleware/roleMiddleware')('student');
const studentController = require('../controllers/studentController');

const checkOwnership = (req, res, next) => {
  const studentId = req.params.id;
  if (!req.user || !req.user._id) {
    return res.status(401).json({ message: 'User not authenticated' });
  }
  if (req.user._id.toString() !== studentId) {
    return res.status(403).json({ message: 'Not authorized to access this student data' });
  }
  next();
};

router.post('/:id/documents', protect, requireStudent, checkOwnership, upload.single('file'), studentController.uploadDocument);
router.post('/:id/profile-picture', protect, requireStudent, checkOwnership, upload.single('file'), studentController.uploadProfilePicture);

router.get('/:id/documents', protect, requireStudent, checkOwnership, studentController.getDocuments);

router.get('/:id/progress', protect, requireStudent, checkOwnership, studentController.getProgress);

module.exports = router;