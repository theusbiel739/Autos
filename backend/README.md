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

## Rota de teste

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

## Escopo desta etapa

Esta base prepara a estrutura do servidor, rotas, middlewares, tratamento de erros e conexao futura com MySQL. Login, cadastro, posts, noticias RSS e autenticacao ainda nao foram implementados.
