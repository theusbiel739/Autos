const pool = require('../config/database');

const DUPLICATE_ENTRY_CODE = 'ER_DUP_ENTRY';

class AdminNewsSourceServiceError extends Error {
  constructor(code, message, statusCode = 500) {
    super(message);
    this.name = 'AdminNewsSourceServiceError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

function mapSourceRow(row) {
  return {
    id: row.id,
    nome: row.nome,
    url_site: row.url_site,
    url_rss: row.url_rss,
    status: row.status,
    criado_em: row.criado_em,
    atualizado_em: row.atualizado_em
  };
}

function mapDuplicateSourceError(error) {
  if (error && error.code === DUPLICATE_ENTRY_CODE) {
    throw new AdminNewsSourceServiceError(
      'NEWS_SOURCE_ALREADY_EXISTS',
      'Já existe uma fonte RSS cadastrada com esta URL RSS.',
      409
    );
  }

  throw error;
}

async function listNewsSources() {
  const [rows] = await pool.execute(
    `SELECT id, nome, url_site, url_rss, status, criado_em, atualizado_em
     FROM fontes_noticias
     ORDER BY criado_em DESC, id DESC`
  );

  return rows.map(mapSourceRow);
}

async function findNewsSourceById(sourceId) {
  const [rows] = await pool.execute(
    `SELECT id, nome, url_site, url_rss, status, criado_em, atualizado_em
     FROM fontes_noticias
     WHERE id = ?
     LIMIT 1`,
    [sourceId]
  );

  return rows.length > 0 ? mapSourceRow(rows[0]) : null;
}

async function getNewsSourceById(sourceId) {
  const source = await findNewsSourceById(sourceId);

  if (!source) {
    throw new AdminNewsSourceServiceError(
      'NEWS_SOURCE_NOT_FOUND',
      'Fonte RSS não encontrada.',
      404
    );
  }

  return source;
}

async function createNewsSource(data) {
  try {
    const [result] = await pool.execute(
      `INSERT INTO fontes_noticias
        (nome, url_site, url_rss, status)
       VALUES (?, ?, ?, ?)`,
      [data.nome, data.url_site, data.url_rss, data.status]
    );

    return getNewsSourceById(result.insertId);
  } catch (error) {
    mapDuplicateSourceError(error);
  }
}

async function updateNewsSource(sourceId, data) {
  await getNewsSourceById(sourceId);

  try {
    await pool.execute(
      `UPDATE fontes_noticias
       SET nome = ?, url_site = ?, url_rss = ?, status = ?
       WHERE id = ?`,
      [data.nome, data.url_site, data.url_rss, data.status, sourceId]
    );
  } catch (error) {
    mapDuplicateSourceError(error);
  }

  return getNewsSourceById(sourceId);
}

async function updateNewsSourceStatus(sourceId, data) {
  await getNewsSourceById(sourceId);

  await pool.execute(
    `UPDATE fontes_noticias
     SET status = ?
     WHERE id = ?`,
    [data.status, sourceId]
  );

  return getNewsSourceById(sourceId);
}

module.exports = {
  AdminNewsSourceServiceError,
  createNewsSource,
  getNewsSourceById,
  listNewsSources,
  updateNewsSource,
  updateNewsSourceStatus
};
