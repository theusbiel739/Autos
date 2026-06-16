const BLOCKED_TERMS = [
  'termo_bloqueado',
  'palavra_proibida',
  'conteudo_ofensivo'
];

function normalizeText(value) {
  if (typeof value !== 'string') {
    return '';
  }

  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const blockedTermPatterns = BLOCKED_TERMS.map((term) => {
  const normalizedTerm = escapeRegex(normalizeText(term));

  return new RegExp(`(^|[^a-z0-9_])${normalizedTerm}(?=$|[^a-z0-9_])`);
});

function containsBlockedTerm(content) {
  const normalizedContent = normalizeText(content);

  return blockedTermPatterns.some((pattern) => pattern.test(normalizedContent));
}

module.exports = {
  containsBlockedTerm
};
