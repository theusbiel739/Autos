const { Router } = require('express');

const adminReportController = require('../controllers/adminReportController');

const router = Router();

router.get('/posts', adminReportController.listPostReportsHandler);
router.get('/comments', adminReportController.listCommentReportsHandler);
router.get('/posts/:reportId', adminReportController.showPostReport);
router.get('/comments/:reportId', adminReportController.showCommentReport);
router.patch('/posts/:reportId/status', adminReportController.updatePostReportStatusHandler);
router.patch('/comments/:reportId/status', adminReportController.updateCommentReportStatusHandler);

module.exports = router;
