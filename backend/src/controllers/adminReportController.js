const {
  AdminReportServiceError,
  getCommentReportById,
  getPostReportById,
  listCommentReports,
  listPostReports,
  updateCommentReportStatus,
  updatePostReportStatus
} = require('../services/adminReportService');
const {
  validateListReportsQuery,
  validateReportIdParam,
  validateUpdateReportStatusPayload
} = require('../validators/adminReportValidator');

function sendValidationError(res, errors) {
  return res.status(400).json({
    error: 'VALIDATION_ERROR',
    message: 'Dados inválidos.',
    details: errors
  });
}

function sendServiceError(res, error, fallbackMessage) {
  if (error instanceof AdminReportServiceError) {
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

async function listPostReportsHandler(req, res) {
  const validation = validateListReportsQuery(req.query);

  if (!validation.isValid) {
    return sendValidationError(res, validation.errors);
  }

  try {
    const reports = await listPostReports(validation.data);

    return res.status(200).json({
      reports,
      pagination: {
        page: validation.data.page,
        limit: validation.data.limit
      },
      filters: {
        status: validation.data.status
      }
    });
  } catch (error) {
    return sendServiceError(res, error, 'Não foi possível listar as denúncias de posts.');
  }
}

async function listCommentReportsHandler(req, res) {
  const validation = validateListReportsQuery(req.query);

  if (!validation.isValid) {
    return sendValidationError(res, validation.errors);
  }

  try {
    const reports = await listCommentReports(validation.data);

    return res.status(200).json({
      reports,
      pagination: {
        page: validation.data.page,
        limit: validation.data.limit
      },
      filters: {
        status: validation.data.status
      }
    });
  } catch (error) {
    return sendServiceError(res, error, 'Não foi possível listar as denúncias de comentários.');
  }
}

async function showPostReport(req, res) {
  const validation = validateReportIdParam(req.params.reportId);

  if (!validation.isValid) {
    return sendValidationError(res, validation.errors);
  }

  try {
    const report = await getPostReportById(validation.data.reportId);

    return res.status(200).json({
      report
    });
  } catch (error) {
    return sendServiceError(res, error, 'Não foi possível buscar a denúncia de post.');
  }
}

async function showCommentReport(req, res) {
  const validation = validateReportIdParam(req.params.reportId);

  if (!validation.isValid) {
    return sendValidationError(res, validation.errors);
  }

  try {
    const report = await getCommentReportById(validation.data.reportId);

    return res.status(200).json({
      report
    });
  } catch (error) {
    return sendServiceError(res, error, 'Não foi possível buscar a denúncia de comentário.');
  }
}

async function updatePostReportStatusHandler(req, res) {
  const reportIdValidation = validateReportIdParam(req.params.reportId);
  const payloadValidation = validateUpdateReportStatusPayload(req.body);
  const errors = [
    ...reportIdValidation.errors,
    ...payloadValidation.errors
  ];

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  try {
    const report = await updatePostReportStatus(
      reportIdValidation.data.reportId,
      payloadValidation.data,
      req.user.id
    );

    return res.status(200).json({
      message: 'Status da denúncia atualizado com sucesso.',
      report
    });
  } catch (error) {
    return sendServiceError(res, error, 'Não foi possível atualizar a denúncia de post.');
  }
}

async function updateCommentReportStatusHandler(req, res) {
  const reportIdValidation = validateReportIdParam(req.params.reportId);
  const payloadValidation = validateUpdateReportStatusPayload(req.body);
  const errors = [
    ...reportIdValidation.errors,
    ...payloadValidation.errors
  ];

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  try {
    const report = await updateCommentReportStatus(
      reportIdValidation.data.reportId,
      payloadValidation.data,
      req.user.id
    );

    return res.status(200).json({
      message: 'Status da denúncia atualizado com sucesso.',
      report
    });
  } catch (error) {
    return sendServiceError(res, error, 'Não foi possível atualizar a denúncia de comentário.');
  }
}

module.exports = {
  listCommentReportsHandler,
  listPostReportsHandler,
  showCommentReport,
  showPostReport,
  updateCommentReportStatusHandler,
  updatePostReportStatusHandler
};
