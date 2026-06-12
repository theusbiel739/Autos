const { Router } = require('express');

const dbHealthController = require('../controllers/dbHealth.controller');

const router = Router();

router.get('/', dbHealthController.check);

module.exports = router;
