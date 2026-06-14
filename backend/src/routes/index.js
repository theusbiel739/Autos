const { Router } = require('express');

const healthRoutes = require('./health.routes');
const dbHealthRoutes = require('./dbHealth.routes');
const authRoutes = require('./auth.routes');

const router = Router();

router.use('/health', healthRoutes);
router.use('/db/health', dbHealthRoutes);
router.use('/auth', authRoutes);

module.exports = router;
