const { Router } = require('express');

const adminReportsRoutes = require('./adminReports.routes');
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

router.use('/reports', requireAuth, requireModeratorOrAdmin, adminReportsRoutes);

module.exports = router;
