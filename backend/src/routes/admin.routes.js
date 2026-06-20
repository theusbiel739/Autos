const { Router } = require('express');

const adminNewsSourcesRoutes = require('./adminNewsSources.routes');
const adminReportsRoutes = require('./adminReports.routes');
const { adminNewsRoutes } = require('./news.routes');
const {
  requireAdmin,
  requireAuth,
  requireModeratorOrAdmin
} = require('../middlewares/authorizationMiddleware');

const router = Router();

router.get('/health', requireAuth, requireAdmin, (req, res) => {
  return res.status(200).json({
    status: 'ok',
    area: 'admin'
  });
});

router.use('/news', requireAuth, requireModeratorOrAdmin, adminNewsRoutes);
router.use('/news-sources', requireAuth, requireModeratorOrAdmin, adminNewsSourcesRoutes);
router.use('/reports', requireAuth, requireModeratorOrAdmin, adminReportsRoutes);

module.exports = router;
