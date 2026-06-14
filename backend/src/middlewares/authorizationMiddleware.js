const { requireAuth } = require('./authMiddleware');

const USER_ROLE_IDS = {
  USUARIO: 1,
  MODERADOR: 2,
  ADMINISTRADOR: 3
};

function requireRole(allowedRoles) {
  const allowedRoleIds = new Set(allowedRoles.map(Number));

  return function authorizeRole(req, res, next) {
    if (!req.user) {
      return res.status(401).json({
        error: 'UNAUTHENTICATED',
        message: 'Não autenticado.'
      });
    }

    if (!allowedRoleIds.has(Number(req.user.tipo_usuario_id))) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: 'Acesso negado.'
      });
    }

    return next();
  };
}

const requireAdmin = requireRole([USER_ROLE_IDS.ADMINISTRADOR]);
const requireModeratorOrAdmin = requireRole([
  USER_ROLE_IDS.MODERADOR,
  USER_ROLE_IDS.ADMINISTRADOR
]);

module.exports = {
  USER_ROLE_IDS,
  requireAuth,
  requireRole,
  requireAdmin,
  requireModeratorOrAdmin
};
