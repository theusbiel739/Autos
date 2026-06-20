const { Router } = require('express');

const adminNewsSourceController = require('../controllers/adminNewsSourceController');

const router = Router();

router.get('/', adminNewsSourceController.list);
router.get('/:sourceId', adminNewsSourceController.show);
router.post('/', adminNewsSourceController.create);
router.patch('/:sourceId', adminNewsSourceController.update);
router.patch('/:sourceId/status', adminNewsSourceController.updateStatus);

module.exports = router;
