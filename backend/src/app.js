const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const routes = require('./routes');
const corsOptions = require('./middlewares/corsOptions');
const notFoundHandler = require('./middlewares/notFoundHandler');
const errorHandler = require('./middlewares/errorHandler');
const env = require('./config/env');

const app = express();
const projectRoot = path.resolve(__dirname, '..', '..');
const staticPages = new Set([
  'admin.html',
  'aprender.html',
  'artigos.html',
  'cadastro.html',
  'comunidade.html',
  'index.html',
  'informacoes.html',
  'login.html',
  'noticias.html',
  'perfil.html',
  'post.html',
  'produto.html',
  'sobre.html',
  'sobrenos.html'
]);

app.use(helmet());
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (env.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}

app.use('/api', routes);
app.use('/assets', express.static(path.join(projectRoot, 'assets')));
app.use('/images', express.static(path.join(projectRoot, 'images')));

app.get('/', (req, res) => {
  res.sendFile(path.join(projectRoot, 'index.html'));
});

app.get(['/manifest.json', '/service-worker.js'], (req, res) => {
  res.sendFile(path.join(projectRoot, req.path));
});

app.get('/:page', (req, res, next) => {
  if (!staticPages.has(req.params.page)) {
    return next();
  }

  return res.sendFile(path.join(projectRoot, req.params.page));
});

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
