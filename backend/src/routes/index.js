const { Router } = require('express');

const healthRoutes = require('./health.routes');
const dbHealthRoutes = require('./dbHealth.routes');
const authRoutes = require('./auth.routes');
const adminRoutes = require('./admin.routes');
const { publicNewsRoutes } = require('./news.routes');
const postsRoutes = require('./posts.routes');
const reportsRoutes = require('./reports.routes');

const router = Router();

router.use('/health', healthRoutes);
router.use('/db/health', dbHealthRoutes);
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/news', publicNewsRoutes);
router.use('/posts', postsRoutes);
router.use('/reports', reportsRoutes);

module.exports = router;
