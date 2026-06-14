const argon2 = require('argon2');

const pool = require('../config/database');
const { createSession } = require('./sessionService');

const USER_ROLE_NAME = 'Usuário';
const ACTIVE_STATUS = 'ativo';

class AuthServiceError extends Error {
  constructor(code, message, statusCode = 500) {
    super(message);
    this.name = 'AuthServiceError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

async function findUserRoleId(connection) {
  const [rows] = await connection.execute(
    'SELECT id FROM tipos_usuario WHERE nome = ? LIMIT 1',
    [USER_ROLE_NAME]
  );

  if (rows.length === 0) {
    throw new AuthServiceError(
      'USER_TYPE_NOT_FOUND',
      'Não foi possível concluir o cadastro.',
      500
    );
  }

  return rows[0].id;
}

async function assertEmailIsAvailable(connection, email) {
  const [rows] = await connection.execute('SELECT id FROM usuarios WHERE email = ? LIMIT 1', [
    email
  ]);

  if (rows.length > 0) {
    throw new AuthServiceError(
      'EMAIL_ALREADY_EXISTS',
      'Não foi possível concluir o cadastro com este e-mail.',
      409
    );
  }
}

function isDuplicateEmailError(error) {
  return error && error.code === 'ER_DUP_ENTRY';
}

function createSafeUser(user) {
  return {
    id: user.id,
    nome_exibicao: user.nome_exibicao,
    email: user.email,
    status: user.status
  };
}

function createInvalidCredentialsError() {
  return new AuthServiceError(
    'INVALID_CREDENTIALS',
    'E-mail ou senha inválidos.',
    401
  );
}

async function registerUser(data) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    await assertEmailIsAvailable(connection, data.email);
    const tipoUsuarioId = await findUserRoleId(connection);
    const senhaHash = await argon2.hash(data.senha, { type: argon2.argon2id });

    const [userResult] = await connection.execute(
      `INSERT INTO usuarios
        (tipo_usuario_id, nome_exibicao, email, senha_hash, maior_18, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        tipoUsuarioId,
        data.nome_exibicao,
        data.email,
        senhaHash,
        data.maior_18,
        ACTIVE_STATUS
      ]
    );

    await connection.execute('INSERT INTO perfis (usuario_id) VALUES (?)', [
      userResult.insertId
    ]);

    await connection.commit();

    return {
      id: userResult.insertId,
      nome_exibicao: data.nome_exibicao,
      email: data.email,
      status: ACTIVE_STATUS
    };
  } catch (error) {
    await connection.rollback();

    if (isDuplicateEmailError(error)) {
      throw new AuthServiceError(
        'EMAIL_ALREADY_EXISTS',
        'Não foi possível concluir o cadastro com este e-mail.',
        409
      );
    }

    throw error;
  } finally {
    connection.release();
  }
}

async function loginUser(data) {
  const [rows] = await pool.execute(
    `SELECT id, nome_exibicao, email, senha_hash, status
     FROM usuarios
     WHERE email = ?
       AND status = ?
     LIMIT 1`,
    [data.email, ACTIVE_STATUS]
  );

  if (rows.length === 0) {
    throw createInvalidCredentialsError();
  }

  const user = rows[0];
  const passwordMatches = await argon2.verify(user.senha_hash, data.senha);

  if (!passwordMatches) {
    throw createInvalidCredentialsError();
  }

  const session = await createSession(user.id);

  return {
    user: createSafeUser(user),
    token: session.token
  };
}

module.exports = {
  AuthServiceError,
  loginUser,
  registerUser
};
