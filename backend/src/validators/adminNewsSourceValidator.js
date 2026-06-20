const ALLOWED_SOURCE_STATUSES = new Set(['ativa', 'inativa']);
const SOURCE_PAYLOAD_FIELDS = new Set(['nome', 'url_site', 'url_rss', 'status']);
const MAX_SOURCE_NAME_LENGTH = 120;
const MAX_URL_LENGTH = 255;

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

function isValidUrl(value) {
  try {
    const url = new URL(value);

    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (error) {
    return false;
  }
}

function getPayload(payload) {
  return payload && typeof payload === 'object' && !Array.isArray(payload) ? payload : {};
}

function validateAllowedFields(payload, errors) {
  Object.keys(payload).forEach((field) => {
    if (!SOURCE_PAYLOAD_FIELDS.has(field)) {
      errors.push(createValidationError(field, 'Campo não permitido.'));
    }
  });
}

function validateTextField(payload, field, label, maxLength, errors) {
  const value = payload[field];

  if (typeof value !== 'string') {
    errors.push(createValidationError(field, `${label} é obrigatório.`));
    return null;
  }

  const normalizedValue = value.trim();

  if (!normalizedValue) {
    errors.push(createValidationError(field, `${label} é obrigatório.`));
    return null;
  }

  if (normalizedValue.length > maxLength) {
    errors.push(createValidationError(field, `${label} deve ter no máximo ${maxLength} caracteres.`));
  }

  return normalizedValue;
}

function validateUrlField(payload, field, label, errors) {
  const value = validateTextField(payload, field, label, MAX_URL_LENGTH, errors);

  if (value && !isValidUrl(value)) {
    errors.push(createValidationError(field, `${label} deve ser uma URL válida.`));
  }

  return value;
}

function validateStatusField(payload, errors) {
  const value = payload.status;

  if (typeof value !== 'string') {
    errors.push(createValidationError('status', 'Status é obrigatório.'));
    return null;
  }

  const status = value.trim();

  if (!ALLOWED_SOURCE_STATUSES.has(status)) {
    errors.push(createValidationError('status', 'Status inválido.'));
  }

  return status;
}

function validateSourceIdParam(sourceId) {
  const parsedSourceId = parsePositiveInteger(sourceId);
  const errors = [];

  if (!parsedSourceId) {
    errors.push(createValidationError('sourceId', 'ID da fonte deve ser um inteiro positivo.'));
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: {
      sourceId: parsedSourceId
    }
  };
}

function validateCreateSourcePayload(payload = {}) {
  const sourcePayload = getPayload(payload);
  const errors = [];

  validateAllowedFields(sourcePayload, errors);

  const nome = validateTextField(
    sourcePayload,
    'nome',
    'Nome',
    MAX_SOURCE_NAME_LENGTH,
    errors
  );
  const urlSite = validateUrlField(sourcePayload, 'url_site', 'URL do site', errors);
  const urlRss = validateUrlField(sourcePayload, 'url_rss', 'URL RSS', errors);
  const status = sourcePayload.status === undefined ? 'ativa' : validateStatusField(sourcePayload, errors);

  return {
    isValid: errors.length === 0,
    errors,
    data: {
      nome,
      url_site: urlSite,
      url_rss: urlRss,
      status
    }
  };
}

function validateUpdateSourcePayload(payload = {}) {
  const sourcePayload = getPayload(payload);
  const errors = [];

  validateAllowedFields(sourcePayload, errors);

  const nome = validateTextField(
    sourcePayload,
    'nome',
    'Nome',
    MAX_SOURCE_NAME_LENGTH,
    errors
  );
  const urlSite = validateUrlField(sourcePayload, 'url_site', 'URL do site', errors);
  const urlRss = validateUrlField(sourcePayload, 'url_rss', 'URL RSS', errors);
  const status = validateStatusField(sourcePayload, errors);

  return {
    isValid: errors.length === 0,
    errors,
    data: {
      nome,
      url_site: urlSite,
      url_rss: urlRss,
      status
    }
  };
}

function validateUpdateSourceStatusPayload(payload = {}) {
  const sourcePayload = getPayload(payload);
  const errors = [];

  validateAllowedFields(sourcePayload, errors);

  if (
    sourcePayload.nome !== undefined ||
    sourcePayload.url_site !== undefined ||
    sourcePayload.url_rss !== undefined
  ) {
    errors.push(createValidationError('status', 'Envie apenas o status neste endpoint.'));
  }

  const status = validateStatusField(sourcePayload, errors);

  return {
    isValid: errors.length === 0,
    errors,
    data: {
      status
    }
  };
}

module.exports = {
  validateCreateSourcePayload,
  validateSourceIdParam,
  validateUpdateSourcePayload,
  validateUpdateSourceStatusPayload
};
