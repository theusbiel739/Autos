const {
  SESSION_COOKIE_NAME,
  findValidSessionByToken
} = require('../services/sessionService');
const pool = require('../config/database');

async function findUserRoleId(userId) {
  const [rows] = await pool.execute(
    `SELECT tipo_usuario_id
     FROM usuarios
     WHERE id = ?
       AND status = 'ativo'
     LIMIT 1`,
    [userId]
  );

  if (rows.length === 0) {
    return null;
  }

  return rows[0].tipo_usuario_id;
}

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

    const tipoUsuarioId = await findUserRoleId(result.user.id);

    if (!tipoUsuarioId) {
      return res.status(401).json({
        error: 'UNAUTHENTICATED',
        message: 'Não autenticado.'
      });
    }

    req.user = {
      ...result.user,
      tipo_usuario_id: tipoUsuarioId
    };
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
