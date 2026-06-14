const crypto = require('crypto');

const pool = require('../config/database');
const env = require('../config/env');

const SESSION_COOKIE_NAME = 'autos_session';
const SESSION_DURATION_DAYS = 7;
const SESSION_DURATION_MS = SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000;

function createSessionToken() {
  return crypto.randomBytes(32).toString('base64url');
}

function hashSessionToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function getSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.nodeEnv === 'production',
    maxAge: SESSION_DURATION_MS,
    path: '/'
  };
}

function getClearSessionCookieOptions() {
  const { maxAge, ...options } = getSessionCookieOptions();

  return options;
}

async function createSession(usuarioId) {
  const token = createSessionToken();
  const tokenHash = hashSessionToken(token);

  await pool.execute(
    `INSERT INTO sessoes (usuario_id, token_hash, expira_em)
     VALUES (?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL ? DAY))`,
    [usuarioId, tokenHash, SESSION_DURATION_DAYS]
  );

  return { token };
}

async function findValidSessionByToken(token) {
  if (!token) {
    return null;
  }

  const tokenHash = hashSessionToken(token);

  const [rows] = await pool.execute(
    `SELECT
        s.id AS session_id,
        s.usuario_id,
        s.expira_em,
        s.revogada_em,
        u.id AS user_id,
        u.nome_exibicao,
        u.email,
        u.status
     FROM sessoes s
     INNER JOIN usuarios u ON u.id = s.usuario_id
     WHERE s.token_hash = ?
       AND s.revogada_em IS NULL
       AND s.expira_em > UTC_TIMESTAMP()
       AND u.status = 'ativo'
     LIMIT 1`,
    [tokenHash]
  );

  if (rows.length === 0) {
    return null;
  }

  const row = rows[0];

  return {
    session: {
      id: row.session_id,
      usuario_id: row.usuario_id,
      expira_em: row.expira_em,
      revogada_em: row.revogada_em
    },
    user: {
      id: row.user_id,
      nome_exibicao: row.nome_exibicao,
      email: row.email,
      status: row.status
    }
  };
}

async function revokeSessionByToken(token) {
  if (!token) {
    return;
  }

  const tokenHash = hashSessionToken(token);

  await pool.execute(
    `UPDATE sessoes
     SET revogada_em = UTC_TIMESTAMP()
     WHERE token_hash = ?
       AND revogada_em IS NULL`,
    [tokenHash]
  );
}

module.exports = {
  SESSION_COOKIE_NAME,
  createSession,
  findValidSessionByToken,
  getClearSessionCookieOptions,
  getSessionCookieOptions,
  revokeSessionByToken
};
