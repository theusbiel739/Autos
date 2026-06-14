const pool = require('../config/database');

const PUBLISHED_STATUS = 'publicado';

class CommentServiceError extends Error {
  constructor(code, message, statusCode = 500) {
    super(message);
    this.name = 'CommentServiceError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

function mapCommentRow(row) {
  return {
    id: row.id,
    conteudo: row.conteudo,
    status: row.status,
    criado_em: row.criado_em,
    atualizado_em: row.atualizado_em,
    autor: {
      id: row.autor_id,
      nome_exibicao: row.autor_nome_exibicao
    }
  };
}

async function assertPublishedPostExists(postId) {
  const [rows] = await pool.execute(
    `SELECT id
     FROM posts
     WHERE id = ?
       AND status = ?
     LIMIT 1`,
    [postId, PUBLISHED_STATUS]
  );

  if (rows.length === 0) {
    throw new CommentServiceError(
      'POST_NOT_FOUND',
      'Post não encontrado.',
      404
    );
  }
}

async function findPublishedCommentById(commentId) {
  const [rows] = await pool.execute(
    `SELECT
        c.id,
        c.conteudo,
        c.status,
        c.criado_em,
        c.atualizado_em,
        u.id AS autor_id,
        u.nome_exibicao AS autor_nome_exibicao
     FROM comentarios c
     INNER JOIN usuarios u ON u.id = c.usuario_id
     WHERE c.id = ?
       AND c.status = ?
     LIMIT 1`,
    [commentId, PUBLISHED_STATUS]
  );

  if (rows.length === 0) {
    return null;
  }

  return mapCommentRow(rows[0]);
}

async function createComment(data, postId, usuarioId) {
  await assertPublishedPostExists(postId);

  const [result] = await pool.execute(
    `INSERT INTO comentarios
      (post_id, usuario_id, conteudo, status)
     VALUES (?, ?, ?, ?)`,
    [postId, usuarioId, data.conteudo, PUBLISHED_STATUS]
  );

  return findPublishedCommentById(result.insertId);
}

async function listPublishedCommentsByPost(postId, pagination) {
  await assertPublishedPostExists(postId);

  const offset = (pagination.page - 1) * pagination.limit;

  const [rows] = await pool.query(
    `SELECT
        c.id,
        c.conteudo,
        c.status,
        c.criado_em,
        c.atualizado_em,
        u.id AS autor_id,
        u.nome_exibicao AS autor_nome_exibicao
     FROM comentarios c
     INNER JOIN usuarios u ON u.id = c.usuario_id
     WHERE c.post_id = ?
       AND c.status = ?
     ORDER BY c.criado_em ASC, c.id ASC
     LIMIT ? OFFSET ?`,
    [postId, PUBLISHED_STATUS, pagination.limit, offset]
  );

  return rows.map(mapCommentRow);
}

module.exports = {
  CommentServiceError,
  createComment,
  listPublishedCommentsByPost
};
