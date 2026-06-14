const {
  SESSION_COOKIE_NAME,
  findValidSessionByToken
} = require('../services/sessionService');

async function requireAuth(req, res, next) {
  try {
    const token = req.cookies ? req.cookies[SESSION_COOKIE_NAME] : null;

    if (!token) {
      return res.status(401).json({
        error: 'UNAUTHENTICATED',
        message: 'Não autenticado.'
      });
    }

    const result = await findValidSessionByToken(token);

    if (!result) {
      return res.status(401).json({
        error: 'UNAUTHENTICATED',
        message: 'Não autenticado.'
      });
    }

    req.user = result.user;
    req.session = result.session;

    return next();
  } catch (error) {
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Não foi possível validar a sessão.'
    });
  }
}

module.exports = {
  requireAuth
};
