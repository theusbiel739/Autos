const {
  NewsServiceError,
  getPublishedNewsById,
  listPublishedNews,
  syncNewsFromRss
} = require('../services/newsService');
const {
  validateListNewsQuery,
  validateNewsIdParam
} = require('../validators/newsValidator');

function sendValidationError(res, errors) {
  return res.status(400).json({
    error: 'VALIDATION_ERROR',
    message: 'Dados inválidos.',
    details: errors
  });
}

function sendServiceError(res, error, fallbackMessage) {
  if (error instanceof NewsServiceError) {
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
  const validation = validateListNewsQuery(req.query);

  if (!validation.isValid) {
    return sendValidationError(res, validation.errors);
  }

  try {
    const news = await listPublishedNews(validation.data);

    return res.status(200).json({
      news,
      pagination: {
        page: validation.data.page,
        limit: validation.data.limit
      },
      filters: {
        fonte_id: validation.data.fonte_id
      }
    });
  } catch (error) {
    return sendServiceError(res, error, 'Não foi possível listar as notícias.');
  }
}

async function show(req, res) {
  const validation = validateNewsIdParam(req.params.newsId);

  if (!validation.isValid) {
    return sendValidationError(res, validation.errors);
  }

  try {
    const news = await getPublishedNewsById(validation.data.newsId);

    return res.status(200).json({
      news
    });
  } catch (error) {
    return sendServiceError(res, error, 'Não foi possível buscar a notícia.');
  }
}

async function sync(req, res) {
  try {
    const result = await syncNewsFromRss();

    return res.status(200).json(result);
  } catch (error) {
    return sendServiceError(res, error, 'Não foi possível sincronizar as notícias.');
  }
}

module.exports = {
  list,
  show,
  sync
};
