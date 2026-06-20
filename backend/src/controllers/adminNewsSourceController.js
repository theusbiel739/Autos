const {
  AdminNewsSourceServiceError,
  createNewsSource,
  getNewsSourceById,
  listNewsSources,
  updateNewsSource,
  updateNewsSourceStatus
} = require('../services/adminNewsSourceService');
const {
  validateCreateSourcePayload,
  validateSourceIdParam,
  validateUpdateSourcePayload,
  validateUpdateSourceStatusPayload
} = require('../validators/adminNewsSourceValidator');

function sendValidationError(res, errors) {
  return res.status(400).json({
    error: 'VALIDATION_ERROR',
    message: 'Dados inválidos.',
    details: errors
  });
}

function sendServiceError(res, error, fallbackMessage) {
  if (error instanceof AdminNewsSourceServiceError) {
    return res.status(error.statusCode).json({
      error: error.code,
      message: error.message
    });
  }

  return res.status(500).json({
    error: 'INTERNAL_ERROR',
    message: fallbackMessage
  });
}

async function list(req, res) {
  try {
    const sources = await listNewsSources();

    return res.status(200).json({
      sources
    });
  } catch (error) {
    return sendServiceError(res, error, 'Não foi possível listar as fontes RSS.');
  }
}

async function show(req, res) {
  const validation = validateSourceIdParam(req.params.sourceId);

  if (!validation.isValid) {
    return sendValidationError(res, validation.errors);
  }

  try {
    const source = await getNewsSourceById(validation.data.sourceId);

    return res.status(200).json({
      source
    });
  } catch (error) {
    return sendServiceError(res, error, 'Não foi possível buscar a fonte RSS.');
  }
}

async function create(req, res) {
  const validation = validateCreateSourcePayload(req.body);

  if (!validation.isValid) {
    return sendValidationError(res, validation.errors);
  }

  try {
    const source = await createNewsSource(validation.data);

    return res.status(201).json({
      message: 'Fonte RSS cadastrada com sucesso.',
      source
    });
  } catch (error) {
    return sendServiceError(res, error, 'Não foi possível cadastrar a fonte RSS.');
  }
}

async function update(req, res) {
  const sourceIdValidation = validateSourceIdParam(req.params.sourceId);
  const payloadValidation = validateUpdateSourcePayload(req.body);
  const errors = [
    ...sourceIdValidation.errors,
    ...payloadValidation.errors
  ];

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  try {
    const source = await updateNewsSource(
      sourceIdValidation.data.sourceId,
      payloadValidation.data
    );

    return res.status(200).json({
      message: 'Fonte RSS atualizada com sucesso.',
      source
    });
  } catch (error) {
    return sendServiceError(res, error, 'Não foi possível atualizar a fonte RSS.');
  }
}

async function updateStatus(req, res) {
  const sourceIdValidation = validateSourceIdParam(req.params.sourceId);
  const payloadValidation = validateUpdateSourceStatusPayload(req.body);
  const errors = [
    ...sourceIdValidation.errors,
    ...payloadValidation.errors
  ];

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  try {
    const source = await updateNewsSourceStatus(
      sourceIdValidation.data.sourceId,
      payloadValidation.data
    );

    return res.status(200).json({
      message: 'Status da fonte RSS atualizado com sucesso.',
      source
    });
  } catch (error) {
    return sendServiceError(res, error, 'Não foi possível atualizar o status da fonte RSS.');
  }
}

module.exports = {
  create,
  list,
  show,
  update,
  updateStatus
};
