# Setup local do AUTOS

Este guia descreve como rodar o AUTOS localmente para desenvolvimento e validacao pre-deploy.

## Requisitos

- Node.js 18+
- npm
- MySQL
- Navegador moderno

## Estrutura

```text
/
  *.html                 Front-end estatico
  assets/                CSS, JavaScript e imagens da interface
  images/                Imagens herdadas/estaticas
  manifest.json          Manifest PWA
  service-worker.js      Cache estatico, sem cache de /api/*
  database/              schema.sql e seeds.sql
  backend/               API Express + MySQL
```

## Banco local

Criar o banco e aplicar schema/seeds:

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS autos_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p autos_db < database/schema.sql
mysql -u root -p autos_db < database/seeds.sql
```

## Back-end

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Por padrao, a API local roda em:

```text
http://localhost:3001/api
```

## Front-end local

Durante desenvolvimento, o front-end pode continuar sendo aberto por Live Server em `http://127.0.0.1:5500`. Nesse caso, `assets/js/api.js` usa automaticamente:

```text
http://127.0.0.1:3001/api
```

Em producao, quando o front-end e servido pelo Express, o mesmo arquivo usa:

```text
/api
```

## Variaveis de ambiente

O arquivo `backend/.env.example` lista as variaveis esperadas:

```text
NODE_ENV
PORT
DB_HOST
DB_PORT
DB_USER
DB_PASSWORD
DB_NAME
CORS_ORIGIN
CRON_SECRET
```

Nao coloque segredos reais em arquivos versionados.

## Checks uteis

```bash
node --check backend/src/app.js
node --check backend/src/server.js
node --check assets/js/api.js
git diff --check
git diff --stat
git status --short
```
