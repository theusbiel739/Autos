const {
  LikeServiceError,
  getPostLikes,
  likePost,
  unlikePost
} = require('../services/likeService');
const {
  validatePostIdParam
} = require('../validators/likeValidator');

function sendValidationError(res, errors) {
  return res.status(400).json({
    error: 'VALIDATION_ERROR',
    message: 'Dados inválidos.',
    details: errors
  });
}

function sendServiceError(res, error, fallbackMessage) {
  if (error instanceof LikeServiceError) {
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

async function show(req, res) {
  const validation = validatePostIdParam(req.params.postId);

  if (!validation.isValid) {
    return sendValidationError(res, validation.errors);
  }

  try {
    const like = await getPostLikes(validation.data.postId);

    return res.status(200).json({
      like
    });
  } catch (error) {
    return sendServiceError(res, error, 'Não foi possível consultar as curtidas.');
  }
}

async function create(req, res) {
  const validation = validatePostIdParam(req.params.postId);

  if (!validation.isValid) {
    return sendValidationError(res, validation.errors);
  }

  try {
    const like = await likePost(validation.data.postId, req.user.id);

    return res.status(200).json({
      message: 'Post curtido com sucesso.',
      like
    });
  } catch (error) {
    return sendServiceError(res, error, 'Não foi possível curtir o post.');
  }
}

async function remove(req, res) {
  const validation = validatePostIdParam(req.params.postId);

  if (!validation.isValid) {
    return sendValidationError(res, validation.errors);
  }

  try {
    const like = await unlikePost(validation.data.postId, req.user.id);

    return res.status(200).json({
      message: 'Curtida removida com sucesso.',
      like
    });
  } catch (error) {
    return sendServiceError(res, error, 'Não foi possível remover a curtida.');
  }
}

module.exports = {
  create,
  remove,
  show
};
