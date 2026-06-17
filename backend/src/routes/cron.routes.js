const { Router } = require('express');

const cronController = require('../controllers/cronController');
const requireCronSecret = require('../middlewares/requireCronSecret');

const router = Router();

router.post('/news/sync', requireCronSecret, cronController.syncNews);

module.exports = router;
