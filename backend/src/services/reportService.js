const pool = require('../config/database');

const DUPLICATE_ENTRY_CODE = 'ER_DUP_ENTRY';
const PUBLISHED_STATUS = 'publicado';

class ReportServiceError extends Error {
  constructor(code, message, statusCode = 500) {
    super(message);
    this.name = 'ReportServiceError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

function mapReportTypeRow(row) {
  return {
    id: row.id,
    nome: row.nome,
    descricao: row.descricao
  };
}

function mapPostReportRow(row) {
  return {
    id: row.id,
    target_type: 'post',
    post_id: row.post_id,
    tipo_denuncia_id: row.tipo_denuncia_id,
    descricao: row.descricao,
    status: row.status,
    criado_em: row.criado_em
  };
}

function mapCommentReportRow(row) {
  return {
    id: row.id,
    target_type: 'comment',
    comment_id: row.comentario_id,
    tipo_denuncia_id: row.tipo_denuncia_id,
    descricao: row.descricao,
    status: row.status,
    criado_em: row.criado_em
  };
}

function handleDuplicateReportError(error) {
  if (error && error.code === DUPLICATE_ENTRY_CODE) {
    throw new ReportServiceError(
      'REPORT_ALREADY_EXISTS',
      'Você já denunciou este conteúdo.',
      409
    );
  }

  throw error;
}

async function listReportTypes() {
  const [rows] = await pool.execute(
    `SELECT id, nome, descricao
     FROM tipos_denuncia
     ORDER BY id ASC`
  );

  return rows.map(mapReportTypeRow);
}

async function assertReportTypeExists(tipoDenunciaId) {
  const [rows] = await pool.execute(
    `SELECT id
     FROM tipos_denuncia
     WHERE id = ?
     LIMIT 1`,
    [tipoDenunciaId]
  );

  if (rows.length === 0) {
    throw new ReportServiceError(
      'REPORT_TYPE_NOT_FOUND',
      'Tipo de denúncia não encontrado.',
      404
    );
  }
}

async function getPublishedPostForReport(postId) {
  const [rows] = await pool.execute(
    `SELECT id, usuario_id
     FROM posts
     WHERE id = ?
       AND status = ?
     LIMIT 1`,
    [postId, PUBLISHED_STATUS]
  );

  if (rows.length === 0) {
    throw new ReportServiceError(
      'POST_NOT_FOUND',
      'Post não encontrado.',
      404
    );
  }

  return rows[0];
}

async function getPublishedCommentForReport(commentId) {
  const [rows] = await pool.execute(
    `SELECT c.id, c.usuario_id
     FROM comentarios c
     INNER JOIN posts p ON p.id = c.post_id
     WHERE c.id = ?
       AND c.status = ?
       AND p.status = ?
     LIMIT 1`,
    [commentId, PUBLISHED_STATUS, PUBLISHED_STATUS]
  );

  if (rows.length === 0) {
    throw new ReportServiceError(
      'COMMENT_NOT_FOUND',
      'Comentário não encontrado.',
      404
    );
  }

  return rows[0];
}

async function findPostReportById(reportId) {
  const [rows] = await pool.execute(
    `SELECT id, post_id, tipo_denuncia_id, descricao, status, criado_em
     FROM denuncias_posts
     WHERE id = ?
     LIMIT 1`,
    [reportId]
  );

  return mapPostReportRow(rows[0]);
}

async function findCommentReportById(reportId) {
  const [rows] = await pool.execute(
    `SELECT id, comentario_id, tipo_denuncia_id, descricao, status, criado_em
     FROM denuncias_comentarios
     WHERE id = ?
     LIMIT 1`,
    [reportId]
  );

  return mapCommentReportRow(rows[0]);
}

async function reportPost(postId, data, denuncianteId) {
  await assertReportTypeExists(data.tipo_denuncia_id);

  const post = await getPublishedPostForReport(postId);

  if (post.usuario_id === denuncianteId) {
    throw new ReportServiceError(
      'CANNOT_REPORT_OWN_CONTENT',
      'Você não pode denunciar seu próprio conteúdo.',
      403
    );
  }

  try {
    const [result] = await pool.execute(
      `INSERT INTO denuncias_posts
        (denunciante_id, post_id, tipo_denuncia_id, descricao)
       VALUES (?, ?, ?, ?)`,
      [denuncianteId, postId, data.tipo_denuncia_id, data.descricao]
    );

    return findPostReportById(result.insertId);
  } catch (error) {
    handleDuplicateReportError(error);
  }
}

async function reportComment(commentId, data, denuncianteId) {
  await assertReportTypeExists(data.tipo_denuncia_id);

  const comment = await getPublishedCommentForReport(commentId);

  if (comment.usuario_id === denuncianteId) {
    throw new ReportServiceError(
      'CANNOT_REPORT_OWN_CONTENT',
      'Você não pode denunciar seu próprio conteúdo.',
      403
    );
  }

  try {
    const [result] = await pool.execute(
      `INSERT INTO denuncias_comentarios
        (denunciante_id, comentario_id, tipo_denuncia_id, descricao)
       VALUES (?, ?, ?, ?)`,
      [denuncianteId, commentId, data.tipo_denuncia_id, data.descricao]
    );

    return findCommentReportById(result.insertId);
  } catch (error) {
    handleDuplicateReportError(error);
  }
}

module.exports = {
  ReportServiceError,
  listReportTypes,
  reportComment,
  reportPost
};
