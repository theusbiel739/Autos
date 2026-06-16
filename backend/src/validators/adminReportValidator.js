const ALLOWED_REPORT_STATUSES = new Set([
  'pendente',
  'em_analise',
  'resolvida',
  'rejeitada'
]);

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

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

function validateReportIdParam(reportId) {
  const parsedReportId = parsePositiveInteger(reportId);
  const errors = [];

  if (!parsedReportId) {
    errors.push(createValidationError('reportId', 'ID da denúncia deve ser um inteiro positivo.'));
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: {
      reportId: parsedReportId
    }
  };
}

function validateListReportsQuery(query = {}) {
  const reportQuery = query && typeof query === 'object' ? query : {};
  const errors = [];
  const status = typeof reportQuery.status === 'string' ? reportQuery.status.trim() : null;
  const page = reportQuery.page === undefined
    ? DEFAULT_PAGE
    : parsePositiveInteger(reportQuery.page);
  const limit = reportQuery.limit === undefined
    ? DEFAULT_LIMIT
    : parsePositiveInteger(reportQuery.limit);

  if (status && !ALLOWED_REPORT_STATUSES.has(status)) {
    errors.push(createValidationError('status', 'Status inválido.'));
  }

  if (!page) {
    errors.push(createValidationError('page', 'Página deve ser um inteiro positivo.'));
  }

  if (!limit) {
    errors.push(createValidationError('limit', 'Limite deve ser um inteiro positivo.'));
  } else if (limit > MAX_LIMIT) {
    errors.push(createValidationError('limit', `Limite deve ser no máximo ${MAX_LIMIT}.`));
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: {
      status: status || null,
      page,
      limit
    }
  };
}

function validateUpdateReportStatusPayload(payload = {}) {
  const reportPayload = payload && typeof payload === 'object' ? payload : {};
  const errors = [];
  const status = typeof reportPayload.status === 'string' ? reportPayload.status.trim() : null;
  let observacao = null;

  if (!status) {
    errors.push(createValidationError('status', 'Status é obrigatório.'));
  } else if (!ALLOWED_REPORT_STATUSES.has(status)) {
    errors.push(createValidationError('status', 'Status inválido.'));
  }

  if (reportPayload.observacao !== undefined && reportPayload.observacao !== null) {
    if (typeof reportPayload.observacao !== 'string') {
      errors.push(createValidationError('observacao', 'Observação deve ser um texto.'));
    } else {
      observacao = reportPayload.observacao.trim() || null;

      if (observacao && observacao.length > 300) {
        errors.push(createValidationError('observacao', 'Observação deve ter no máximo 300 caracteres.'));
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: {
      status,
      observacao
    }
  };
}

module.exports = {
  validateListReportsQuery,
  validateReportIdParam,
  validateUpdateReportStatusPayload
};
