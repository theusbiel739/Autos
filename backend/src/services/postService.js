const pool = require('../config/database');
const { containsBlockedTerm } = require('../utils/profanityFilter');

const PUBLISHED_STATUS = 'publicado';

class PostServiceError extends Error {
  constructor(code, message, statusCode = 500) {
    super(message);
    this.name = 'PostServiceError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

function mapPostRow(row) {
  return {
    id: row.id,
    conteudo: row.conteudo,
    status: row.status,
    criado_em: row.criado_em,
    atualizado_em: row.atualizado_em,
    autor: {
      id: row.autor_id,
      nome_exibicao: row.autor_nome_exibicao
    },
    categoria: {
      id: row.categoria_id,
      nome: row.categoria_nome
    },
    marcador: row.marcador_id
      ? {
          id: row.marcador_id,
          nome: row.marcador_nome
        }
      : null,
    curtidas: {
      total: Number(row.curtidas_total)
    }
  };
}

async function assertActiveCategoryExists(categoriaId) {
  const [rows] = await pool.execute(
    `SELECT id
     FROM categorias_posts
     WHERE id = ?
       AND status = 'ativa'
     LIMIT 1`,
    [categoriaId]
  );

  if (rows.length === 0) {
    throw new PostServiceError(
      'CATEGORY_NOT_FOUND',
      'Categoria não encontrada.',
      404
    );
  }
}

async function assertActiveMarkerExists(marcadorId) {
  if (!marcadorId) {
    return;
  }

  const [rows] = await pool.execute(
    `SELECT id
     FROM marcadores_posts
     WHERE id = ?
       AND status = 'ativo'
     LIMIT 1`,
    [marcadorId]
  );

  if (rows.length === 0) {
    throw new PostServiceError(
      'MARKER_NOT_FOUND',
      'Marcador não encontrado.',
      404
    );
  }
}

async function findPublishedPostById(postId) {
  const [rows] = await pool.execute(
    `SELECT
        p.id,
        p.conteudo,
        p.status,
        p.criado_em,
        p.atualizado_em,
        u.id AS autor_id,
        u.nome_exibicao AS autor_nome_exibicao,
        c.id AS categoria_id,
        c.nome AS categoria_nome,
        m.id AS marcador_id,
        m.nome AS marcador_nome,
        (
          SELECT COUNT(*)
          FROM curtidas curt
          WHERE curt.post_id = p.id
        ) AS curtidas_total
     FROM posts p
     INNER JOIN usuarios u ON u.id = p.usuario_id
     INNER JOIN categorias_posts c ON c.id = p.categoria_id
     LEFT JOIN marcadores_posts m ON m.id = p.marcador_id
     WHERE p.id = ?
       AND p.status = ?
     LIMIT 1`,
    [postId, PUBLISHED_STATUS]
  );

  if (rows.length === 0) {
    return null;
  }

  return mapPostRow(rows[0]);
}

async function createPost(data, usuarioId) {
  if (containsBlockedTerm(data.conteudo)) {
    throw new PostServiceError(
      'CONTENT_BLOCKED',
      'O conteúdo contém termos não permitidos.',
      400
    );
  }

  await assertActiveCategoryExists(data.categoria_id);
  await assertActiveMarkerExists(data.marcador_id);

  const [result] = await pool.execute(
    `INSERT INTO posts
      (usuario_id, categoria_id, marcador_id, conteudo, status)
     VALUES (?, ?, ?, ?, ?)`,
    [
      usuarioId,
      data.categoria_id,
      data.marcador_id,
      data.conteudo,
      PUBLISHED_STATUS
    ]
  );

  return findPublishedPostById(result.insertId);
}

async function listPublishedPosts(pagination) {
  const offset = (pagination.page - 1) * pagination.limit;

  const [rows] = await pool.query(
    `SELECT
        p.id,
        p.conteudo,
        p.status,
        p.criado_em,
        p.atualizado_em,
        u.id AS autor_id,
        u.nome_exibicao AS autor_nome_exibicao,
        c.id AS categoria_id,
        c.nome AS categoria_nome,
        m.id AS marcador_id,
        m.nome AS marcador_nome,
        (
          SELECT COUNT(*)
          FROM curtidas curt
          WHERE curt.post_id = p.id
        ) AS curtidas_total
     FROM posts p
     INNER JOIN usuarios u ON u.id = p.usuario_id
     INNER JOIN categorias_posts c ON c.id = p.categoria_id
     LEFT JOIN marcadores_posts m ON m.id = p.marcador_id
     WHERE p.status = ?
     ORDER BY p.criado_em DESC, p.id DESC
     LIMIT ? OFFSET ?`,
    [PUBLISHED_STATUS, pagination.limit, offset]
  );

  return rows.map(mapPostRow);
}

async function getPublishedPostById(postId) {
  const post = await findPublishedPostById(postId);

  if (!post) {
    throw new PostServiceError(
      'POST_NOT_FOUND',
      'Post não encontrado.',
      404
    );
  }

  return post;
}

module.exports = {
  PostServiceError,
  createPost,
  getPublishedPostById,
  listPublishedPosts
};
