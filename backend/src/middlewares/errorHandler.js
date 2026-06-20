function errorHandler(error, req, res, next) {
  const statusCode = error.statusCode || 500;
  const message = statusCode >= 500
    ? 'Erro interno do servidor'
    : error.message || 'Erro interno do servidor';
  const response = {
    error: {
      message,
      status: statusCode
    }
  };

  res.status(statusCode).json(response);
}

module.exports = errorHandler;
