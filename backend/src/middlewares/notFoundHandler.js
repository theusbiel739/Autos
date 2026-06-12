const AppError = require('../utils/AppError');

function notFoundHandler(req, res, next) {
  next(new AppError(`Rota nao encontrada: ${req.originalUrl}`, 404));
}

module.exports = notFoundHandler;
