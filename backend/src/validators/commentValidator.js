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

function validateCreateCommentPayload(payload = {}) {
  const errors = [];
  const conteudo = typeof payload.conteudo === 'string' ? payload.conteudo.trim() : '';

  if (!conteudo) {
    errors.push(createValidationError('conteudo', 'Conteúdo é obrigatório.'));
  } else if (conteudo.length > 300) {
    errors.push(createValidationError('conteudo', 'Conteúdo deve ter no máximo 300 caracteres.'));
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: {
      conteudo
    }
  };
}

function validatePostIdParam(postId) {
  const parsedPostId = parsePositiveInteger(postId);
  const errors = [];

  if (!parsedPostId) {
    errors.push(createValidationError('postId', 'ID do post deve ser um inteiro positivo.'));
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: {
      postId: parsedPostId
    }
  };
}

function validateListCommentsQuery(query = {}) {
  const errors = [];
  const page = query.page === undefined ? 1 : parsePositiveInteger(query.page);
  let limit = query.limit === undefined ? 20 : parsePositiveInteger(query.limit);

  if (!page) {
    errors.push(createValidationError('page', 'Página deve ser um inteiro positivo.'));
  }

  if (!limit) {
    errors.push(createValidationError('limit', 'Limite deve ser um inteiro positivo.'));
  } else if (limit > 50) {
    limit = 50;
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: {
      page,
      limit
    }
  };
}

module.exports = {
  validateCreateCommentPayload,
  validateListCommentsQuery,
  validatePostIdParam
};
