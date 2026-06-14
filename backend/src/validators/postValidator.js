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

function validateCreatePostPayload(payload = {}) {
  const errors = [];
  const conteudo = typeof payload.conteudo === 'string' ? payload.conteudo.trim() : '';
  const categoriaId = parsePositiveInteger(payload.categoria_id);
  let marcadorId = null;

  if (!conteudo) {
    errors.push(createValidationError('conteudo', 'Conteúdo é obrigatório.'));
  } else if (conteudo.length > 500) {
    errors.push(createValidationError('conteudo', 'Conteúdo deve ter no máximo 500 caracteres.'));
  }

  if (!categoriaId) {
    errors.push(createValidationError('categoria_id', 'Categoria é obrigatória.'));
  }

  if (payload.marcador_id !== undefined && payload.marcador_id !== null && payload.marcador_id !== '') {
    marcadorId = parsePositiveInteger(payload.marcador_id);

    if (!marcadorId) {
      errors.push(createValidationError('marcador_id', 'Marcador deve ser um inteiro positivo.'));
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: {
      categoria_id: categoriaId,
      marcador_id: marcadorId,
      conteudo
    }
  };
}

function validatePostIdParam(id) {
  const postId = parsePositiveInteger(id);
  const errors = [];

  if (!postId) {
    errors.push(createValidationError('id', 'ID do post deve ser um inteiro positivo.'));
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: {
      id: postId
    }
  };
}

function validateListPostsQuery(query = {}) {
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
  validateCreatePostPayload,
  validateListPostsQuery,
  validatePostIdParam
};
