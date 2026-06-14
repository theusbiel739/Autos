# AUTÓS Back-end

API REST do AUTÓS com Node.js, Express e MySQL.

## Requisitos

- Node.js 18+
- MySQL local
- Banco local `autos_db`

## Configuracao local

Crie o arquivo `.env` a partir de `.env.example` e ajuste os valores locais quando necessario.

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Por padrao, a API usa a porta `3001`.

## Variaveis de ambiente

Variaveis principais usadas pelo back-end:

- `PORT`
- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `CORS_ORIGIN`

Nao coloque senhas reais no codigo-fonte e nao versione arquivos `.env`.

## Rotas atuais

```text
GET /api/health
```

Resposta esperada:

```json
{
  "status": "ok",
  "service": "autos-api"
}
```

```text
GET /api/db/health
```

Testa a conexao com o MySQL usando o pool configurado em `src/config/database.js`.

Resposta esperada em sucesso:

```json
{
  "status": "ok",
  "database": "connected"
}
```

Resposta esperada em falha:

```json
{
  "status": "error",
  "database": "unavailable"
}
```

Para testar localmente:

```bash
npm run dev
curl http://localhost:3001/api/health
curl http://localhost:3001/api/db/health
```

## Escopo atual

- Estrutura base do servidor
- Middlewares
- Tratamento de erros
- Conexao com MySQL

## Fora do escopo atual

- Login real
- Cadastro real
- Posts reais
- RSS
- Sessao/cookie real
