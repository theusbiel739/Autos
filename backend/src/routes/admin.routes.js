const { Router } = require('express');

const {
  requireAdmin,
  requireAuth
} = require('../middlewares/authorizationMiddleware');

const router = Router();

router.get('/health', requireAuth, requireAdmin, (req, res) => {
  return res.status(200).json({
    status: 'ok',
    area: 'admin'
  });
});

module.exports = router;
