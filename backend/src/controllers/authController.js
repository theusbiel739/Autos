const { AuthServiceError, registerUser } = require('../services/authService');
const { validateRegisterPayload } = require('../validators/authValidator');

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

module.exports = {
  register
};
