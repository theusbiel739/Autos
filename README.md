# AUTÓS

AUTÓS é uma plataforma sobre autismo/TEA, criada para reunir informação, comunidade e recursos de apoio em uma experiência web simples e acessível.

## Stack atual

- HTML, CSS e JavaScript puro
- Bootstrap 5
- Node.js com Express
- MySQL
- API REST

## Estrutura do projeto

- Paginas HTML na raiz do projeto
- `assets/`: arquivos de estilo, scripts e recursos estaticos
- `database/`: scripts SQL do banco de dados
- `backend/`: API REST com Node.js e Express

## Como rodar o back-end

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Por padrao, a API roda em `http://localhost:3001`.

## Rotas atuais

```text
GET /api/health
GET /api/db/health
```

## Banco de dados

- Banco local: `autos_db`
- Schema: `database/schema.sql`
- Dados iniciais: `database/seeds.sql`

## Escopo futuro

- Autenticacao com sessao no servidor e cookie HttpOnly
- Noticias por RSS de fontes confiaveis
- Comunidade com posts, comentarios, curtidas e denuncias
- Painel administrativo real
- PWA

## Restrições técnicas

Neste momento, o AUTÓS não usa React, Angular, Next.js, MongoDB, PostgreSQL, GraphQL ou JWT.

## Segurança

- Não versionar arquivos `.env`
- Não colocar segredos no front-end
- Não armazenar senhas em texto puro

## Licença e créditos

O arquivo `LICENSE.txt` permanece no projeto para preservar créditos e licença do template original enquanto houver base herdada.
