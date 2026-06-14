const { Router } = require('express');

const postController = require('../controllers/postController');
const { requireAuth } = require('../middlewares/authMiddleware');

const router = Router();

router.get('/', postController.list);
router.get('/:id', postController.show);
router.post('/', requireAuth, postController.create);

module.exports = router;
