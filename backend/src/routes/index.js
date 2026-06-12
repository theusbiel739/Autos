const { Router } = require('express');

const healthRoutes = require('./health.routes');
const dbHealthRoutes = require('./dbHealth.routes');

const router = Router();

router.use('/health', healthRoutes);
router.use('/db/health', dbHealthRoutes);

module.exports = router;
