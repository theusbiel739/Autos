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

module.exports = {
  validatePostIdParam
};
