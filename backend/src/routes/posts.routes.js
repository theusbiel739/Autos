const { Router } = require('express');

const commentController = require('../controllers/commentController');
const postController = require('../controllers/postController');
const { requireAuth } = require('../middlewares/authMiddleware');

const router = Router();

router.get('/', postController.list);
router.get('/:postId/comments', commentController.listByPost);
router.post('/:postId/comments', requireAuth, commentController.create);
router.get('/:id', postController.show);
router.post('/', requireAuth, postController.create);

module.exports = router;
