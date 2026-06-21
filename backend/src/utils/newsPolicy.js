const MAX_NEWS_PER_SYNC = 15;
const MIN_DESIRED_NEWS_PER_SYNC = 5;
const PRIMARY_WINDOW_DAYS = 30;
const FALLBACK_WINDOW_DAYS = 90;
const RECENT_BONUS_DAYS = 7;
const MIN_RELEVANCE_SCORE = 1;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

const MANDATORY_TOPIC_TERMS = [
  'autismo',
  'autista',
  'autistas',
  'tea',
  'transtorno do espectro autista',
  'neurodiversidade',
  'neurodivergente',
  'desenvolvimento infantil',
  'deficiencia',
  'pessoa com deficiencia',
  'inclusao',
  'educacao inclusiva',
  'acessibilidade'
];

const HIGH_RELEVANCE_TERMS = [
  'autismo',
  'autista',
  'autistas',
  'tea',
  'transtorno do espectro autista',
  'neurodiversidade',
  'neurodivergente'
];

const MEDIUM_RELEVANCE_TERMS = [
  'desenvolvimento infantil',
  'deficiencia',
  'pessoa com deficiencia',
  'inclusao',
  'educacao inclusiva',
  'acessibilidade'
];

const BRAZILIAN_SOURCES = new Set([
  'fiocruz',
  'ministerio da saude'
]);

const REGIONAL_SOURCES = new Set([
  'opas'
]);

const PORTUGUESE_MARKERS = [
  'a',
  'as',
  'brasil',
  'brasileira',
  'brasileiro',
  'com',
  'da',
  'das',
  'de',
  'desenvolvimento',
  'do',
  'dos',
  'e',
  'em',
  'ministerio',
  'na',
  'nacional',
  'no',
  'o',
  'os',
  'para',
  'publica',
  'saude',
  'sobre',
  'sus'
];

function normalizeText(value) {
  if (!value || typeof value !== 'string') {
    return '';
  }

  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function includesTerm(normalizedText, term) {
  const normalizedTerm = normalizeText(term);

  if (!normalizedTerm) {
    return false;
  }

  if (normalizedTerm.length <= 3 && !normalizedTerm.includes(' ')) {
    const termPattern = new RegExp(`(^|\\s)${normalizedTerm}(\\s|$)`);
    return termPattern.test(normalizedText);
  }

  return normalizedText.includes(normalizedTerm);
}

function hasPortugueseMarkers(news) {
  const normalizedBody = normalizeText(`${news.titulo || ''} ${news.resumo || ''}`);
  const words = new Set(normalizedBody.split(' ').filter(Boolean));

  return PORTUGUESE_MARKERS.some((marker) => words.has(marker));
}

function hasMandatoryTopicTerm(news) {
  const normalizedBody = normalizeText(`${news.titulo || ''} ${news.resumo || ''}`);

  return MANDATORY_TOPIC_TERMS.some((term) => includesTerm(normalizedBody, term));
}

function getPublishedDate(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  if (!value || typeof value !== 'string') {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function isWithinDays(date, now, dayLimit) {
  const ageInMs = now.getTime() - date.getTime();

  return ageInMs >= 0 && ageInMs <= dayLimit * DAY_IN_MS;
}

function getWindowPriority(date, now) {
  if (isWithinDays(date, now, PRIMARY_WINDOW_DAYS)) {
    return 0;
  }

  if (isWithinDays(date, now, FALLBACK_WINDOW_DAYS)) {
    return 1;
  }

  return 2;
}

function getSourceScore(sourceName) {
  const normalizedSource = normalizeText(sourceName);

  if (BRAZILIAN_SOURCES.has(normalizedSource)) {
    return 2;
  }

  if (REGIONAL_SOURCES.has(normalizedSource)) {
    return 1;
  }

  return 0;
}

function getTermScore(news) {
  const normalizedBody = normalizeText(`${news.titulo || ''} ${news.resumo || ''}`);
  let score = 0;

  for (const term of HIGH_RELEVANCE_TERMS) {
    if (includesTerm(normalizedBody, term)) {
      score += 5;
    }
  }

  for (const term of MEDIUM_RELEVANCE_TERMS) {
    if (includesTerm(normalizedBody, term)) {
      score += 2;
    }
  }

  return score;
}

function scoreNewsCandidate(news, source, now = new Date()) {
  if (!news || !news.url_original) {
    return {
      accepted: false,
      reason: 'invalid_url',
      score: 0
    };
  }

  if (!hasPortugueseMarkers(news)) {
    return {
      accepted: false,
      reason: 'non_portuguese',
      score: 0
    };
  }

  if (!hasMandatoryTopicTerm(news)) {
    return {
      accepted: false,
      reason: 'missing_topic_term',
      score: 0
    };
  }

  const publishedDate = getPublishedDate(news.publicada_em);

  if (!publishedDate) {
    return {
      accepted: false,
      reason: 'invalid_date',
      score: 0
    };
  }

  if (publishedDate.getTime() > now.getTime()) {
    return {
      accepted: false,
      reason: 'future_date',
      score: 0,
      publishedDate
    };
  }

  let score = getTermScore(news) + getSourceScore(source.nome);

  if (isWithinDays(publishedDate, now, RECENT_BONUS_DAYS)) {
    score += 1;
  }

  if (score < MIN_RELEVANCE_SCORE) {
    return {
      accepted: false,
      reason: 'low_relevance',
      score,
      publishedDate
    };
  }

  return {
    accepted: true,
    score,
    publishedDate,
    windowPriority: getWindowPriority(publishedDate, now)
  };
}

module.exports = {
  MAX_NEWS_PER_SYNC,
  MIN_DESIRED_NEWS_PER_SYNC,
  scoreNewsCandidate
};
