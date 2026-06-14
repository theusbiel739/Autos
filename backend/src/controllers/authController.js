const {
  SESSION_COOKIE_NAME,
  getClearSessionCookieOptions,
  getSessionCookieOptions,
  revokeSessionByToken
} = require('../services/sessionService');
const { AuthServiceError, loginUser, registerUser } = require('../services/authService');
const { validateLoginPayload, validateRegisterPayload } = require('../validators/authValidator');

async function register(req, res) {
  const validation = validateRegisterPayload(req.body);

  if (!validation.isValid) {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'Dados inválidos.',
      details: validation.errors
    });
  }

  try {
    const user = await registerUser(validation.data);

    return res.status(201).json({
      message: 'Cadastro realizado com sucesso.',
      user
    });
  } catch (error) {
    if (error instanceof AuthServiceError) {
      return res.status(error.statusCode).json({
        error: error.code,
        message: error.message
      });
    }

    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Não foi possível concluir o cadastro.'
    });
  }
}

async function login(req, res) {
  const validation = validateLoginPayload(req.body);

  if (!validation.isValid) {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'Dados inválidos.',
      details: validation.errors
    });
  }

  try {
    const { user, token } = await loginUser(validation.data);

    res.cookie(SESSION_COOKIE_NAME, token, getSessionCookieOptions());

    return res.status(200).json({
      message: 'Login realizado com sucesso.',
      user
    });
  } catch (error) {
    if (error instanceof AuthServiceError) {
      return res.status(error.statusCode).json({
        error: error.code,
        message: error.message
      });
    }

    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Não foi possível concluir o login.'
    });
  }
}

function me(req, res) {
  return res.status(200).json({
    user: req.user
  });
}

async function logout(req, res) {
  const token = req.cookies ? req.cookies[SESSION_COOKIE_NAME] : null;

  try {
    await revokeSessionByToken(token);

    res.clearCookie(SESSION_COOKIE_NAME, getClearSessionCookieOptions());

    return res.status(200).json({
      message: 'Logout realizado com sucesso.'
    });
  } catch (error) {
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Não foi possível concluir o logout.'
    });
  }
}

module.exports = {
  login,
  logout,
  me,
  register
};
