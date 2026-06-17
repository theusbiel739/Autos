function requireCronSecret(req, res, next) {
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret || !expectedSecret.trim()) {
    return res.status(503).json({
      error: 'CRON_SECRET_NOT_CONFIGURED',
      message: 'Sincronização automática indisponível.'
    });
  }

  const providedSecret = req.get('x-cron-secret');

  if (!providedSecret || providedSecret !== expectedSecret) {
    return res.status(401).json({
      error: 'UNAUTHORIZED_CRON_REQUEST',
      message: 'Não autorizado.'
    });
  }

  return next();
}

module.exports = requireCronSecret;
