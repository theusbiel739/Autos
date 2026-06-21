const pool = require('../config/database');
const { parseFeed } = require('./rssService');
const {
  MAX_NEWS_PER_SYNC,
  MIN_DESIRED_NEWS_PER_SYNC,
  scoreNewsCandidate
} = require('../utils/newsPolicy');

const ACTIVE_SOURCE_STATUS = 'ativa';
const DUPLICATE_ENTRY_CODE = 'ER_DUP_ENTRY';
const PUBLISHED_NEWS_STATUS = 'publicada';

class NewsServiceError extends Error {
  constructor(code, message, statusCode = 500) {
    super(message);
    this.name = 'NewsServiceError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

function getOffset(pagination) {
  return (pagination.page - 1) * pagination.limit;
}

function truncateText(value, maxLength) {
  if (!value || typeof value !== 'string') {
    return null;
  }

  const normalized = value.replace(/\s+/g, ' ').trim();

  if (!normalized) {
    return null;
  }

  return normalized.length > maxLength ? normalized.slice(0, maxLength) : normalized;
}

function normalizeHttpUrl(value, maxLength) {
  if (!value || typeof value !== 'string') {
    return null;
  }

  try {
    const url = new URL(value.trim());

    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return null;
    }

    return url.href.length <= maxLength ? url.href : null;
  } catch (error) {
    return null;
  }
}

function stripHtml(value) {
  if (!value || typeof value !== 'string') {
    return null;
  }

  return value.replace(/<[^>]*>/g, ' ');
}

function parseRssDate(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function formatDateForMysql(value) {
  const date = value instanceof Date ? value : parseRssDate(value);

  if (!date) {
    return null;
  }

  return date.toISOString().slice(0, 19).replace('T', ' ');
}

function mapNewsRow(row) {
  return {
    id: row.id,
    fonte_id: row.fonte_id,
    fonte_nome: row.fonte_nome,
    titulo: row.titulo,
    resumo: row.resumo,
    url_original: row.url_original,
    publicada_em: row.publicada_em,
    criado_em: row.criado_em
  };
}

function mapSourceRow(row) {
  return {
    id: row.id,
    nome: row.nome,
    url_rss: row.url_rss
  };
}

function mapRssItemToNews(source, item) {
  const title = truncateText(item.title, 180);
  const url = normalizeHttpUrl(item.link, 500);
  const summarySource = item.contentSnippet || item.summary || item.content || item['content:encoded'];
  const publishedDate = parseRssDate(item.isoDate || item.pubDate);

  if (!title || !url) {
    return null;
  }

  return {
    fonte_id: source.id,
    titulo: title,
    resumo: truncateText(stripHtml(summarySource), 300),
    url_original: url,
    publicada_em: formatDateForMysql(publishedDate),
    status: PUBLISHED_NEWS_STATUS
  };
}

function sortCandidatesByPolicy(a, b) {
  if (a.window_priority !== b.window_priority) {
    return a.window_priority - b.window_priority;
  }

  if (b.relevance_score !== a.relevance_score) {
    return b.relevance_score - a.relevance_score;
  }

  return b.published_at.getTime() - a.published_at.getTime();
}

async function listPublishedNews(filters) {
  const params = [PUBLISHED_NEWS_STATUS];
  let sourceFilter = '';

  if (filters.fonte_id) {
    sourceFilter = ' AND n.fonte_id = ?';
    params.push(filters.fonte_id);
  }

  params.push(filters.limit, getOffset(filters));

  const [rows] = await pool.query(
    `SELECT
        n.id,
        n.fonte_id,
        fn.nome AS fonte_nome,
        n.titulo,
        n.resumo,
        n.url_original,
        n.publicada_em,
        n.criado_em
     FROM noticias n
     INNER JOIN fontes_noticias fn ON fn.id = n.fonte_id
     WHERE n.status = ?
       ${sourceFilter}
     ORDER BY n.publicada_em DESC, n.id DESC
     LIMIT ? OFFSET ?`,
    params
  );

  return rows.map(mapNewsRow);
}

async function getPublishedNewsById(newsId) {
  const [rows] = await pool.execute(
    `SELECT
        n.id,
        n.fonte_id,
        fn.nome AS fonte_nome,
        n.titulo,
        n.resumo,
        n.url_original,
        n.publicada_em,
        n.criado_em
     FROM noticias n
     INNER JOIN fontes_noticias fn ON fn.id = n.fonte_id
     WHERE n.id = ?
       AND n.status = ?
     LIMIT 1`,
    [newsId, PUBLISHED_NEWS_STATUS]
  );

  if (rows.length === 0) {
    throw new NewsServiceError(
      'NEWS_NOT_FOUND',
      'Notícia não encontrada.',
      404
    );
  }

  return mapNewsRow(rows[0]);
}

async function listActiveSources() {
  const [rows] = await pool.execute(
    `SELECT id, nome, url_rss
     FROM fontes_noticias
     WHERE status = ?
     ORDER BY id ASC`,
    [ACTIVE_SOURCE_STATUS]
  );

  return rows.map(mapSourceRow);
}

async function insertNewsIfNew(news) {
  const [existingRows] = await pool.execute(
    `SELECT id
     FROM noticias
     WHERE url_original = ?
     LIMIT 1`,
    [news.url_original]
  );

  if (existingRows.length > 0) {
    return 'duplicate';
  }

  try {
    await pool.execute(
      `INSERT INTO noticias
        (fonte_id, titulo, resumo, url_original, publicada_em, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        news.fonte_id,
        news.titulo,
        news.resumo,
        news.url_original,
        news.publicada_em,
        news.status
      ]
    );

    return 'created';
  } catch (error) {
    if (error && error.code === DUPLICATE_ENTRY_CODE) {
      return 'duplicate';
    }

    throw error;
  }
}

async function insertCandidate(candidate, result) {
  const { relevance_score, published_at, window_priority, ...news } = candidate;
  const insertResult = await insertNewsIfNew(news);

  if (insertResult === 'created') {
    result.created_count += 1;
  } else if (insertResult === 'duplicate') {
    result.duplicate_count += 1;
  }
}

async function syncNewsFromRss() {
  const sources = await listActiveSources();
  const candidates = [];
  const now = new Date();
  const result = {
    sources_processed: sources.length,
    created_count: 0,
    duplicate_count: 0,
    errors: []
  };

  for (const source of sources) {
    try {
      const feed = await parseFeed(source.url_rss);
      const items = Array.isArray(feed.items) ? feed.items : [];

      for (const item of items) {
        const news = mapRssItemToNews(source, item);

        if (!news) {
          continue;
        }

        const policyResult = scoreNewsCandidate(news, source, now);

        if (policyResult.accepted) {
          candidates.push({
            ...news,
            relevance_score: policyResult.score,
            published_at: policyResult.publishedDate,
            window_priority: policyResult.windowPriority
          });
        }
      }
    } catch (error) {
      result.errors.push({
        fonte_id: source.id,
        fonte_nome: source.nome,
        message: 'Não foi possível sincronizar esta fonte.'
      });
    }
  }

  candidates.sort(sortCandidatesByPolicy);

  const recentCandidates = candidates.filter((candidate) => candidate.window_priority < 2);
  const archiveCandidates = candidates.filter((candidate) => candidate.window_priority === 2);

  for (const candidate of recentCandidates) {
    if (result.created_count >= MAX_NEWS_PER_SYNC) {
      break;
    }

    await insertCandidate(candidate, result);
  }

  for (const candidate of archiveCandidates) {
    if (
      result.created_count >= MAX_NEWS_PER_SYNC ||
      result.created_count >= MIN_DESIRED_NEWS_PER_SYNC
    ) {
      break;
    }

    await insertCandidate(candidate, result);
  }

  return result;
}

module.exports = {
  NewsServiceError,
  getPublishedNewsById,
  listPublishedNews,
  syncNewsFromRss
};
