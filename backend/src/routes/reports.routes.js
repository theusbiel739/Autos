const { Router } = require('express');

const reportController = require('../controllers/reportController');
const { requireAuth } = require('../middlewares/authMiddleware');

const router = Router();

router.get('/types', reportController.listTypes);
router.post('/posts/:postId', requireAuth, reportController.createPostReport);
router.post('/comments/:commentId', requireAuth, reportController.createCommentReport);

module.exports = router;
