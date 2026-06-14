const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function createValidationError(field, message) {
  return { field, message };
}

function validateRegisterPayload(payload = {}) {
  const errors = [];

  const nomeExibicao =
    typeof payload.nome_exibicao === 'string' ? payload.nome_exibicao.trim() : '';
  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
  const senha = typeof payload.senha === 'string' ? payload.senha : '';
  const confirmarSenha =
    typeof payload.confirmar_senha === 'string' ? payload.confirmar_senha : '';

  if (!nomeExibicao) {
    errors.push(createValidationError('nome_exibicao', 'Nome de exibição é obrigatório.'));
  } else {
    if (nomeExibicao.length < 2) {
      errors.push(
        createValidationError('nome_exibicao', 'Nome de exibição deve ter pelo menos 2 caracteres.')
      );
    }

    if (nomeExibicao.length > 80) {
      errors.push(
        createValidationError('nome_exibicao', 'Nome de exibição deve ter no máximo 80 caracteres.')
      );
    }
  }

  if (!email) {
    errors.push(createValidationError('email', 'E-mail é obrigatório.'));
  } else {
    if (email.length > 255) {
      errors.push(createValidationError('email', 'E-mail deve ter no máximo 255 caracteres.'));
    }

    if (!EMAIL_REGEX.test(email)) {
      errors.push(createValidationError('email', 'E-mail inválido.'));
    }
  }

  if (!senha) {
    errors.push(createValidationError('senha', 'Senha é obrigatória.'));
  } else {
    if (senha.length < 8) {
      errors.push(createValidationError('senha', 'Senha deve ter pelo menos 8 caracteres.'));
    }

    if (senha.length > 128) {
      errors.push(createValidationError('senha', 'Senha deve ter no máximo 128 caracteres.'));
    }
  }

  if (!confirmarSenha) {
    errors.push(createValidationError('confirmar_senha', 'Confirmação de senha é obrigatória.'));
  } else if (senha && confirmarSenha !== senha) {
    errors.push(
      createValidationError('confirmar_senha', 'A confirmação de senha não confere.')
    );
  }

  if (payload.maior_18 !== true) {
    errors.push(
      createValidationError(
        'maior_18',
        'É necessário confirmar que você tem 18 anos ou mais.'
      )
    );
  }

  if (payload.aceite_termos !== true) {
    errors.push(createValidationError('aceite_termos', 'É necessário aceitar os termos.'));
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: {
      nome_exibicao: nomeExibicao,
      email,
      senha,
      maior_18: true
    }
  };
}

module.exports = {
  validateRegisterPayload
};
