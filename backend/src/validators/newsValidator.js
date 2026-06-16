function createValidationError(field, message) {
  return { field, message };
}

function parsePositiveInteger(value) {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
    return value;
  }

  if (typeof value !== 'string' || !/^\d+$/.test(value.trim())) {
    return null;
  }

  const parsedValue = Number(value);

  return Number.isSafeInteger(parsedValue) && parsedValue > 0 ? parsedValue : null;
}

function validateNewsIdParam(newsId) {
  const parsedNewsId = parsePositiveInteger(newsId);
  const errors = [];

  if (!parsedNewsId) {
    errors.push(createValidationError('newsId', 'ID da notícia deve ser um inteiro positivo.'));
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: {
      newsId: parsedNewsId
    }
  };
}

function validateListNewsQuery(query = {}) {
  const errors = [];
  const page = query.page === undefined ? 1 : parsePositiveInteger(query.page);
  const limit = query.limit === undefined ? 10 : parsePositiveInteger(query.limit);
  const fonteId = query.fonte_id === undefined ? null : parsePositiveInteger(query.fonte_id);

  if (!page) {
    errors.push(createValidationError('page', 'Página deve ser um inteiro positivo.'));
  }

  if (!limit) {
    errors.push(createValidationError('limit', 'Limite deve ser um inteiro positivo.'));
  } else if (limit > 50) {
    errors.push(createValidationError('limit', 'Limite deve ser no máximo 50.'));
  }

  if (query.fonte_id !== undefined && !fonteId) {
    errors.push(createValidationError('fonte_id', 'ID da fonte deve ser um inteiro positivo.'));
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: {
      page,
      limit,
      fonte_id: fonteId
    }
  };
}

module.exports = {
  validateListNewsQuery,
  validateNewsIdParam
};
