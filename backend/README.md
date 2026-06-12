# AUTOS Back-end

Base inicial da API REST do AUTOS com Node.js, Express e MySQL.

## Requisitos

- Node.js 18 ou superior
- MySQL local
- Banco de dados local `autos_db`

## Configuracao local

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Por padrao, a API usa a porta `3001`.

## Variaveis de ambiente

As configuracoes ficam no arquivo `.env`, criado localmente a partir de `.env.example`.
Nao coloque senhas reais no codigo-fonte.

## Rotas de teste

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

## Escopo desta etapa

Esta base prepara a estrutura do servidor, rotas, middlewares, tratamento de erros e conexao com MySQL. Login, cadastro, posts, noticias RSS e autenticacao ainda nao foram implementados.
