const pool = require('../config/database');

class AdminReportServiceError extends Error {
  constructor(code, message, statusCode = 500) {
    super(message);
    this.name = 'AdminReportServiceError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

function mapPostReportRow(row) {
  return {
    id: row.id,
    target_type: 'post',
    descricao: row.descricao,
    status: row.status,
    criado_em: row.criado_em,
    atualizado_em: row.atualizado_em,
    tipo_denuncia: {
      id: row.tipo_denuncia_id,
      nome: row.tipo_denuncia_nome,
      descricao: row.tipo_denuncia_descricao
    },
    denunciante: {
      id: row.denunciante_id,
      nome_exibicao: row.denunciante_nome_exibicao
    },
    post: {
      id: row.post_id,
      conteudo: row.post_conteudo,
      status: row.post_status,
      autor: {
        id: row.autor_id,
        nome_exibicao: row.autor_nome_exibicao
      }
    }
  };
}

function mapCommentReportRow(row) {
  return {
    id: row.id,
    target_type: 'comment',
    descricao: row.descricao,
    status: row.status,
    criado_em: row.criado_em,
    atualizado_em: row.atualizado_em,
    tipo_denuncia: {
      id: row.tipo_denuncia_id,
      nome: row.tipo_denuncia_nome,
      descricao: row.tipo_denuncia_descricao
    },
    denunciante: {
      id: row.denunciante_id,
      nome_exibicao: row.denunciante_nome_exibicao
    },
    comment: {
      id: row.comentario_id,
      conteudo: row.comentario_conteudo,
      status: row.comentario_status,
      autor: {
        id: row.autor_id,
        nome_exibicao: row.autor_nome_exibicao
      },
      post: {
        id: row.post_id,
        conteudo: row.post_conteudo,
        status: row.post_status
      }
    }
  };
}

function getOffset(pagination) {
  return (pagination.page - 1) * pagination.limit;
}

function getPostReportSelect() {
  return `SELECT
      dp.id,
      dp.descricao,
      dp.status,
      dp.criado_em,
      dp.atualizado_em,
      td.id AS tipo_denuncia_id,
      td.nome AS tipo_denuncia_nome,
      td.descricao AS tipo_denuncia_descricao,
      denunciante.id AS denunciante_id,
      denunciante.nome_exibicao AS denunciante_nome_exibicao,
      p.id AS post_id,
      p.conteudo AS post_conteudo,
      p.status AS post_status,
      autor.id AS autor_id,
      autor.nome_exibicao AS autor_nome_exibicao
   FROM denuncias_posts dp
   INNER JOIN tipos_denuncia td ON td.id = dp.tipo_denuncia_id
   INNER JOIN usuarios denunciante ON denunciante.id = dp.denunciante_id
   INNER JOIN posts p ON p.id = dp.post_id
   INNER JOIN usuarios autor ON autor.id = p.usuario_id`;
}

function getCommentReportSelect() {
  return `SELECT
      dc.id,
      dc.descricao,
      dc.status,
      dc.criado_em,
      dc.atualizado_em,
      td.id AS tipo_denuncia_id,
      td.nome AS tipo_denuncia_nome,
      td.descricao AS tipo_denuncia_descricao,
      denunciante.id AS denunciante_id,
      denunciante.nome_exibicao AS denunciante_nome_exibicao,
      c.id AS comentario_id,
      c.conteudo AS comentario_conteudo,
      c.status AS comentario_status,
      autor.id AS autor_id,
      autor.nome_exibicao AS autor_nome_exibicao,
      p.id AS post_id,
      p.conteudo AS post_conteudo,
      p.status AS post_status
   FROM denuncias_comentarios dc
   INNER JOIN tipos_denuncia td ON td.id = dc.tipo_denuncia_id
   INNER JOIN usuarios denunciante ON denunciante.id = dc.denunciante_id
   INNER JOIN comentarios c ON c.id = dc.comentario_id
   INNER JOIN usuarios autor ON autor.id = c.usuario_id
   INNER JOIN posts p ON p.id = c.post_id`;
}

async function listPostReports(filters) {
  const params = [];
  let whereClause = '';

  if (filters.status) {
    whereClause = ' WHERE dp.status = ?';
    params.push(filters.status);
  }

  params.push(filters.limit, getOffset(filters));

  const [rows] = await pool.query(
    `${getPostReportSelect()}
     ${whereClause}
     ORDER BY dp.criado_em DESC, dp.id DESC
     LIMIT ? OFFSET ?`,
    params
  );

  return rows.map(mapPostReportRow);
}

async function listCommentReports(filters) {
  const params = [];
  let whereClause = '';

  if (filters.status) {
    whereClause = ' WHERE dc.status = ?';
    params.push(filters.status);
  }

  params.push(filters.limit, getOffset(filters));

  const [rows] = await pool.query(
    `${getCommentReportSelect()}
     ${whereClause}
     ORDER BY dc.criado_em DESC, dc.id DESC
     LIMIT ? OFFSET ?`,
    params
  );

  return rows.map(mapCommentReportRow);
}

async function findPostReportById(reportId) {
  const [rows] = await pool.execute(
    `${getPostReportSelect()}
     WHERE dp.id = ?
     LIMIT 1`,
    [reportId]
  );

  return rows.length > 0 ? mapPostReportRow(rows[0]) : null;
}

async function findCommentReportById(reportId) {
  const [rows] = await pool.execute(
    `${getCommentReportSelect()}
     WHERE dc.id = ?
     LIMIT 1`,
    [reportId]
  );

  return rows.length > 0 ? mapCommentReportRow(rows[0]) : null;
}

async function getPostReportById(reportId) {
  const report = await findPostReportById(reportId);

  if (!report) {
    throw new AdminReportServiceError(
      'POST_REPORT_NOT_FOUND',
      'Denúncia de post não encontrada.',
      404
    );
  }

  return report;
}

async function getCommentReportById(reportId) {
  const report = await findCommentReportById(reportId);

  if (!report) {
    throw new AdminReportServiceError(
      'COMMENT_REPORT_NOT_FOUND',
      'Denúncia de comentário não encontrada.',
      404
    );
  }

  return report;
}

async function assertPostReportExistsForUpdate(connection, reportId) {
  const [rows] = await connection.execute(
    `SELECT id
     FROM denuncias_posts
     WHERE id = ?
     LIMIT 1
     FOR UPDATE`,
    [reportId]
  );

  if (rows.length === 0) {
    throw new AdminReportServiceError(
      'POST_REPORT_NOT_FOUND',
      'Denúncia de post não encontrada.',
      404
    );
  }
}

async function assertCommentReportExistsForUpdate(connection, reportId) {
  const [rows] = await connection.execute(
    `SELECT id
     FROM denuncias_comentarios
     WHERE id = ?
     LIMIT 1
     FOR UPDATE`,
    [reportId]
  );

  if (rows.length === 0) {
    throw new AdminReportServiceError(
      'COMMENT_REPORT_NOT_FOUND',
      'Denúncia de comentário não encontrada.',
      404
    );
  }
}

async function updatePostReportStatus(reportId, data, moderatorId) {
  const connection = await pool.getConnection();
  let committed = false;

  try {
    await connection.beginTransaction();
    await assertPostReportExistsForUpdate(connection, reportId);

    await connection.execute(
      `UPDATE denuncias_posts
       SET status = ?
       WHERE id = ?`,
      [data.status, reportId]
    );

    await connection.execute(
      `INSERT INTO logs_moderacao
        (moderador_id, acao, entidade_tipo, entidade_id, observacao)
       VALUES (?, ?, ?, ?, ?)`,
      [
        moderatorId,
        'atualizar_status_denuncia_post',
        'denuncia_post',
        reportId,
        data.observacao
      ]
    );

    await connection.commit();
    committed = true;

    return getPostReportById(reportId);
  } catch (error) {
    if (!committed) {
      await connection.rollback();
    }

    throw error;
  } finally {
    connection.release();
  }
}

async function updateCommentReportStatus(reportId, data, moderatorId) {
  const connection = await pool.getConnection();
  let committed = false;

  try {
    await connection.beginTransaction();
    await assertCommentReportExistsForUpdate(connection, reportId);

    await connection.execute(
      `UPDATE denuncias_comentarios
       SET status = ?
       WHERE id = ?`,
      [data.status, reportId]
    );

    await connection.execute(
      `INSERT INTO logs_moderacao
        (moderador_id, acao, entidade_tipo, entidade_id, observacao)
       VALUES (?, ?, ?, ?, ?)`,
      [
        moderatorId,
        'atualizar_status_denuncia_comentario',
        'denuncia_comentario',
        reportId,
        data.observacao
      ]
    );

    await connection.commit();
    committed = true;

    return getCommentReportById(reportId);
  } catch (error) {
    if (!committed) {
      await connection.rollback();
    }

    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  AdminReportServiceError,
  getCommentReportById,
  getPostReportById,
  listCommentReports,
  listPostReports,
  updateCommentReportStatus,
  updatePostReportStatus
};
