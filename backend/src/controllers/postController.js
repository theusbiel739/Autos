const {
  PostServiceError,
  createPost,
  getPublishedPostById,
  listPublishedPosts
} = require('../services/postService');
const {
  validateCreatePostPayload,
  validateListPostsQuery,
  validatePostIdParam
} = require('../validators/postValidator');

function sendValidationError(res, errors) {
  return res.status(400).json({
    error: 'VALIDATION_ERROR',
    message: 'Dados inválidos.',
    details: errors
  });
}

function sendServiceError(res, error, fallbackMessage) {
  if (error instanceof PostServiceError) {
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
  const validation = validateCreatePostPayload(req.body);

  if (!validation.isValid) {
    return sendValidationError(res, validation.errors);
  }

  try {
    const post = await createPost(validation.data, req.user.id);

    return res.status(201).json({
      message: 'Post criado com sucesso.',
      post
    });
  } catch (error) {
    return sendServiceError(res, error, 'Não foi possível criar o post.');
  }
}

async function list(req, res) {
  const validation = validateListPostsQuery(req.query);

  if (!validation.isValid) {
    return sendValidationError(res, validation.errors);
  }

  try {
    const posts = await listPublishedPosts(validation.data);

    return res.status(200).json({
      posts,
      pagination: validation.data
    });
  } catch (error) {
    return sendServiceError(res, error, 'Não foi possível listar os posts.');
  }
}

async function show(req, res) {
  const validation = validatePostIdParam(req.params.id);

  if (!validation.isValid) {
    return sendValidationError(res, validation.errors);
  }

  try {
    const post = await getPublishedPostById(validation.data.id);

    return res.status(200).json({
      post
    });
  } catch (error) {
    return sendServiceError(res, error, 'Não foi possível buscar o post.');
  }
}

module.exports = {
  create,
  list,
  show
};
