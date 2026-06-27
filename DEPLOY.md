# Deploy MVP do AUTOS

Este guia prepara o deploy MVP do AUTOS na Render. Ele nao executa deploy, commit ou push.

## Estrategia recomendada

- Hospedar o back-end como um Render Web Service.
- Servir o front-end estatico pelo proprio Express no mesmo dominio.
- Manter MySQL como banco de dados.
- Usar `/api` como prefixo de todas as rotas da API.

Com essa estrategia, o navegador acessa o front-end e a API pelo mesmo host Render. Isso simplifica cookies HttpOnly, CORS e chamadas autenticadas.

## Render Web Service

Configurar o servico apontando para o repositorio do AUTOS:

```text
Root Directory: backend
Build Command: npm install
Start Command: npm start
Health Check Path: /api/health
```

O servidor Express usa `process.env.PORT` e faz bind em `0.0.0.0`, como esperado para web services na Render.

## Variaveis de ambiente

Configurar no painel da Render:

```text
NODE_ENV=production
PORT=10000
DB_HOST=<host-do-mysql>
DB_PORT=3306
DB_USER=<usuario-do-mysql>
DB_PASSWORD=<senha-do-mysql>
DB_NAME=autos_db
CORS_ORIGIN=<url-publica-do-servico-render>
CRON_SECRET=<segredo-longo-para-cron>
```

Nao versionar valores reais. O arquivo local `.env` deve continuar ignorado pelo Git.

## Banco de dados

O AUTOS usa MySQL. Para producao, escolher uma destas opcoes:

- MySQL em private service na Render com Docker e disco persistente.
- MySQL externo gerenciado por outro provedor.

Depois de provisionar o banco, aplicar:

```bash
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < database/schema.sql
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < database/seeds.sql
```

Evitar imprimir senhas em logs, historico de shell ou mensagens.

## Checklist antes do 31B

- Confirmar que `backend/.env.example` lista todas as variaveis usadas.
- Confirmar que o banco MySQL de producao esta criado e acessivel pelo web service.
- Confirmar que `/api/health` responde depois do deploy.
- Confirmar que `/api/db/health` responde `database: connected`.
- Confirmar login e cookie `autos_session` em HTTPS.
- Confirmar que `/api/*` continua fora do cache do service worker.
- Confirmar que o cron RSS so funciona com `x-cron-secret` correto.

## Fora do escopo do 31A

- Deploy real.
- Commit ou push.
- Instalacao de dependencias.
- Troca de MySQL por Postgres.
- Alteracao de regras de negocio, controllers, services, validators, schema ou seeds.
