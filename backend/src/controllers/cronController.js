const { syncNewsFromRss } = require('../services/newsService');

async function syncNews(req, res) {
  try {
    const result = await syncNewsFromRss();

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Não foi possível sincronizar as notícias.'
    });
  }
}

module.exports = {
  syncNews
};
