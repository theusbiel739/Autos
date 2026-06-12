const env = require('../config/env');

function errorHandler(error, req, res, next) {
  const statusCode = error.statusCode || 500;
  const response = {
    error: {
      message: error.message || 'Erro interno do servidor',
      status: statusCode
    }
  };

  if (env.nodeEnv === 'development' && error.stack) {
    response.error.stack = error.stack;
  }

  res.status(statusCode).json(response);
}

module.exports = errorHandler;
