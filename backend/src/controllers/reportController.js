const {
  ReportServiceError,
  listReportTypes,
  reportComment,
  reportPost
} = require('../services/reportService');
const {
  validateCommentIdParam,
  validateCreateReportPayload,
  validatePostIdParam
} = require('../validators/reportValidator');

function sendValidationError(res, errors) {
  return res.status(400).json({
    error: 'VALIDATION_ERROR',
    message: 'Dados inválidos.',
    details: errors
  });
}

function sendServiceError(res, error, fallbackMessage) {
  if (error instanceof ReportServiceError) {
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

async function listTypes(req, res) {
  try {
    const reportTypes = await listReportTypes();

    return res.status(200).json({
      report_types: reportTypes
    });
  } catch (error) {
    return sendServiceError(res, error, 'Não foi possível listar os tipos de denúncia.');
  }
}

async function createPostReport(req, res) {
  const postIdValidation = validatePostIdParam(req.params.postId);
  const payloadValidation = validateCreateReportPayload(req.body);
  const errors = [
    ...postIdValidation.errors,
    ...payloadValidation.errors
  ];

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  try {
    const report = await reportPost(
      postIdValidation.data.postId,
      payloadValidation.data,
      req.user.id
    );

    return res.status(201).json({
      message: 'Denúncia registrada com sucesso.',
      report
    });
  } catch (error) {
    return sendServiceError(res, error, 'Não foi possível registrar a denúncia.');
  }
}

async function createCommentReport(req, res) {
  const commentIdValidation = validateCommentIdParam(req.params.commentId);
  const payloadValidation = validateCreateReportPayload(req.body);
  const errors = [
    ...commentIdValidation.errors,
    ...payloadValidation.errors
  ];

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  try {
    const report = await reportComment(
      commentIdValidation.data.commentId,
      payloadValidation.data,
      req.user.id
    );

    return res.status(201).json({
      message: 'Denúncia registrada com sucesso.',
      report
    });
  } catch (error) {
    return sendServiceError(res, error, 'Não foi possível registrar a denúncia.');
  }
}

module.exports = {
  createCommentReport,
  createPostReport,
  listTypes
};
