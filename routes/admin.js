const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const requireAdmin = require('../middleware/roleMiddleware')('admin');
const adminController = require('../controllers/adminController');

router.get('/students', protect, requireAdmin, adminController.getAllStudents);
router.post('/documents/:id/review', protect, requireAdmin, adminController.reviewDocument);
router.post('/students/:id/status', protect, requireAdmin, adminController.updateStudentStatus);
router.delete('/students/:id', protect, requireAdmin, adminController.deleteStudent);

router.get('/students/:id/documents', protect, requireAdmin, adminController.getStudentDocuments);
router.get('/students/:id/progress', protect, requireAdmin, adminController.getStudentProgress);

router.get('/students/:id', protect, requireAdmin, async (req, res, next) => {
  try {
    await adminController.getStudentDetails(req, res);
  } catch (error) {
    console.error('Route error:', error.message, error.stack);
    res.status(500).json({ message: 'Internal server error' });
    next(error);
  }
});

module.exports = router;