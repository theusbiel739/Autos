const { Router } = require('express');

const healthRoutes = require('./health.routes');
const dbHealthRoutes = require('./dbHealth.routes');
const authRoutes = require('./auth.routes');
const adminRoutes = require('./admin.routes');

const router = Router();

router.use('/health', healthRoutes);
router.use('/db/health', dbHealthRoutes);
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
