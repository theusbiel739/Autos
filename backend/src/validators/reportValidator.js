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

function validateCommentIdParam(commentId) {
  const parsedCommentId = parsePositiveInteger(commentId);
  const errors = [];

  if (!parsedCommentId) {
    errors.push(createValidationError('commentId', 'ID do comentário deve ser um inteiro positivo.'));
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: {
      commentId: parsedCommentId
    }
  };
}

function validateCreateReportPayload(payload = {}) {
  const reportPayload = payload && typeof payload === 'object' ? payload : {};
  const errors = [];
  const tipoDenunciaId = parsePositiveInteger(reportPayload.tipo_denuncia_id);
  let descricao = null;

  if (!tipoDenunciaId) {
    errors.push(createValidationError('tipo_denuncia_id', 'Tipo de denúncia é obrigatório.'));
  }

  if (reportPayload.descricao !== undefined && reportPayload.descricao !== null) {
    if (typeof reportPayload.descricao !== 'string') {
      errors.push(createValidationError('descricao', 'Descrição deve ser um texto.'));
    } else {
      descricao = reportPayload.descricao.trim() || null;

      if (descricao && descricao.length > 300) {
        errors.push(createValidationError('descricao', 'Descrição deve ter no máximo 300 caracteres.'));
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: {
      tipo_denuncia_id: tipoDenunciaId,
      descricao
    }
  };
}

module.exports = {
  validateCommentIdParam,
  validateCreateReportPayload,
  validatePostIdParam
};
