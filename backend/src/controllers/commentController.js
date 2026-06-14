const {
  CommentServiceError,
  createComment,
  listPublishedCommentsByPost
} = require('../services/commentService');
const {
  validateCreateCommentPayload,
  validateListCommentsQuery,
  validatePostIdParam
} = require('../validators/commentValidator');

function sendValidationError(res, errors) {
  return res.status(400).json({
    error: 'VALIDATION_ERROR',
    message: 'Dados inválidos.',
    details: errors
  });
}

function sendServiceError(res, error, fallbackMessage) {
  if (error instanceof CommentServiceError) {
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

async function create(req, res) {
  const postIdValidation = validatePostIdParam(req.params.postId);
  const payloadValidation = validateCreateCommentPayload(req.body);
  const errors = [
    ...postIdValidation.errors,
    ...payloadValidation.errors
  ];

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  try {
    const comment = await createComment(
      payloadValidation.data,
      postIdValidation.data.postId,
      req.user.id
    );

    return res.status(201).json({
      message: 'Comentário criado com sucesso.',
      comment
    });
  } catch (error) {
    return sendServiceError(res, error, 'Não foi possível criar o comentário.');
  }
}

async function listByPost(req, res) {
  const postIdValidation = validatePostIdParam(req.params.postId);
  const queryValidation = validateListCommentsQuery(req.query);
  const errors = [
    ...postIdValidation.errors,
    ...queryValidation.errors
  ];

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  try {
    const comments = await listPublishedCommentsByPost(
      postIdValidation.data.postId,
      queryValidation.data
    );

    return res.status(200).json({
      comments,
      pagination: queryValidation.data
    });
  } catch (error) {
    return sendServiceError(res, error, 'Não foi possível listar os comentários.');
  }
}

module.exports = {
  create,
  listByPost
};
